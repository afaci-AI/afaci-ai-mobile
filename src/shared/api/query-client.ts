import { QueryClient } from '@tanstack/react-query'

/**
 * Единый кэш запросов. Вынесен из провайдера, чтобы logout мог очистить его
 * без доступа к React-дереву.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
})
