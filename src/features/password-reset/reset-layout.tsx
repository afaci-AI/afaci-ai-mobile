import type { LucideIcon } from 'lucide-react-native'
import type { ReactNode } from 'react'

import { Box } from '@/shared/ui/box'
import { Heading } from '@/shared/ui/heading'
import { Icon } from '@/shared/ui/icon'
import { Card, Header, Screen } from '@/shared/ui/kit'
import { KeyboardAvoidingView } from '@/shared/ui/keyboard-avoiding-view'
import { ScrollView } from '@/shared/ui/scroll-view'
import { Text } from '@/shared/ui/text'
import { FontSize } from '@/shared/theme/font-sizes'

/** Общий каркас экранов восстановления: шапка, иконка, заголовок, карточка. */
export function ResetLayout({
  header = 'Восстановление пароля',
  icon,
  title,
  subtitle,
  onBack,
  children,
}: {
  header?: string
  icon: LucideIcon
  title: string
  subtitle: ReactNode
  onBack: () => void
  children: ReactNode
}) {
  return (
    <KeyboardAvoidingView className="flex-1" behavior="padding">
      <Screen>
        <Header title={header} onBack={onBack} />
        <ScrollView
          className="flex-1"
          contentContainerClassName="grow justify-center p-4"
          keyboardShouldPersistTaps="handled"
        >
          <Card className="gap-6">
            <Box className="items-center gap-2">
              <Box className="mb-1 h-12 w-12 items-center justify-center rounded-lg bg-primary">
                <Icon as={icon} size="lg" className="text-primary-foreground" />
              </Box>
              <Heading
                size={FontSize.xxl}
                className="text-center text-card-foreground"
              >
                {title}
              </Heading>
              <Text
                size={FontSize.sm}
                className="text-center text-muted-foreground"
              >
                {subtitle}
              </Text>
            </Box>
            {children}
          </Card>
        </ScrollView>
      </Screen>
    </KeyboardAvoidingView>
  )
}

export function ErrorBox({ message }: { message: string }) {
  if (!message) return null
  return (
    <Box className="rounded-md border border-destructive/40 bg-destructive/10 p-3">
      <Text size={FontSize.sm} className="text-destructive-text">
        {message}
      </Text>
    </Box>
  )
}
