// Service container — composes repositories, runtime, and event sinks
// into the three primary services. Single composition point for the
// application bootstrap and tests.
import { getRepositories, type Repositories } from '../database/repositories'
import { QueueService } from './QueueService'
import { HistoryService } from './HistoryService'
import { SettingsService } from './SettingsService'
import { DownloadRuntime } from './download-runtime'
import { NoopEventSink, type EventSink } from './event-bus'

export interface Services {
  queue: QueueService
  history: HistoryService
  settings: SettingsService
  runtime: DownloadRuntime
}

export interface Overrides {
  repositories?: Repositories
  runtime?: DownloadRuntime
  events?: EventSink
}

let cached: Services | null = null

export function resetServicesCache(): void {
  cached = null
}

export function buildServices(overrides: Overrides = {}): Services {
  const repositories = overrides.repositories ?? getRepositories()
  const runtime = overrides.runtime ?? new DownloadRuntime()
  const events = overrides.events ?? new NoopEventSink()

  cached = {
    queue: new QueueService({
      queueRepo: repositories.queue,
      historyRepo: repositories.history,
      runtime,
      events,
    }),
    history: new HistoryService({ historyRepo: repositories.history }),
    settings: new SettingsService({ settingsRepo: repositories.settings }),
    runtime,
  }
  return cached
}

export function getServices(): Services {
  if (!cached) {
    throw new Error(
      'Services not built. Call buildServices() in app.whenReady() before any IPC handler.',
    )
  }
  return cached
}
