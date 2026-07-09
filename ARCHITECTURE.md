# Architecture

This document is the authoritative reference for the layered architecture of
the yt-dlp GUI. It is the contract every new file must respect.

## Layer map

```
┌──────────────────────────────────────────────────────────────────┐
│ Renderer (React, src/)                                            │
│   - Pure UI. Reads/writes through window.api only.                │
│   - No Node API surface. No electron import.                      │
└──────────────────────────────────────────────────────────────────┘
        ▲                       │ (typed contextBridge)
        │ Result<T> envelope    │
        ▼                       ▼
┌──────────────────────────────────────────────────────────────────┐
│ Preload (electron/preload.ts)                                     │
│   - Thin typed adapter: ipcRenderer.invoke → Promise<T>          │
│   - Translates Result envelope into either resolved data or a    │
│     typed Error that preserves `{ code, message, details }`.     │
│   - Whitelisted channels for event subscriptions.                │
└──────────────────────────────────────────────────────────────────┘
        ▲                       │
        │ Result<T> envelope    │ ipcMain.handle(...)
        ▼                       ▼
┌──────────────────────────────────────────────────────────────────┐
│ IPC Handlers (electron/ipc/<area>/index.ts)                       │
│   - One folder per area: downloads, history, settings, system,    │
│     dialog, queue.                                                │
│   - Validates every payload with Zod.                             │
│   - Maps service exceptions to AppError via iperr helpers.        │
│   - Returns Result<T> envelope.                                   │
└──────────────────────────────────────────────────────────────────┘
        ▲                       │
        │ Result<T>             │ service method calls
        ▼                       ▼
┌──────────────────────────────────────────────────────────────────┐
│ Services (electron/services/)                                     │
│   - QueueService, HistoryService, SettingsService,                │
│     DownloadRuntime (process spawn), RuntimeInfo (versions).     │
│   - Owns business logic. NEVER imports electron. NEVER writes SQL.│
│   - Receives EventSink via constructor (testable).                │
│   - Receives its dependencies (repositories) via constructor.     │
└──────────────────────────────────────────────────────────────────┘
        ▲                       │
        │ typed promises        │ repository method calls
        ▼                       ▼
┌──────────────────────────────────────────────────────────────────┐
│ Repositories (electron/database/repositories/)                    │
│   - QueueRepository, HistoryRepository, SettingsRepository.              │
│   - The ONLY place SQL is allowed.                                │
│   - Accepts a better-sqlite3 Database instance via constructor.   │
│   - Prepared statements cached as module-private fields.          │
│   - Exposes `transaction(fn)` for atomic multi-step work.         │
└──────────────────────────────────────────────────────────────────┘
        ▲
        │ better-sqlite3 binding
        ▼
┌──────────────────────────────────────────────────────────────────┐
│ Database (electron/database/connection.ts) + Migrations           │
│                                                          + Backup │
│   - Opens WAL-mode sqlite. Sets FK + busy_timeout pragmas.        │
│   - Runs migrations on init. migrations table is source of truth. │
│   - On startup, writes a timestamped copy of the DB (with         │
│     rotation, kept last 5).                                        │
└──────────────────────────────────────────────────────────────────┘
```

## Strict rules

1. **No `any`** in shared/, services/, repositories/, ipc/, preload.ts.
   Renderer code is allowed to use `any` only inside feature/ files where
   the API is genuinely dynamic, and never on the public `api.*` surface.

2. **No SQL** outside `database/`. If you need a query, add a method to the
   appropriate repository.

3. **No `electron` imports** outside `main.ts`, `preload.ts`, ipc/*
   (for `ipcMain`/`WebContents`/`BrowserWindow`/`dialog`/`shell` only),
   `services/event-bus.ts` (the ElectronEventSink adapter), and the
   security/ folder.

4. **Every IPC handler** validates input with Zod and returns a Result.

5. **Every service method** returns `Result<T>` for fallible paths, never
   throws across its public surface.

6. **Repositories** never throw to callers for expected conditions (use
   `Result<T>`). They throw only for unrecoverable corruption.

7. **Migrations** are forward-only. Never edit a landed migration. Append.

## Adding a new feature (checklist)

- [ ] Add a Zod schema in `shared/types.ts` (or `shared/<feature>.ts`).
- [ ] Add a migration in `database/migrations.ts` (schema-only change).
- [ ] Add a method to the appropriate repository (or create one).
- [ ] Add a method to the appropriate service.
- [ ] Add an IPC handler under `electron/ipc/<area>/index.ts`.
- [ ] Add the channel constant to `shared/ipc-channels.ts`.
- [ ] Add the preload binding in `electron/preload.ts`.
- [ ] Update `ElectronAPI` in `shared/types.ts`.
- [ ] Write a test under the new file (co-located `*.test.ts`).
- [ ] Update `src/features/<feature>/` to use the new binding.

## Eventing

Services emit renderer-visible events through a single `EventSink`:

```ts
interface EventSink {
  send(channel: string, ...args: unknown[]): void
}
```

`main.ts` constructs an `ElectronEventSink` that wraps the active
`WebContents`. Test code substitutes a recording `InMemoryEventSink`.

Channel strings come exclusively from `shared/ipc-channels.ts`.
