import {
  Toast,
  ToastDescription,
  ToastTitle,
  useToast,
} from '@/shared/ui/toast'
import { VStack } from '@/shared/ui/vstack'

type ToastAction = 'error' | 'warning' | 'success' | 'info' | 'muted'

interface ToastMessage {
  title: string
  description?: string
}

/** Тонкая обёртка над gluestack Toast с единым видом сообщений. */
export function useAppToast() {
  const toast = useToast()

  const show = (action: ToastAction, { title, description }: ToastMessage) => {
    toast.show({
      placement: 'top',
      duration: 3000,
      render: ({ id }) => (
        <Toast nativeID={`toast-${id}`} action={action} variant="solid">
          <VStack space="xs">
            <ToastTitle>{title}</ToastTitle>
            {description ? (
              <ToastDescription>{description}</ToastDescription>
            ) : null}
          </VStack>
        </Toast>
      ),
    })
  }

  return {
    success: (message: ToastMessage) => show('success', message),
    error: (message: ToastMessage) => show('error', message),
    info: (message: ToastMessage) => show('info', message),
  }
}
