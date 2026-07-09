// EventSink — the abstraction services emit renderer-visible events through.
// main.ts injects ElectronEventSink at app startup; tests inject
// InMemoryEventSink. Services never import `electron`.
export interface EventSink {
  /** Synchronous fan-out. Returned Promise is intentionally absent because
   *  WebContents.send is fire-and-forget; tests are synchronous too. */
  send(channel: string, ...args: unknown[]): void
  /** No-op for non-electron sinks. Electron sink noops when there are no
   *  windows attached. */
  isReady(): boolean
}

export class InMemoryEventSink implements EventSink {
  private events: { channel: string; args: unknown[] }[] = []

  send(channel: string, ...args: unknown[]): void {
    this.events.push({ channel, args })
  }

  isReady(): boolean {
    return true
  }

  take(): { channel: string; args: unknown[] }[] {
    const out = this.events
    this.events = []
    return out
  }

  history(): { channel: string; args: unknown[] }[] {
    return [...this.events]
  }

  clear(): void {
    this.events = []
  }
}

export class NoopEventSink implements EventSink {
  send(_channel: string, ..._args: unknown[]): void {
    /* no-op */
  }
  isReady(): boolean {
    return false
  }
}
