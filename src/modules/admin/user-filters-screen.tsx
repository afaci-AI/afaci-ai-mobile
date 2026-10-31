import { useRouter } from 'expo-router'
import { useState } from 'react'

import { Heading } from '@/shared/ui/heading'
import { HStack } from '@/shared/ui/hstack'
import { Button, Chip, Header, Screen } from '@/shared/ui/kit'
import { ScrollView } from '@/shared/ui/scroll-view'
import { VStack } from '@/shared/ui/vstack'
import { useAdminUserFilters } from './user-filters-store'
import { userRoles, userStatuses } from './users-api'
import { FontSize } from '@/shared/theme/font-sizes'

/** Как в базе продуктов: Back отменяет черновик, «Показать» применяет. */
export default function AdminUserFiltersScreen() {
  const router = useRouter()
  const storedRole = useAdminUserFilters((state) => state.role)
  const storedStatus = useAdminUserFilters((state) => state.status)
  const setSelection = useAdminUserFilters((state) => state.setSelection)
  const [role, setRole] = useState(storedRole)
  const [status, setStatus] = useState(storedStatus)
  const activeCount = [role, status].filter(Boolean).length
  const goBack = () => {
    if (router.canGoBack()) router.back()
    else router.replace('/admin/users')
  }
  function renderGroup(
    title: string,
    allLabel: string,
    options: { value: string; label: string }[],
    value: string,
    onChange: (value: string) => void,
  ) {
    return (
      <VStack space="sm">
        <Heading size={FontSize.sm} className="text-foreground">
          {title}
        </Heading>
        <HStack space="sm" className="flex-wrap gap-2">
          {[{ value: '', label: allLabel }, ...options].map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              selected={value === option.value}
              onPress={() => onChange(option.value)}
            />
          ))}
        </HStack>
      </VStack>
    )
  }
  return (
    <Screen edges={['top', 'bottom']}>
      <Header
        title="Фильтры"
        subtitle="Роль и статус пользователя"
        onBack={goBack}
      />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <VStack space="xl" className="px-4 py-4">
          {renderGroup('Роль', 'Все роли', userRoles, role, setRole)}
          {renderGroup(
            'Статус',
            'Все статусы',
            userStatuses,
            status,
            setStatus,
          )}
        </VStack>
      </ScrollView>
      <HStack
        space="sm"
        className="border-t border-border bg-background px-4 py-3"
      >
        <Button
          label="Сбросить"
          variant="outline"
          className="min-h-12 flex-1"
          disabled={activeCount === 0}
          onPress={() => {
            setRole('')
            setStatus('')
          }}
        />
        <Button
          label={activeCount ? `Показать (${activeCount})` : 'Показать'}
          className="min-h-12 flex-1"
          onPress={() => {
            setSelection({ role, status })
            goBack()
          }}
        />
      </HStack>
    </Screen>
  )
}
