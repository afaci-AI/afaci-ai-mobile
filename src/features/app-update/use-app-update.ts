import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useState } from 'react'
import { AppState, Linking } from 'react-native'

import { fetchAppVersion, resolveApkUrl } from './api'
import { installedVersionCode, updateKind } from './update-policy'

const RECHECK_MS = 30 * 60_000

/** Проверка обновлений при запуске и при возврате в приложение. */
export function useAppUpdate() {
  const query = useQuery({
    queryKey: ['app-version'],
    queryFn: fetchAppVersion,
    staleTime: RECHECK_MS,
    retry: 1,
  })
  const { refetch } = query
  const [openError, setOpenError] = useState<string | null>(null)

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refetch()
    })
    return () => subscription.remove()
  }, [refetch])

  const info = query.data ?? null
  const kind = updateKind(info, installedVersionCode())

  const openDownload = useCallback(async () => {
    if (!info) return
    setOpenError(null)
    try {
      await Linking.openURL(resolveApkUrl(info.apkUrl))
    } catch {
      setOpenError(
        'Не удалось открыть ссылку. Проверьте, что на телефоне есть браузер, и повторите.',
      )
    }
  }, [info])

  return { info, kind, openDownload, openError }
}
