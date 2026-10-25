import { useRouter } from 'expo-router'
import { Package, Search } from 'lucide-react-native'
import { useEffect, useState } from 'react'

import { ProductGrid } from '@/modules/catalog/components/product-grid'
import { useCatalogFilters } from '@/modules/catalog/filters-store'
import { useCatalogProducts } from '@/modules/catalog/use-catalog-products'
import { Box } from '@/shared/ui/box'
import { Icon } from '@/shared/ui/icon'
import {
  EmptyState,
  ErrorState,
  Header,
  Input,
  LoadingView,
  Screen,
} from '@/shared/ui/kit'
import { Text } from '@/shared/ui/text'
import { VStack } from '@/shared/ui/vstack'

/** Экран поиска продуктов: запрос уходит в общий store фильтров каталога. */
export default function CatalogSearchScreen() {
  const router = useRouter()
  const storedSearch = useCatalogFilters((state) => state.search)
  const setSearch = useCatalogFilters((state) => state.setSearch)
  const [text, setText] = useState(storedSearch)
  const { query, rows, search, loadMore } = useCatalogProducts()

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(text.trim()), 350)
    return () => clearTimeout(timeout)
  }, [text, setSearch])

  const pending = text.trim() !== search

  const header = (
    <VStack space="sm" className="px-4 py-4">
      <Input
        autoFocus
        accessibilityLabel="Поиск по названию продукта"
        placeholder="Например, молоко"
        value={text}
        onChangeText={setText}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        rightSlot={
          <Icon as={Search} size="md" className="text-muted-foreground" />
        }
      />
      {pending ? (
        <Text
          size="sm"
          className="text-muted-foreground"
          accessibilityLiveRegion="polite"
        >
          Обновляем поиск…
        </Text>
      ) : !query.isPending && !query.isError ? (
        <Text
          size="sm"
          className="text-muted-foreground"
          accessibilityLiveRegion="polite"
        >
          Найдено продуктов: {rows.length}
        </Text>
      ) : null}
    </VStack>
  )

  return (
    <Screen edges={['top']}>
      <Header
        title="Поиск продуктов"
        subtitle="Фильтры каталога применяются к результатам"
        onBack={() => router.back()}
      />
      <ProductGrid
        rows={rows}
        query={query}
        header={header}
        onEndReached={loadMore}
        empty={
          query.isPending || pending ? (
            <LoadingView fullscreen={false} label="Ищем продукты…" />
          ) : query.isError ? (
            <Box className="px-4">
              <ErrorState
                message={query.error?.message}
                onRetry={() => void query.refetch()}
              />
            </Box>
          ) : (
            <EmptyState
              icon={Package}
              title={
                search ? 'Продукты не найдены' : 'Введите название продукта'
              }
              description={
                search
                  ? 'Попробуйте другое название или измените фильтры.'
                  : 'Поиск идёт по названию продукта.'
              }
            />
          )
        }
      />
    </Screen>
  )
}
