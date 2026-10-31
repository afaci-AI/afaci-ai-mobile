import { useInfiniteQuery } from '@tanstack/react-query'
import { useDeferredValue, useState } from 'react'

import {
  CATALOG_PAGE_SIZE,
  listProducts,
  type FlatProduct,
} from '@/modules/catalog/api'
import { Box } from '@/shared/ui/box'
import { FlatList } from '@/shared/ui/flat-list'
import { Heading } from '@/shared/ui/heading'
import { Button, Input, LoadingView } from '@/shared/ui/kit'
import {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
} from '@/shared/ui/modal'
import { Pressable } from '@/shared/ui/pressable'
import { Text } from '@/shared/ui/text'
import { FontSize } from '@/shared/theme/font-sizes'

export function ProductSearchModal({
  open,
  onClose,
  onSelect,
  excludedIds = [],
}: {
  open: boolean
  onClose: () => void
  onSelect: (product: FlatProduct) => void
  excludedIds?: string[]
}) {
  const [search, setSearch] = useState('')
  const queryText = useDeferredValue(search.trim())
  const query = useInfiniteQuery({
    queryKey: ['calculator', 'product-search', queryText],
    queryFn: ({ pageParam }) => listProducts({ product: queryText }, pageParam),
    initialPageParam: 0,
    getNextPageParam: (last, pages) =>
      last.length === CATALOG_PAGE_SIZE
        ? pages.length * CATALOG_PAGE_SIZE
        : undefined,
    enabled: open,
  })
  const excluded = new Set(excludedIds)
  const products =
    query.data?.pages
      .flat()
      .filter(
        (product, index, all) =>
          all.findIndex((other) => other.product_id === product.product_id) ===
          index,
      ) ?? []
  return (
    <Modal isOpen={open} onClose={onClose} size="lg">
      <ModalBackdrop />
      <ModalContent className="h-4/5 gap-4 p-4">
        <ModalHeader>
          <Heading size={FontSize.md} className="text-foreground">
            Выбор продукта
          </Heading>
        </ModalHeader>
        <Input
          accessibilityLabel="Поиск продукта"
          placeholder="Название продукта"
          value={search}
          onChangeText={setSearch}
        />
        <FlatList<FlatProduct>
          data={products}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(product) => product.product_id}
          onEndReached={() => {
            if (
              query.hasNextPage &&
              !query.isFetchingNextPage &&
              !query.isFetchNextPageError
            )
              void query.fetchNextPage()
          }}
          onEndReachedThreshold={0.4}
          renderItem={({ item }) => (
            <Pressable
              disabled={excluded.has(item.product_id)}
              accessibilityRole="button"
              accessibilityLabel={`${item.product_name}${excluded.has(item.product_id) ? ', уже добавлен' : ''}`}
              accessibilityState={{ disabled: excluded.has(item.product_id) }}
              className="gap-1 border-b border-border py-3"
              onPress={() => {
                onSelect(item)
                onClose()
              }}
            >
              <Text bold className="text-foreground">
                {item.product_name}
              </Text>
              <Text size={FontSize.sm} className="text-muted-foreground">
                {item.region_name} · {item.category_name}
                {excluded.has(item.product_id) ? ' · Уже добавлен' : ''}
              </Text>
            </Pressable>
          )}
          ListEmptyComponent={
            query.isPending ? (
              <LoadingView fullscreen={false} />
            ) : !query.isError ? (
              <Text className="text-muted-foreground">
                Продукты не найдены.
              </Text>
            ) : undefined
          }
          ListFooterComponent={
            <Box className="gap-3 py-3">
              {query.isError ? (
                <>
                  <Text className="text-destructive-text">
                    {query.error.message}
                  </Text>
                  <Button
                    label="Повторить"
                    variant="outline"
                    onPress={() => {
                      if (query.isFetchNextPageError) void query.fetchNextPage()
                      else void query.refetch()
                    }}
                  />
                </>
              ) : null}
              {query.isFetchingNextPage ? (
                <LoadingView fullscreen={false} />
              ) : null}
            </Box>
          }
        />
        <Button label="Закрыть" variant="outline" onPress={onClose} />
      </ModalContent>
    </Modal>
  )
}
