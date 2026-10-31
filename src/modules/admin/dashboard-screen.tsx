import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { ChevronRight, Plus, RefreshCw } from 'lucide-react-native'

import type { DictionaryEntry, Product } from '@/modules/catalog/api'
import { request } from '@/shared/api/client'
import { hasPermission } from '@/shared/session/permissions'
import { useSession } from '@/shared/session/store'
import { Box } from '@/shared/ui/box'
import { Heading } from '@/shared/ui/heading'
import { Icon } from '@/shared/ui/icon'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Header,
  LoadingView,
  ScrollScreen,
} from '@/shared/ui/kit'
import { Pressable } from '@/shared/ui/pressable'
import { Text } from '@/shared/ui/text'

export default function AdminDashboardScreen() {
  const router = useRouter()
  const user = useSession((state) => state.user)
  const canEdit = hasPermission(user?.role, 'canEditProducts')
  const canManageDictionaries = hasPermission(
    user?.role,
    'canManageDictionaries',
  )
  const dashboard = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: async () => {
      const [products, categories, regions, nutrients] = await Promise.all([
        request<Product[]>('/products'),
        request<DictionaryEntry[]>('/categories'),
        request<DictionaryEntry[]>('/regions'),
        request<DictionaryEntry[]>('/nutrient-names'),
      ])
      return { products, categories, regions, nutrients }
    },
    enabled: Boolean(user),
  })

  if (!user) return null

  const statistics = dashboard.data
    ? [
        { label: 'Продукты', value: dashboard.data.products.length },
        { label: 'Категории', value: dashboard.data.categories.length },
        { label: 'Регионы', value: dashboard.data.regions.length },
        { label: 'Нутриенты', value: dashboard.data.nutrients.length },
      ]
    : []

  return (
    <ScrollScreen>
      <Header
        title="Админка"
        subtitle="Управление системой"
        onBack={() =>
          router.canGoBack() ? router.back() : router.replace('/profile')
        }
        className="-mx-4 -mt-4"
      />
      {!canEdit ? <Badge label="Только просмотр" variant="secondary" /> : null}
      {dashboard.isPending ? <LoadingView fullscreen={false} /> : null}
      {dashboard.isError ? (
        <ErrorState
          message={dashboard.error.message}
          onRetry={() => void dashboard.refetch()}
        />
      ) : null}
      {dashboard.data ? (
        <>
          <Box className="flex-row flex-wrap gap-3">
            {statistics.map(({ label, value }) => (
              <Card key={label} className="min-w-32 flex-1">
                <Text size="sm" className="text-muted-foreground">
                  {label}
                </Text>
                <Heading size="2xl" className="text-card-foreground">
                  {value}
                </Heading>
              </Card>
            ))}
          </Box>
          <Card>
            <Heading size="md" className="text-card-foreground">
              Быстрые действия
            </Heading>
            <Button
              label="Все продукты"
              onPress={() => router.push('/admin/products')}
            />
            {canEdit ? (
              <Button
                label="Добавить продукт"
                icon={Plus}
                variant="outline"
                onPress={() => router.push('/admin/products/new')}
              />
            ) : null}
            <Button
              label="Обновить данные"
              icon={RefreshCw}
              variant="ghost"
              isLoading={dashboard.isFetching}
              onPress={() => void dashboard.refetch()}
            />
          </Card>
          <Card>
            <Heading size="md" className="text-card-foreground">
              Последние продукты
            </Heading>
            <Text size="sm" className="text-muted-foreground">
              Первые пять записей в порядке ответа сервера. Дата добавления
              недоступна.
            </Text>
            {dashboard.data.products.length === 0 ? (
              <EmptyState title="Продуктов пока нет" />
            ) : (
              dashboard.data.products.slice(0, 5).map((product) => (
                <Pressable
                  key={product.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Открыть ${product.name}`}
                  className="min-h-12 flex-row items-center gap-3 border-t border-border py-3 data-[active=true]:bg-muted"
                  onPress={() => router.push(`/admin/products/${product.id}`)}
                >
                  <Text className="flex-1 text-card-foreground">
                    {product.name}
                  </Text>
                  <Icon as={ChevronRight} className="text-muted-foreground" />
                </Pressable>
              ))
            )}
          </Card>
          {canManageDictionaries ? (
            <Card>
              <Heading size="md" className="text-card-foreground">
                Словари
              </Heading>
              {[
                ['categories', 'Категории'],
                ['subcategories', 'Подкатегории'],
                ['regions', 'Регионы'],
                ['nutrient-names', 'Названия нутриентов'],
                ['nutrient-types', 'Типы нутриентов'],
                ['units', 'Единицы измерения'],
              ].map(([kind, name]) => (
                <Button
                  key={name}
                  label={name}
                  variant="outline"
                  onPress={() =>
                    router.push({
                      pathname: '/admin/dictionaries/[kind]',
                      params: { kind },
                    })
                  }
                />
              ))}
            </Card>
          ) : null}
        </>
      ) : null}
      {user.role === 'admin' ? (
        <Card>
          <Heading size="md" className="text-card-foreground">
            Администрирование
          </Heading>
          <Button
            label="Пользователи"
            variant="outline"
            onPress={() => router.push('/admin/users')}
          />
        </Card>
      ) : null}
    </ScrollScreen>
  )
}
