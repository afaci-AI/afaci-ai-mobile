import { useQuery } from '@tanstack/react-query'

import { request } from '@/shared/api/client'

import type { DailyNorms, Source } from './types'

export function useSources() {
  return useQuery({
    queryKey: ['norms', 'sources'],
    queryFn: () => request<Source[]>('/sources', { authenticated: false }),
    staleTime: 5 * 60_000,
  })
}

/** Суточные нормы и доля от нормы для 100 г продукта; считаются на backend. */
export function useProductDailyNorms(productId: string) {
  return useQuery({
    queryKey: ['norms', 'product', productId],
    queryFn: () =>
      request<DailyNorms>(
        `/products/${encodeURIComponent(productId)}/daily-norms`,
        { authenticated: false },
      ),
    enabled: Boolean(productId),
    staleTime: 5 * 60_000,
  })
}
