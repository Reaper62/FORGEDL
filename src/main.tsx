import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { router } from './router'
import { ErrorBoundary } from './components/ErrorBoundary'
import { StartupHealth } from './components/StartupHealth'
import { Toaster } from 'sonner'
import './index.css'

const rootEl = document.getElementById('root')
if (!rootEl) {
  throw new Error('Root element not found — cannot mount React application')
}

const root = ReactDOM.createRoot(rootEl)

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <StartupHealth />
      <RouterProvider router={router} />
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#171717',
            border: '1px solid #262626',
            color: '#f9fafb',
          },
        }}
      />
    </ErrorBoundary>
  </React.StrictMode>,
)
