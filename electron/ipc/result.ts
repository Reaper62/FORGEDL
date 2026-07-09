// IPC-layer Result types. Kept separate from services so handlers can
// reference the IPC boundary type without dragging in service signatures.
import type { AppError, Result } from '../../shared/result'

export type { AppError, Result, ErrorCode } from '../../shared/result'
export { ok, err, unwrap } from '../../shared/result'

/** Wire shape: what actually crosses the IPC bridge. */
export type Envelope<T> = { ok: true; data: T } | { ok: false; error: AppError }

export const wrap = <T>(r: Result<T>): Envelope<T> => r
