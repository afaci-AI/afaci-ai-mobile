import { create } from 'zustand'
import { useSession } from '@/shared/session/store'
import type { ComputeResult } from './types'

export const useCalculatorReport = create<{
  ownerId: string | null
  result: ComputeResult | null
}>(() => ({ ownerId: null, result: null }))
useSession.subscribe((next, previous) => {
  if (next.status !== 'authenticated' || next.user?.id !== previous.user?.id) {
    useCalculatorReport.setState({ ownerId: null, result: null })
  }
})
