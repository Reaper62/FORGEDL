// ponytail: CSP applied via session headers — one place, strict defaults
import { session } from 'electron'

export function applyCSP(): void {
  const hasDevServer = process.env.VITE_DEV_SERVER_URL != null

  // In dev mode with the Vite dev server, Vite injects inline scripts for
  // React Fast Refresh preamble. Blocking these causes a top-level error
  // that halts ALL JS execution.
  // We also need unsafe-eval for Vite's dev source maps / dependency resolution.
  // When loading from file:// (electron:dev build or packaged), CSP is not
  // enforced by Electron's webRequest for file:// URLs, so 'unsafe-inline'
  // is not needed.
  const scriptSrc = hasDevServer
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
    : "script-src 'self'; "

  // connect-src uses 'self' which resolves to the page origin, covering
  // Vite's HMR WebSocket. The explicit origins are kept for clarity.
  const connectSrc = hasDevServer
    ? "connect-src 'self' ws://localhost:* http://localhost:*; "
    : "connect-src 'self'; "

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; " +
            scriptSrc +
            "style-src 'self' 'unsafe-inline'; " +
            "img-src 'self' data: https:; " +
            connectSrc +
            "font-src 'self'; " +
            "object-src 'none'; " +
            "base-uri 'none'; " +
            "form-action 'none'; " +
            "frame-ancestors 'none'",
        ],
      },
    })
  })
}
