import { Pencil } from 'lucide-react-native'
import { Button as IconButton, ButtonIcon } from '@/shared/ui/button'
import { useQuery } from '@tanstack/react-query'
import { router, useLocalSearchParams } from 'expo-router'
import { errorMessage } from './helpers'
import { useSession } from '@/shared/session/store'
import { formatDateTime, formatNumber, formatSom } from '@/shared/lib/format'
import { Box } from '@/shared/ui/box'
import { FlatList } from '@/shared/ui/flat-list'
import { Heading } from '@/shared/ui/heading'
import { Card, ErrorState, Header, LoadingView, Screen } from '@/shared/ui/kit'
import { Text } from '@/shared/ui/text'
import { VStack } from '@/shared/ui/vstack'
import { savedApi } from './api'
import { RecipeMetrics } from './recipe-metrics'
import { FontSize } from '@/shared/theme/font-sizes'

export function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const status = useSession((s) => s.status)
  const detail = useQuery({
    queryKey: ['saved', 'detail', id],
    queryFn: () => savedApi.recipe(id),
    enabled: status === 'authenticated' && Boolean(id),
  })
  const references = useQuery({
    queryKey: ['calculator', 'references'],
    queryFn: savedApi.referenceProteins,
    enabled: status === 'authenticated',
  })
  const groups = useQuery({
    queryKey: ['calculator', 'groups'],
    queryFn: savedApi.groups,
    enabled: status === 'authenticated',
  })
  // Compatibility with an older backend; the new API supplies product_name directly.
  const names = useQuery({
    queryKey: ['saved', 'product-names', id, detail.data?.updated_at],
    enabled:
      status === 'authenticated' &&
      Boolean(detail.data?.items.some((item) => !item.product_name)),
    queryFn: async () => {
      const missing =
        detail.data?.items.filter((item) => !item.product_name) ?? []
      const products = await Promise.all(
        missing.map((item) => savedApi.product(item.product_id)),
      )
      return Object.fromEntries(
        products.map((product) => [product.id, product.name]),
      ) as Record<string, string>
    },
  })
  if (status !== 'authenticated') return null
  const recipe = detail.data
  const back = () => {
    if (router.canGoBack()) router.back()
    else router.replace('/(tabs)/saved')
  }
  return (
    <Screen>
      <Header
        title={recipe?.name ?? 'Рецептура'}
        onBack={back}
        right={
          recipe ? (
            <IconButton
              variant="ghost"
              size="icon"
              className="h-12 w-12"
              accessibilityLabel={`Редактировать: ${recipe.name}`}
              onPress={() =>
                router.push({
                  pathname: '/saved/[id]/edit',
                  params: { id: recipe.id },
                })
              }
            >
              <ButtonIcon as={Pencil} className="text-foreground" />
            </IconButton>
          ) : undefined
        }
      />
      {detail.isPending ? (
        <LoadingView />
      ) : detail.error ? (
        <ErrorState
          message={errorMessage(detail.error)}
          onRetry={() => void detail.refetch()}
        />
      ) : recipe ? (
        <FlatList
          data={recipe.items}
          keyExtractor={(item, index) => `${item.product_id}:${index}`}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}
          ListHeaderComponent={
            <VStack space="md">
              <RecipeMetrics recipe={recipe} />
              <Text className="text-muted-foreground">
                Группа:{' '}
                {groups.data?.find((group) => group.id === recipe.group_id)
                  ?.name ??
                  (recipe.group_id
                    ? groups.isPending
                      ? 'Загрузка…'
                      : 'Группа недоступна'
                    : 'Без группы')}
              </Text>
              <Text className="text-muted-foreground">
                Эталон:{' '}
                {references.data?.find(
                  (reference) => reference.id === recipe.reference_protein_id,
                )?.name ?? '—'}
              </Text>
              <Text className="text-muted-foreground">
                Обновлено:{' '}
                {formatDateTime(recipe.updated_at ?? recipe.created_at)}
              </Text>
              {groups.error || references.error ? (
                <ErrorState
                  message="Не удалось загрузить группу или эталон."
                  onRetry={() => {
                    void groups.refetch()
                    void references.refetch()
                  }}
                />
              ) : null}
              {names.error ? (
                <ErrorState
                  message="Не удалось загрузить названия продуктов."
                  onRetry={() => void names.refetch()}
                />
              ) : null}
              <Heading size={FontSize.md} className="text-foreground">
                Состав ·{' '}
                {formatNumber(
                  recipe.items.reduce((sum, item) => sum + item.amount_g, 0),
                )}{' '}
                г
              </Heading>
            </VStack>
          }
          renderItem={({ item }) => (
            <Card>
              <VStack space="sm">
                <Heading size={FontSize.sm} className="text-foreground">
                  {item.product_name ||
                    names.data?.[item.product_id] ||
                    (names.isFetching
                      ? 'Загрузка названия…'
                      : 'Название продукта недоступно')}
                </Heading>
                <Box className="gap-1">
                  <Text className="text-foreground">
                    Масса: {formatNumber(item.amount_g)} г
                  </Text>
                  {item.price_per_kg != null ? (
                    <Text className="text-muted-foreground">
                      Цена: {formatSom(item.price_per_kg)}/кг
                    </Text>
                  ) : null}
                </Box>
              </VStack>
            </Card>
          )}
        />
      ) : null}
    </Screen>
  )
}
