import type {
  InfiniteData,
  UseInfiniteQueryResult,
} from '@tanstack/react-query'
import type { ReactElement } from 'react'

import type { FlatProduct } from '@/modules/catalog/api'
import { Box } from '@/shared/ui/box'
import { FlatList } from '@/shared/ui/flat-list'
import { ErrorState, LoadingView } from '@/shared/ui/kit'

import { ProductGridCard } from './product-grid-card'

interface ProductGridProps {
  rows: FlatProduct[]
  query: UseInfiniteQueryResult<InfiniteData<FlatProduct[], unknown>, Error>
  onEndReached: () => void
  header?: ReactElement
  empty?: ReactElement
  refreshing?: boolean
  onRefresh?: () => void
}

/**
 * Сетка продуктов в две колонки с бесконечной подгрузкой: общая для вкладки
 * «База» и экрана поиска.
 */
export function ProductGrid({
  rows,
  query,
  onEndReached,
  header,
  empty,
  refreshing,
  onRefresh,
}: ProductGridProps) {
  return (
    <FlatList
      data={rows}
      numColumns={2}
      keyExtractor={(item) => item.product_id}
      renderItem={({ item }) => <ProductGridCard product={item} />}
      ListHeaderComponent={header}
      ListEmptyComponent={empty}
      ListFooterComponent={
        query.isFetchingNextPage ? (
          <LoadingView fullscreen={false} label="Загружаем ещё…" />
        ) : query.isFetchNextPageError && query.error ? (
          <Box className="px-4">
            <ErrorState
              title="Не удалось загрузить следующую страницу"
              message={query.error.message}
              onRetry={() => void query.fetchNextPage()}
            />
          </Box>
        ) : (
          <Box className="h-2" />
        )
      }
      // На Android отсечение невидимых ячеек гасит текст в плитках при
      // появлении клавиатуры, поэтому оно выключено.
      removeClippedSubviews={false}
      // Numeric gaps: NativeWind utilities do not reach FlatList wrappers.
      columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
      contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
      refreshing={refreshing}
      onRefresh={onRefresh}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.4}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    />
  )
}
