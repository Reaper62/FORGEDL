import { Suspense, lazy, useEffect } from 'react'
import {
  createRouter,
  createRoute,
  createRootRoute,
  Outlet,
  useRouterState,
  Link,
} from '@tanstack/react-router'
import { LayoutDashboard, Settings, Clock, Loader2 } from 'lucide-react'
import { useAppStore } from './store'
import { PostBanner } from './components/PostBanner'
import { KeyboardShortcuts } from './components/KeyboardShortcuts'

// Eagerly load Dashboard (first screen) for fast startup
import { Dashboard } from './features/Dashboard'

// Lazy load settings for code splitting
const SettingsPage = lazy(() =>
  import('./features/Settings').then((m) => ({ default: m.Settings })),
)
const HistoryPage = lazy(() => import('./features/History').then((m) => ({ default: m.History })))

function Sidebar() {
  const router = useRouterState()
  const currentPath = router.location.pathname

  const links = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/history', label: 'History', icon: Clock },
    { to: '/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <div className="w-60 border-r border-neutral-800 bg-neutral-950 flex flex-col h-full">
      <div className="p-5 border-b border-neutral-800">
        <h1 className="text-lg font-bold text-white tracking-tight font-grotesk">FORGERDL</h1>
        <p className="text-xs text-neutral-500 mt-0.5">Video Download Manager</p>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {links.map(({ to, label, icon: Icon }) => {
          const isActive = currentPath === to
          return (
            <Link
              key={to}
              to={to}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ease-out ${
                isActive
                  ? 'bg-brand-muted text-brand border border-brand/30 scale-[1.02]'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50 hover:translate-x-1'
              }`}
            >
              <Icon
                className={`w-4 h-4 transition-transform duration-200 ${isActive ? 'text-brand scale-110' : 'group-hover:scale-110'}`}
              />
              {label}
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand animate-scale-bounce" />
              )}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-neutral-800">
        <p className="text-xs text-neutral-600 text-center">FORGERDL v1.0.0</p>
      </div>
    </div>
  )
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
        <p className="text-sm text-neutral-500">Loading...</p>
      </div>
    </div>
  )
}

const rootRoute = createRootRoute({
  component: () => {
    const loadSettings = useAppStore((s) => s.loadSettings)
    const routerState = useRouterState()

    useEffect(() => {
      loadSettings()
    }, [loadSettings])

    return (
      <div className="flex h-screen w-screen bg-neutral-950 text-white font-sans overflow-hidden">
        <Sidebar />
        <div className="flex-1 overflow-auto">
          <div className="p-8 min-h-full">
            <PostBanner />
            <Suspense fallback={<PageLoader />}>
              <div className="animate-page-enter" key={routerState.location.pathname}>
                <Outlet />
              </div>
            </Suspense>
            <KeyboardShortcuts />
          </div>
        </div>
      </div>
    )
  },
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => <Dashboard />,
})

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: () => <SettingsPage />,
})

const historyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/history',
  component: () => <HistoryPage />,
})

const routeTree = rootRoute.addChildren([indexRoute, settingsRoute, historyRoute])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
