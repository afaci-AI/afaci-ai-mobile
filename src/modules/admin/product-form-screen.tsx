import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { router, useLocalSearchParams } from 'expo-router'
import {
  useCatalogDictionaries,
  useProduct,
  type Product,
} from '@/modules/catalog/api'
import { hasPermission } from '@/shared/session/permissions'
import { useSession } from '@/shared/session/store'
import {
  Button,
  ErrorState,
  FormField,
  Header,
  Input,
  LoadingView,
  ScrollScreen,
  Select,
  useAppToast,
} from '@/shared/ui/kit'
import { Text } from '@/shared/ui/text'
import { VStack } from '@/shared/ui/vstack'
import { createProduct, updateProduct, invalidateAdminProducts } from './api'

const message = (error: unknown) =>
  error instanceof Error ? error.message : 'Не удалось сохранить продукт.'

export function ProductFormScreen({ edit = false }: { edit?: boolean }) {
  const { id = '' } = useLocalSearchParams<{ id: string }>()
  const dictionaries = useCatalogDictionaries()
  const product = useProduct(edit ? id : '')
  const role = useSession((s) => s.user?.role)
  const back = () =>
    router.canGoBack() ? router.back() : router.replace('/admin/products')
  return (
    <ScrollScreen>
      <Header
        title={edit ? 'Редактировать продукт' : 'Новый продукт'}
        onBack={back}
      />
      {!hasPermission(role, 'canEditProducts') ? (
        <Text className="text-destructive-text">
          Недостаточно прав для изменения продуктов.
        </Text>
      ) : dictionaries.isPending || (edit && product.isPending) ? (
        <LoadingView fullscreen={false} />
      ) : dictionaries.error || (edit && product.error) ? (
        <ErrorState
          message={message(dictionaries.error || product.error)}
          onRetry={() => {
            void dictionaries.refetch()
            if (edit) void product.refetch()
          }}
        />
      ) : dictionaries.data ? (
        <ProductForm
          key={edit ? product.data?.id : 'new'}
          product={edit ? product.data : undefined}
          dictionaries={dictionaries.data}
          onBack={back}
        />
      ) : null}
    </ScrollScreen>
  )
}

function ProductForm({
  product,
  dictionaries,
  onBack,
}: {
  product?: Product
  dictionaries: NonNullable<ReturnType<typeof useCatalogDictionaries>['data']>
  onBack: () => void
}) {
  const [name, setName] = useState(product?.name ?? '')
  const [category, setCategory] = useState(product?.category_id ?? '')
  const [subcategory, setSubcategory] = useState(product?.subcategory_id ?? '')
  const [region, setRegion] = useState(product?.region_id ?? '')
  const [submitted, setSubmitted] = useState(false)
  const client = useQueryClient()
  const toast = useAppToast()
  const owner = useSession((s) => s.user?.id)
  const active = () =>
    useSession.getState().user?.id === owner &&
    hasPermission(useSession.getState().user?.role, 'canEditProducts')
  const save = useMutation({
    mutationFn: () => {
      if (!active())
        throw new Error('Недостаточно прав для изменения продуктов.')
      if (!name.trim() || !category || !region)
        throw new Error('Заполните название, категорию и регион.')
      const payload = {
        name: name.trim(),
        category_id: category,
        subcategory_id: subcategory || null,
        region_id: region,
      }
      return product
        ? updateProduct(product.id, payload)
        : createProduct(payload)
    },
    onSuccess: async () => {
      if (!active()) return
      await invalidateAdminProducts(client)
      if (active()) {
        toast.success({
          title: product ? 'Продукт сохранён' : 'Продукт создан',
        })
        onBack()
      }
    },
  })
  const options = (values: { id: string; name: string }[]) =>
    values.map((v) => ({ value: v.id, label: v.name }))
  return (
    <VStack space="lg">
      <FormField
        label="Название"
        isRequired
        error={submitted && !name.trim() ? 'Укажите название.' : undefined}
      >
        <Input
          accessibilityLabel="Название продукта"
          value={name}
          onChangeText={setName}
          isDisabled={save.isPending}
          isInvalid={submitted && !name.trim()}
        />
      </FormField>
      <FormField
        label="Категория"
        isRequired
        error={submitted && !category ? 'Выберите категорию.' : undefined}
      >
        <Select
          value={category}
          placeholder="Выберите категорию"
          isInvalid={submitted && !category}
          options={options(dictionaries.categories)}
          onChange={(value) => {
            setCategory(value)
            setSubcategory('')
          }}
          isDisabled={save.isPending}
        />
      </FormField>
      <FormField label="Подкатегория">
        <Select
          value={subcategory}
          placeholder="Без подкатегории"
          options={[
            { value: '', label: 'Без подкатегории' },
            ...options(
              dictionaries.subcategories.filter(
                (item) => !item.category_id || item.category_id === category,
              ),
            ),
          ]}
          onChange={setSubcategory}
          isDisabled={!category || save.isPending}
        />
      </FormField>
      <FormField
        label="Регион"
        isRequired
        error={submitted && !region ? 'Выберите регион.' : undefined}
      >
        <Select
          value={region}
          placeholder="Выберите регион"
          isInvalid={submitted && !region}
          options={options(dictionaries.regions)}
          onChange={setRegion}
          isDisabled={save.isPending}
        />
      </FormField>
      {save.error ? (
        <Text accessibilityRole="alert" className="text-destructive-text">
          {message(save.error)}
        </Text>
      ) : null}
      <Button
        label="Сохранить"
        isLoading={save.isPending}
        onPress={() => {
          setSubmitted(true)
          if (name.trim() && category && region) save.mutate()
        }}
      />
      <Button
        label="Отмена"
        variant="outline"
        isDisabled={save.isPending}
        onPress={onBack}
      />
    </VStack>
  )
}
