import { useState, type PropsWithChildren } from 'react'

import { OptionalUpdateDialog, RequiredUpdateScreen } from './update-screens'
import { useAppUpdate } from './use-app-update'

/**
 * Проверяет опубликованную версию. Обязательное обновление закрывает
 * приложение экраном установки, необязательное — показывает окно один раз
 * за запуск для каждой новой версии.
 */
export function AppUpdateGate({ children }: PropsWithChildren) {
  const { info, kind, openDownload, openError } = useAppUpdate()
  const [dismissedCode, setDismissedCode] = useState<number | null>(null)

  if (info && kind === 'required') {
    return (
      <RequiredUpdateScreen
        info={info}
        error={openError}
        onDownload={() => void openDownload()}
      />
    )
  }

  return (
    <>
      {children}
      {info && kind === 'optional' ? (
        <OptionalUpdateDialog
          info={info}
          error={openError}
          isOpen={dismissedCode !== info.versionCode}
          onDownload={() => void openDownload()}
          onClose={() => setDismissedCode(info.versionCode)}
        />
      ) : null}
    </>
  )
}
