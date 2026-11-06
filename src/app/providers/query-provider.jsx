import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { isApiError } from '@/lib/api-error'
import { env } from '@/lib/env'

/** Query keys that should never be retried: auth failures are not transient. */
function shouldRetry(failureCount, error) {
  if (isApiError(error)) {
    // Never retry client errors (4xx) — retrying will not change the answer.
    if (error.status && error.status >= 400 && error.status < 500) return false
    if (error.isCanceled) return false
  }
  return failureCount < 2
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: shouldRetry,
        refetchOnWindowFocus: env.isProd,
        refetchOnReconnect: true,
        refetchOnMount: true,
        // Avoid refetch storms on flaky connections.
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
      },
      mutations: {
        // Writes are never retried automatically: they are not idempotent.
        retry: false,
      },
    },
  })
}

/**
 * Provides the TanStack Query client.
 *
 * One client per browser session; created lazily so tests and HMR get a fresh
 * cache without leaking listeners.
 */
export function QueryProvider({ children, client }) {
  const [queryClient] = useState(() => client ?? createQueryClient())
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
