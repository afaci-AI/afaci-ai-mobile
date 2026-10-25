import { useRouter } from 'expo-router'
import { useState } from 'react'

import { useCatalogDictionaries } from '@/modules/catalog/api'
import {
  ALL,
  countActiveFilters,
  useCatalogFilters,
} from '@/modules/catalog/filters-store'
import { Box } from '@/shared/ui/box'
import { Heading } from '@/shared/ui/heading'
import { HStack } from '@/shared/ui/hstack'
import {
  Button,
  Chip,
  ErrorState,
  Header,
  LoadingView,
  Screen,
} from '@/shared/ui/kit'
import { ScrollView } from '@/shared/ui/scroll-view'
import { Text } from '@/shared/ui/text'
import { VStack } from '@/shared/ui/vstack'

/** Подробный выбор фильтров каталога: категории и подкатегории — чипами. */
export default function CatalogFiltersScreen() {
  const router = useRouter()
  // Поля выбираются по одному: селектор с новым объектом ломает снимок store.
  const storedCategoryId = useCatalogFilters((state) => state.categoryId)
  const storedSubcategoryId = useCatalogFilters((state) => state.subcategoryId)
  const storedRegionId = useCatalogFilters((state) => state.regionId)
  const setSelection = useCatalogFilters((state) => state.setSelection)
  const dictionaries = useCatalogDictionaries()

  // Выбор применяется кнопкой «Показать», поэтому он живёт в локальном состоянии.
  const [categoryId, setCategoryId] = useState(storedCategoryId)
  const [subcategoryId, setSubcategoryId] = useState(storedSubcategoryId)
  const [regionId, setRegionId] = useState(storedRegionId)

  const categories = dictionaries.data?.categories ?? []
  const subcategories = dictionaries.data?.subcategories ?? []
  const regions = dictionaries.data?.regions ?? []
  const subcategoryOptions =
    categoryId === ALL
      ? subcategories
      : subcategories.filter((item) => item.category_id === categoryId)
  const activeCount = countActiveFilters({
    categoryId,
    subcategoryId,
    regionId,
  })

  function apply() {
    setSelection({ categoryId, subcategoryId, regionId })
    router.back()
  }

  function clear() {
    setCategoryId(ALL)
    setSubcategoryId(ALL)
    setRegionId(ALL)
  }

  function renderGroup(
    title: string,
    allLabel: string,
    options: { id: string; name: string }[],
    value: string,
    onChange: (next: string) => void,
    emptyLabel?: string,
  ) {
    return (
      <VStack space="sm">
        <Heading size="sm" className="text-foreground">
          {title}
        </Heading>
        {options.length === 0 && emptyLabel ? (
          <Text size="sm" className="text-muted-foreground">
            {emptyLabel}
          </Text>
        ) : (
          <HStack space="sm" className="flex-wrap gap-2">
            <Chip
              label={allLabel}
              selected={value === ALL}
              onPress={() => onChange(ALL)}
            />
            {options.map((item) => (
              <Chip
                key={item.id}
                label={item.name}
                selected={value === item.id}
                onPress={() => onChange(item.id)}
              />
            ))}
          </HStack>
        )}
      </VStack>
    )
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <Header
        title="Фильтры"
        subtitle="Категория, подкатегория и регион"
        onBack={() => router.back()}
      />

      {dictionaries.isPending ? (
        <LoadingView label="Загрузка фильтров…" />
      ) : dictionaries.isError ? (
        <Box className="px-4 py-4">
          <ErrorState
            title="Не удалось загрузить фильтры"
            message={dictionaries.error.message}
            onRetry={() => void dictionaries.refetch()}
          />
        </Box>
      ) : (
        <>
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
          >
            <VStack space="xl" className="px-4 py-4">
              {renderGroup(
                'Категория',
                'Все категории',
                categories,
                categoryId,
                (next) => {
                  setCategoryId(next)
                  setSubcategoryId(ALL)
                },
              )}
              {renderGroup(
                'Подкатегория',
                'Все подкатегории',
                subcategoryOptions,
                subcategoryId,
                setSubcategoryId,
                'Для выбранной категории подкатегорий нет.',
              )}
              {renderGroup(
                'Регион',
                'Все регионы',
                regions,
                regionId,
                setRegionId,
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
              onPress={clear}
            />
            <Button
              label={activeCount ? `Показать (${activeCount})` : 'Показать'}
              className="min-h-12 flex-1"
              onPress={apply}
            />
          </HStack>
        </>
      )}
    </Screen>
  )
}
