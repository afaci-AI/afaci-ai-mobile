import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMemo } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import {
  useCatalogDictionaries,
  useNutrientDictionaries,
  useProduct,
  useProductNutrients,
} from '@/modules/catalog/api'
import { ApiError } from '@/shared/api/client'
import { formatNumber } from '@/shared/lib/format'
import { Box } from '@/shared/ui/box'
import { MacroChart } from '@/shared/ui/charts/macro-chart'
import { Heading } from '@/shared/ui/heading'
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Header,
  LoadingView,
  Screen,
} from '@/shared/ui/kit'
import { SectionList } from '@/shared/ui/section-list'
import { Text } from '@/shared/ui/text'

import { getMacroValues, groupNutrients } from './nutrients'

export function ProductDetailScreen() {
  const params = useLocalSearchParams<{ id: string | string[] }>()
  const id = Array.isArray(params.id) ? params.id[0] : params.id
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const product = useProduct(id ?? '')
  const nutrients = useProductNutrients(id ?? '')
  const catalog = useCatalogDictionaries()
  const dictionaries = useNutrientDictionaries()
  const sections = useMemo(
    () =>
      groupNutrients(
        nutrients.data ?? [],
        dictionaries.data?.names ?? [],
        dictionaries.data?.types ?? [],
        dictionaries.data?.units ?? [],
      ),
    [nutrients.data, dictionaries.data],
  )
  const macros = useMemo(
    () =>
      getMacroValues(
        nutrients.data ?? [],
        dictionaries.data?.names ?? [],
        dictionaries.data?.units ?? [],
      ),
    [nutrients.data, dictionaries.data],
  )
  const queries = [product, nutrients, catalog, dictionaries]
  const error = queries.find((query) => query.isError)?.error
  const loading = queries.some((query) => query.isPending)
  const retry = () => {
    for (const query of queries) void query.refetch()
  }
  const goBack = () => {
    if (router.canGoBack()) router.back()
    else router.replace('/database')
  }
  const missing =
    product.error instanceof ApiError && product.error.status === 404

  return (
    <Screen edges={['top']}>
      <Header title="Карточка продукта" />
      <Box className="px-4 py-2">
        <Button
          label="К базе продуктов"
          variant="outline"
          onPress={goBack}
          className="min-h-12"
        />
      </Box>
      {!id ? (
        <EmptyState title="Продукт не найден" />
      ) : error ? (
        <ErrorState
          title={missing ? 'Продукт не найден' : 'Не удалось загрузить состав'}
          message={
            missing
              ? 'Возможно, продукт был удалён. Вернитесь к базе продуктов.'
              : error.message
          }
          onRetry={retry}
        />
      ) : loading ? (
        <LoadingView label="Загрузка продукта и состава…" />
      ) : product.data ? (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={{
            // Insets depend on the device; SectionList has no className API.
            paddingHorizontal: 16,
            paddingBottom: insets.bottom + 24,
          }}
          ListHeaderComponent={
            <Box className="gap-4 py-4">
              <Card>
                <Heading size="xl" className="text-foreground">
                  {product.data.name}
                </Heading>
                <ProductAttribute
                  label="Категория"
                  value={
                    catalog.data?.categories.find(
                      (item) => item.id === product.data?.category_id,
                    )?.name
                  }
                />
                <ProductAttribute
                  label="Подкатегория"
                  value={
                    catalog.data?.subcategories.find(
                      (item) => item.id === product.data?.subcategory_id,
                    )?.name
                  }
                />
                <ProductAttribute
                  label="Регион"
                  value={
                    catalog.data?.regions.find(
                      (item) => item.id === product.data?.region_id,
                    )?.name
                  }
                />
                <ProductAttribute
                  label="Нутриентов"
                  value={String(nutrients.data?.length ?? 0)}
                />
              </Card>
              <MacroChart values={macros} />
              <Heading size="lg" className="text-foreground">
                Нутриенты
              </Heading>
              <Text size="sm" className="text-muted-foreground">
                Пищевая ценность на 100 г продукта. Значения сгруппированы по
                типу и единице измерения.
              </Text>
              {nutrients.data?.length === 0 ? (
                <EmptyState
                  title="Состав пока не добавлен"
                  description="Для этого продукта ещё нет данных о нутриентах."
                />
              ) : null}
            </Box>
          }
          renderSectionHeader={({ section }) => (
            <Box className="gap-1 rounded-t-xl border border-b-0 border-border bg-muted px-4 py-3">
              <Heading size="md" className="text-foreground">
                {section.title}
              </Heading>
              <Text size="sm" className="text-muted-foreground">
                Единица измерения: {section.unit}
              </Text>
            </Box>
          )}
          renderItem={({ item, section }) => (
            <Box className="gap-1 border-x border-b border-border bg-card px-4 py-3">
              <Text className="text-foreground">{item.name}</Text>
              <Text bold className="text-foreground">
                {formatNumber(item.quantity, 4)} {section.unit}
                {item.errorRate !== null
                  ? ` ± ${formatNumber(item.errorRate, 4)}`
                  : ''}
              </Text>
            </Box>
          )}
          renderSectionFooter={() => <Box className="h-4" />}
        />
      ) : (
        <EmptyState title="Продукт не найден" />
      )}
    </Screen>
  )
}

function ProductAttribute({ label, value }: { label: string; value?: string }) {
  return (
    <Box className="gap-1">
      <Text size="sm" className="text-muted-foreground">
        {label}
      </Text>
      <Text className="text-foreground">{value || 'Не указано'}</Text>
    </Box>
  )
}
