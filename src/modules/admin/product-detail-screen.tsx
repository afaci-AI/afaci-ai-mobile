import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Pencil, Trash2 } from 'lucide-react-native'
import type { Nutrient } from '@/modules/catalog/api'
import { hasPermission } from '@/shared/session/permissions'
import { useSession } from '@/shared/session/store'
import { deleteNutrient, invalidateAdminProducts } from './api'
import { NutrientDialog } from './nutrient-dialog'
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
  ConfirmDialog,
  useAppToast,
  Card,
  EmptyState,
  ErrorState,
  Header,
  LoadingView,
  Screen,
} from '@/shared/ui/kit'
import { SectionList } from '@/shared/ui/section-list'
import { Text } from '@/shared/ui/text'

import { getMacroValues, groupNutrients } from '@/modules/products/nutrients'

export function AdminProductDetailScreen() {
  const params = useLocalSearchParams<{ id: string | string[] }>()
  const id = Array.isArray(params.id) ? params.id[0] : params.id
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const role = useSession((state) => state.user?.role)
  const canEdit = hasPermission(role, 'canEditProducts')
  const owner = useSession((state) => state.user?.id)
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  const active = () =>
    mounted.current &&
    useSession.getState().user?.id === owner &&
    hasPermission(useSession.getState().user?.role, 'canEditProducts')
  const client = useQueryClient()
  const toast = useAppToast()
  const [editing, setEditing] = useState<{ nutrient: Nutrient | null } | null>(
    null,
  )
  const [deleting, setDeleting] = useState<Nutrient | null>(null)
  const [pending, setPending] = useState(false)
  const deletingNow = useRef(false)
  const [deleteError, setDeleteError] = useState('')
  const remove = async () => {
    if (!deleting || deletingNow.current || !active()) return
    deletingNow.current = true
    setPending(true)
    setDeleteError('')
    try {
      await deleteNutrient(deleting.id)
      if (!active()) return
      setDeleting(null)
      await invalidateAdminProducts(client)
      if (!active()) return
      toast.success({ title: 'Нутриент удалён' })
    } catch (cause) {
      if (!active()) return
      const message =
        cause instanceof Error ? cause.message : 'Не удалось удалить нутриент.'
      setDeleteError(message)
      toast.error({ title: 'Нутриент не удалён', description: message })
    } finally {
      deletingNow.current = false
      if (active()) setPending(false)
    }
  }
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
    else router.replace('/admin/products')
  }
  const missing =
    product.error instanceof ApiError && product.error.status === 404

  return (
    <Screen edges={['top']}>
      <Header title={product.data?.name ?? 'Продукт'} onBack={goBack} />
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
              {canEdit ? (
                <Button
                  label="Редактировать продукт"
                  icon={Pencil}
                  variant="outline"
                  onPress={() =>
                    router.push({
                      pathname: '/admin/products/[id]/edit',
                      params: { id },
                    })
                  }
                />
              ) : (
                <Text className="text-muted-foreground">Режим просмотра</Text>
              )}
              <MacroChart values={macros} />
              {canEdit ? (
                <Button
                  label="Добавить нутриент"
                  onPress={() => setEditing({ nutrient: null })}
                />
              ) : null}
              {deleteError ? (
                <Text
                  accessibilityRole="alert"
                  className="text-destructive-text"
                >
                  {deleteError}
                </Text>
              ) : null}
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
              {canEdit ? (
                <Box className="flex-row flex-wrap gap-2 pt-2">
                  <Button
                    label="Изменить"
                    accessibilityLabel={`Изменить нутриент ${item.name}`}
                    icon={Pencil}
                    variant="outline"
                    onPress={() => {
                      const nutrient = nutrients.data?.find(
                        (row) => row.id === item.id,
                      )
                      if (nutrient) setEditing({ nutrient })
                    }}
                  />
                  <Button
                    label="Удалить"
                    accessibilityLabel={`Удалить нутриент ${item.name}`}
                    icon={Trash2}
                    variant="ghost"
                    onPress={() => {
                      setDeleteError('')
                      setDeleting(
                        nutrients.data?.find((row) => row.id === item.id) ??
                          null,
                      )
                    }}
                  />
                </Box>
              ) : null}
            </Box>
          )}
          renderSectionFooter={() => <Box className="h-4" />}
        />
      ) : (
        <EmptyState title="Продукт не найден" />
      )}
      {canEdit && editing && id ? (
        <NutrientDialog
          key={editing.nutrient?.id ?? 'new'}
          productId={id}
          nutrient={editing.nutrient}
          nutrients={nutrients.data ?? []}
          onClose={() => setEditing(null)}
        />
      ) : null}
      <ConfirmDialog
        isOpen={canEdit && Boolean(deleting)}
        title="Удалить нутриент?"
        description={
          deleteError ||
          'Данные о выбранном нутриенте будут удалены из состава продукта.'
        }
        confirmLabel="Удалить"
        isDestructive
        isLoading={pending}
        onConfirm={() => void remove()}
        onClose={() => {
          if (!pending) {
            setDeleting(null)
            setDeleteError('')
          }
        }}
      />
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
