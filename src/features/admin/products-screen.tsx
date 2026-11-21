import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { ArrowDownUp, SlidersHorizontal, Search } from 'lucide-react-native'
import type { FlatProduct } from '@/features/catalog'
import { hasPermission } from '@/shared/session/permissions'
import { useSession } from '@/shared/session/store'
import { Box } from '@/shared/ui/box'
import { FlatList } from '@/shared/ui/flat-list'
import { Pressable } from '@/shared/ui/pressable'
import { Text } from '@/shared/ui/text'
import { VStack } from '@/shared/ui/vstack'
import { HStack } from '@/shared/ui/hstack'
import { Icon } from '@/shared/ui/icon'
import { Button as IconButton, ButtonIcon } from '@/shared/ui/button'
import { AdminProductGridCard } from './admin-product-grid-card'
import { useAdminProductFilters } from './product-filters-store'
import { ProductSearchSheet, ProductSortSheet } from './product-toolbar-sheets'
import {
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Header,
  LoadingView,
  Screen,
  useAppToast,
} from '@/shared/ui/kit'
import {
  deleteProduct,
  invalidateAdminProducts,
  listAdminProducts,
} from './api'
const PAGE_SIZE = 20

const message = (error: unknown) =>
  error instanceof Error ? error.message : 'Не удалось загрузить продукты.'
export function AdminProductsScreen() {
  const search = useAdminProductFilters((state) => state.search)
  const setSearch = useAdminProductFilters((state) => state.setSearch)
  const categoryId = useAdminProductFilters((state) => state.categoryId)
  const subcategoryId = useAdminProductFilters((state) => state.subcategoryId)
  const regionId = useAdminProductFilters((state) => state.regionId)
  const sort = useAdminProductFilters((state) => state.sort)
  const setSort = useAdminProductFilters((state) => state.setSort)
  const page = useAdminProductFilters((state) => state.page)
  const setPage = useAdminProductFilters((state) => state.setPage)
  const [searchOpen, setSearchOpen] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const [deleting, setDeleting] = useState<FlatProduct | null>(null)
  const role = useSession((s) => s.user?.role)
  const owner = useSession((s) => s.user?.id)
  const canEdit = hasPermission(role, 'canEditProducts')
  const client = useQueryClient()
  const toast = useAppToast()
  const [sortBy, direction] = sort.split(':')
  const filters = {
    product: search,
    category_id: categoryId,
    subcategory_id: subcategoryId,
    region_id: regionId,
    sort_by: sortBy,
    sort_order: direction as 'asc' | 'desc',
  }
  // Фильтры справочников точные и применяются на сервере до пагинации.
  // PAGE_SIZE + 1 строка показывает, есть ли следующая страница.
  const products = useQuery({
    queryKey: ['admin', 'products', filters, page],
    queryFn: () => listAdminProducts(filters, page * PAGE_SIZE, PAGE_SIZE + 1),
  })
  const active = () =>
    useSession.getState().user?.id === owner &&
    hasPermission(useSession.getState().user?.role, 'canEditProducts')
  const remove = useMutation({
    mutationFn: async (id: string) => {
      if (!active()) throw new Error('Недостаточно прав для удаления продукта.')
      await deleteProduct(id)
    },
    onSuccess: async () => {
      if (!active()) return
      await invalidateAdminProducts(client)
      if (active()) {
        setDeleting(null)
        if (page > 0 && products.data?.length === 1)
          setPage(Math.max(0, useAdminProductFilters.getState().page - 1))
        toast.success({ title: 'Продукт удалён' })
      }
    },
  })
  const activeFilters = [categoryId, subcategoryId, regionId].filter(
    Boolean,
  ).length
  return (
    <Screen>
      <FlatList
        data={products.error ? [] : (products.data?.slice(0, PAGE_SIZE) ?? [])}
        numColumns={2}
        keyExtractor={(item) => item.product_id}
        // Numeric gaps match the public catalog; FlatList wrappers ignore classes.
        columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
        contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
        removeClippedSubviews={false}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <VStack space="md" className="p-4">
            <Header
              title="Продукты"
              onBack={() =>
                router.canGoBack() ? router.back() : router.replace('/admin')
              }
            />
            {canEdit ? (
              <Button
                label="Создать продукт"
                onPress={() => router.push('/admin/products/new')}
              />
            ) : null}
            <HStack space="sm" className="items-center">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  search ? `Поиск продуктов: ${search}` : 'Поиск по названию'
                }
                className="min-h-12 min-w-0 flex-1 flex-row items-center gap-3 rounded-md border border-input bg-background px-3 py-3 shadow-xs data-[active=true]:bg-accent"
                onPress={() => setSearchOpen(true)}
              >
                <Icon as={Search} className="text-muted-foreground" />
                <Text
                  numberOfLines={1}
                  className={
                    search
                      ? 'flex-1 text-foreground'
                      : 'flex-1 text-muted-foreground'
                  }
                >
                  {search || 'Поиск по названию'}
                </Text>
              </Pressable>
              <IconButton
                size="icon"
                variant="outline"
                className="min-h-12 min-w-12"
                accessibilityLabel={
                  activeFilters
                    ? `Фильтры: выбрано ${activeFilters}`
                    : 'Фильтры продуктов'
                }
                onPress={() => router.push('/admin/products/filters')}
              >
                <ButtonIcon
                  as={SlidersHorizontal}
                  className={activeFilters ? 'text-primary' : 'text-foreground'}
                />
              </IconButton>
              <IconButton
                size="icon"
                variant="outline"
                className="min-h-12 min-w-12"
                accessibilityLabel={`Сортировка: ${sort === 'product_name:asc' ? 'А–Я' : 'Я–А'}`}
                onPress={() => setSortOpen(true)}
              >
                <ButtonIcon as={ArrowDownUp} />
              </IconButton>
            </HStack>
            {products.error ? (
              <ErrorState
                message={message(products.error)}
                onRetry={() => void products.refetch()}
              />
            ) : null}
          </VStack>
        }
        ListEmptyComponent={
          products.isPending ? (
            <LoadingView fullscreen={false} />
          ) : !products.error ? (
            <EmptyState
              title="Продукты не найдены"
              description="Измените поиск или фильтры."
            />
          ) : undefined
        }
        renderItem={({ item }) => (
          <AdminProductGridCard
            product={item}
            canEdit={canEdit}
            onOpen={() =>
              router.push({
                pathname: '/admin/products/[id]',
                params: { id: item.product_id },
              })
            }
            onEdit={() =>
              router.push({
                pathname: '/admin/products/[id]/edit',
                params: { id: item.product_id },
              })
            }
            onDelete={() => {
              remove.reset()
              setDeleting(item)
            }}
          />
        )}
        ListFooterComponent={
          <VStack space="md" className="p-4">
            <Text className="text-muted-foreground">Страница {page + 1}</Text>
            <Box className="flex-row gap-3">
              <Button
                label="Назад"
                variant="outline"
                isDisabled={
                  page === 0 || products.isFetching || Boolean(products.error)
                }
                onPress={() => setPage(page - 1)}
              />
              <Button
                label="Далее"
                variant="outline"
                isDisabled={
                  products.isFetching ||
                  Boolean(products.error) ||
                  !products.data ||
                  products.data.length <= PAGE_SIZE
                }
                onPress={() => setPage(page + 1)}
              />
            </Box>
          </VStack>
        }
      />
      {searchOpen ? (
        <ProductSearchSheet
          search={search}
          onApply={setSearch}
          onClose={() => setSearchOpen(false)}
        />
      ) : null}
      {sortOpen ? (
        <ProductSortSheet
          sort={sort}
          onApply={setSort}
          onClose={() => setSortOpen(false)}
        />
      ) : null}
      <ConfirmDialog
        isOpen={Boolean(deleting)}
        title="Удалить продукт?"
        description={[
          deleting?.product_name,
          'Продукт и его нутриенты будут удалены.',
          remove.error ? message(remove.error) : '',
        ]
          .filter(Boolean)
          .join('\n')}
        confirmLabel="Удалить"
        isDestructive
        isLoading={remove.isPending}
        onConfirm={() => {
          if (deleting) remove.mutate(deleting.product_id)
        }}
        onClose={() => {
          if (!remove.isPending) {
            setDeleting(null)
            remove.reset()
          }
        }}
      />
    </Screen>
  )
}
