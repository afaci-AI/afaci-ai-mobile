import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { Info, Plus } from 'lucide-react-native'

import { useSession } from '@/shared/session/store'
import { formatNumber, formatSom } from '@/shared/lib/format'
import { Box } from '@/shared/ui/box'
import { Text } from '@/shared/ui/text'
import { Icon } from '@/shared/ui/icon'
import { Pressable } from '@/shared/ui/pressable'
import { HStack } from '@/shared/ui/hstack'
import {
  Button,
  Card,
  ErrorState,
  FormField,
  Header,
  LoadingView,
  Screen,
  ScrollScreen,
  Select,
  SwitchRow,
  useAppToast,
} from '@/shared/ui/kit'
import { calculatorApi } from './api'
import type { CalculatorRow, OptConstraints, SaveRecipeBody } from './types'
import { emptyRow, rowKey, useCalculatorState } from './state'
import { parseNumberInput, totalCost as calculateTotalCost } from './helpers'
import { ReferenceInfoDialog } from './components/reference-info-dialog'
import { IngredientCard } from './components/ingredient-card'
import { IngredientEditorSheet } from './components/ingredient-editor-sheet'
import { SaveRecipeDialog } from './components/save-recipe-dialog'
import { OptimizeCostDialog } from './components/optimize-cost-dialog'
import { FontSize } from '@/shared/theme/font-sizes'

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Не удалось выполнить запрос'
}
export function CalculatorScreen() {
  const s = useCalculatorState()
  const router = useRouter()
  const ownerId = useSession((state) => state.user?.id)
  const active = () =>
    mounted.current &&
    useSession.getState().status === 'authenticated' &&
    useSession.getState().user?.id === ownerId
  const { edit } = useLocalSearchParams<{ edit?: string }>()
  const toast = useAppToast()
  const queryClient = useQueryClient()
  const [editorRow, setEditorRow] = useState<CalculatorRow | null>(null)
  const [saveOpen, setSaveOpen] = useState(false)
  const [optimizeOpen, setOptimizeOpen] = useState(false)
  const [showReference, setShowReference] = useState(false)
  const [loadOpen, setLoadOpen] = useState(false)
  const [busy, setBusy] = useState<
    'compute' | 'optimize' | 'save' | 'load' | null
  >(null)
  const [error, setError] = useState<string>()
  const [saveError, setSaveError] = useState<string>()
  const [optimizeError, setOptimizeError] = useState<string>()
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  const refs = useQuery({
    queryKey: ['calculator', 'references'],
    queryFn: calculatorApi.referenceProteins,
  })
  const examples = useQuery({
    queryKey: ['calculator', 'examples'],
    queryFn: calculatorApi.examples,
  })
  const groups = useQuery({
    queryKey: ['calculator', 'groups'],
    queryFn: calculatorApi.groups,
    enabled: saveOpen,
  })
  const saved = useQuery({
    queryKey: ['calculator', 'saved'],
    queryFn: calculatorApi.savedRecipes,
    enabled: loadOpen,
  })
  const referenceId =
    s.referenceId ||
    refs.data?.find((r) => r.is_default)?.id ||
    refs.data?.[0]?.id ||
    ''
  const reference = refs.data?.find((r) => r.id === referenceId)
  const sum = s.rows.reduce(
    (total, r) => total + (parseNumberInput(r.amount) ?? 0),
    0,
  )
  const validRows =
    s.rows.length > 0 &&
    s.rows.every(
      (r) => r.product_id && (parseNumberInput(r.amount) ?? -1) >= 0,
    ) &&
    new Set(s.rows.map((r) => r.product_id)).size === s.rows.length
  const sumValid = Math.abs(sum - 100) < 1e-8
  const validPrices =
    !s.costEnabled ||
    s.rows.every((r) => (parseNumberInput(r.price) ?? -1) >= 0)
  const canCompute = validRows && sumValid && Boolean(referenceId)
  const totalCost = s.costEnabled ? calculateTotalCost(s.rows) : null
  const items = () =>
    s.rows.map((r, i) => ({
      product_id: r.product_id,
      amount_g: parseNumberInput(r.amount) ?? 0,
      sort_order: i,
      price_per_kg: s.costEnabled ? parseNumberInput(r.price) : null,
    }))

  async function loadRecipe(id: string) {
    if (busy) return
    setBusy('load')
    setError(undefined)
    s.invalidate()
    const revision = s.revision.current
    try {
      const recipe = await calculatorApi.recipe(id)
      if (!active()) return
      const rows = await Promise.all(
        recipe.items.map(async (item) => {
          const productName =
            item.product_name ||
            (await calculatorApi.product(item.product_id)).name
          return {
            key: rowKey(),
            product_id: item.product_id,
            product_name: productName,
            amount: String(item.amount_g),
            price: item.price_per_kg == null ? '' : String(item.price_per_kg),
          }
        }),
      )
      if (!active() || revision !== s.revision.current) return
      s.changeRows(rows.length ? rows : [emptyRow()])
      s.setReferenceId(recipe.reference_protein_id)
      s.setCostEnabled(recipe.items.some((i) => i.price_per_kg != null))
      s.setEditing(recipe)
      setLoadOpen(false)
    } catch (e) {
      if (active() && revision === s.revision.current) setError(errorMessage(e))
    } finally {
      if (active()) setBusy(null)
    }
  }
  const loadedEdit = useRef<string | null>(null)
  useEffect(() => {
    if (!edit) loadedEdit.current = null
    if (!busy && edit && loadedEdit.current !== edit) {
      loadedEdit.current = edit
      // Consume the navigation intent so reopening the same recipe reloads it.
      router.setParams({ edit: undefined })
      void loadRecipe(edit)
    }
  })

  async function compute() {
    if (!canCompute || busy) return
    setBusy('compute')
    setError(undefined)
    s.setResult(null)
    const revision = s.revision.current
    try {
      const result = await calculatorApi.compute({
        reference_protein_id: referenceId,
        items: items(),
      })
      if (active() && revision === s.revision.current) {
        s.setResult(result)
        router.push('/calculator/result')
      }
    } catch (e) {
      if (active() && revision === s.revision.current) setError(errorMessage(e))
    } finally {
      if (active()) setBusy(null)
    }
  }
  async function save(value: {
    name: string
    group_id: string | null
    new_group_name?: string
    draft: boolean
    asNew: boolean
  }) {
    if (
      busy ||
      !validRows ||
      !validPrices ||
      !referenceId ||
      (!value.draft && !canCompute)
    )
      return
    setBusy('save')
    setSaveError(undefined)
    const body: SaveRecipeBody = {
      name: value.name,
      group_id: value.group_id,
      new_group_name: value.new_group_name,
      reference_protein_id: referenceId,
      items: items(),
      draft: value.draft,
    }
    try {
      // PATCH has no new_group_name field; create the selected group first.
      if (s.editing && !value.asNew && value.new_group_name) {
        const group = await calculatorApi.createGroup(value.new_group_name)
        if (!active()) return
        body.group_id = group.id
        delete body.new_group_name
      }
      const recipe =
        s.editing && !value.asNew
          ? await calculatorApi.updateRecipe(s.editing.id, body)
          : await calculatorApi.saveRecipe(body)
      if (!active()) return
      s.setEditing(recipe)
      setSaveOpen(false)
      void queryClient.invalidateQueries({ queryKey: ['calculator', 'saved'] })
      void queryClient.invalidateQueries({ queryKey: ['calculator', 'groups'] })
      void queryClient.invalidateQueries({
        queryKey: ['saved', 'detail', recipe.id],
      })
      toast.success({ title: 'Рецептура сохранена' })
    } catch (e) {
      if (active()) setSaveError(errorMessage(e))
    } finally {
      if (active()) setBusy(null)
    }
  }
  async function optimize(
    constraints: OptConstraints,
    bounds: { key: string; min_amount_g: number; max_amount_g: number }[],
  ) {
    if (
      busy ||
      !validPrices ||
      !s.costEnabled ||
      s.rows.length === 0 ||
      !referenceId ||
      s.rows.some((r) => !r.product_id) ||
      new Set(s.rows.map((r) => r.product_id)).size !== s.rows.length
    )
      return
    setBusy('optimize')
    setOptimizeError(undefined)
    const revision = s.revision.current
    try {
      const result = await calculatorApi.optimizeCost({
        reference_protein_id: referenceId,
        constraints,
        candidates: s.rows.map((r) => ({
          product_id: r.product_id,
          price_per_kg: parseNumberInput(r.price) ?? 0,
          min_amount_g: bounds.find((b) => b.key === r.key)?.min_amount_g,
          max_amount_g: bounds.find((b) => b.key === r.key)?.max_amount_g,
        })),
      })
      if (!active() || revision !== s.revision.current) return
      const amounts = new Map(
        result.optimal_items.map((i) => [i.product_id, i.amount_g]),
      )
      s.changeRows(
        s.rows.map((r) => ({
          ...r,
          amount: String(amounts.get(r.product_id) ?? 0),
        })),
      )
      s.setResult(result.report)
      router.push('/calculator/result')
      setOptimizeOpen(false)
      const optimizedSum = result.optimal_items.reduce(
        (sum, item) => sum + item.amount_g,
        0,
      )
      if (Math.abs(optimizedSum - 100) >= 1e-8)
        setError(
          'Сервер округлил оптимальные массы. Скорректируйте сумму до 100 г перед повторным расчётом или сохранением готовой рецептуры.',
        )
      toast.success({
        title: 'Стоимость оптимизирована',
        description: `${formatSom(result.total_cost_per_100g)} / 100 г`,
      })
    } catch (e) {
      if (active() && revision === s.revision.current)
        setOptimizeError(errorMessage(e))
    } finally {
      if (active()) setBusy(null)
    }
  }
  const patch = (key: string, value: Partial<CalculatorRow>) => {
    s.patchRow(key, value)
    setError(undefined)
  }
  if (refs.isPending)
    return (
      <Screen>
        <Header title="Калькулятор" />
        <LoadingView />
      </Screen>
    )
  if (refs.error)
    return (
      <Screen>
        <Header title="Калькулятор" />
        <ErrorState
          message={errorMessage(refs.error)}
          onRetry={() => void refs.refetch()}
        />
      </Screen>
    )
  return (
    <>
      <ScrollScreen>
        <Header title="Калькулятор" subtitle="Расчёт по методике Липатова" />
        {s.editing ? (
          <Text className="text-foreground">
            Редактирование: {s.editing.name}
          </Text>
        ) : null}
        <Card>
          <FormField label="Эталонный белок">
            <HStack space="sm" className="items-center">
              <Box className="min-w-0 flex-1">
                <Select
                  options={(refs.data ?? []).map((r) => ({
                    label: r.name,
                    value: r.id,
                  }))}
                  value={referenceId}
                  onChange={(id) => s.changeReference(id)}
                  isDisabled={!!busy}
                  selectedTextSize={FontSize.sm}
                />
              </Box>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Информация об эталонном белке${reference ? `: ${reference.name}` : ''}`}
                accessibilityState={{ disabled: !reference }}
                disabled={!reference}
                onPress={() => setShowReference(true)}
                className="h-12 w-12 shrink-0 items-center justify-center rounded-md data-[active=true]:bg-muted"
              >
                <Icon as={Info} size="lg" className="text-muted-foreground" />
              </Pressable>
            </HStack>
          </FormField>
        </Card>
        <Card>
          <SwitchRow
            label="Учитывать стоимость"
            description="Цена ингредиента в сом/кг"
            value={s.costEnabled}
            onValueChange={(v) => s.changeCost(v)}
            isDisabled={!!busy}
          />
        </Card>
        {s.rows
          .filter((row) => row.product_id)
          .map((row) => (
            <IngredientCard
              key={row.key}
              row={row}
              costEnabled={s.costEnabled}
              disabled={!!busy}
              onEdit={() => setEditorRow(row)}
              onDelete={() => {
                s.changeRows(s.rows.filter((r) => r.key !== row.key))
                setError(undefined)
              }}
            />
          ))}
        <Button
          label="Добавить ингредиент"
          icon={Plus}
          variant="outline"
          disabled={!!busy}
          onPress={() => setEditorRow(emptyRow())}
        />
        <Card>
          <Text
            className={sumValid ? 'text-foreground' : 'text-destructive-text'}
          >
            Сумма: {formatNumber(sum, 6)} / 100 г
          </Text>
          <Text size={FontSize.sm} className="text-muted-foreground">
            Для расчёта и сохранения готовой рецептуры требуется ровно 100 г.
            Черновик можно сохранить с другой суммой.
          </Text>
          {s.costEnabled ? (
            <Text className="text-foreground">
              Стоимость рецептуры: {formatSom(totalCost)}
              {sumValid ? ' / 100 г' : ''}
            </Text>
          ) : null}
        </Card>
        {error ? (
          <ErrorState title="Операция не выполнена" message={error} />
        ) : null}
        <Button
          label="Рассчитать"
          disabled={!canCompute || !!busy}
          isLoading={busy === 'compute'}
          onPress={() => void compute()}
        />
        <Button
          label="Сохранить рецептуру"
          variant="outline"
          disabled={!validRows || !validPrices || !referenceId || !!busy}
          onPress={() => {
            setSaveError(undefined)
            setSaveOpen(true)
          }}
        />
        <Button
          label="Оптимизировать стоимость"
          variant="outline"
          disabled={
            !s.costEnabled ||
            s.rows.length === 0 ||
            !validPrices ||
            s.rows.some((r) => !r.product_id) ||
            !!busy
          }
          onPress={() => {
            setOptimizeError(undefined)
            setOptimizeOpen(true)
          }}
        />
        <Button
          label="Открыть сохранённую рецептуру"
          variant="outline"
          disabled={!!busy}
          onPress={() => setLoadOpen(!loadOpen)}
        />
        {loadOpen ? (
          <Card>
            {saved.isPending ? (
              <LoadingView />
            ) : saved.error ? (
              <ErrorState
                message={errorMessage(saved.error)}
                onRetry={() => void saved.refetch()}
              />
            ) : saved.data?.length ? (
              <Select
                options={saved.data.map((r) => ({
                  label: r.name,
                  value: r.id,
                }))}
                value={null}
                placeholder="Выберите рецептуру"
                onChange={(id) => void loadRecipe(id)}
                isDisabled={!!busy}
              />
            ) : (
              <Text className="text-muted-foreground">
                Сохранённых рецептур пока нет
              </Text>
            )}
          </Card>
        ) : null}
        <Button
          label="Загрузить пример"
          variant="secondary"
          disabled={!examples.data?.length || !!busy}
          onPress={() => {
            const example = examples.data?.[0]
            if (!example) return
            s.changeRows(
              example.items.map((i) => ({
                key: rowKey(),
                product_id: i.product_id,
                product_name: i.name,
                amount: String(i.amount_g),
                price: '',
              })),
            )
            s.setCostEnabled(false)
            s.setEditing(null)
            setError(undefined)
          }}
        />
        {examples.error ? (
          <ErrorState
            title="Примеры недоступны"
            message={errorMessage(examples.error)}
            onRetry={() => void examples.refetch()}
          />
        ) : null}
        <Button
          label="Сбросить"
          variant="ghost"
          disabled={!!busy}
          onPress={() => {
            s.changeRows([])
            s.setReferenceId('')
            s.setCostEnabled(false)
            s.setEditing(null)
            setError(undefined)
          }}
        />
        {s.result ? (
          <Button
            label="Открыть результат"
            variant="outline"
            onPress={() => router.push('/calculator/result')}
          />
        ) : null}
      </ScrollScreen>
      <ReferenceInfoDialog
        open={showReference}
        reference={reference}
        onClose={() => setShowReference(false)}
      />
      <IngredientEditorSheet
        open={editorRow !== null}
        row={editorRow}
        costEnabled={s.costEnabled}
        excludedIds={s.rows
          .filter((r) => r.key !== editorRow?.key)
          .map((r) => r.product_id)
          .filter(Boolean)}
        onClose={() => setEditorRow(null)}
        onSave={(row) => {
          if (s.rows.some((r) => r.key === row.key)) patch(row.key, row)
          else {
            s.changeRows([...s.rows.filter((r) => r.product_id), row])
            setError(undefined)
          }
          setEditorRow(null)
        }}
      />
      <SaveRecipeDialog
        open={saveOpen}
        onClose={() => {
          if (!busy) setSaveOpen(false)
        }}
        groups={groups.data ?? []}
        groupsLoading={groups.isPending}
        groupsError={groups.error ? errorMessage(groups.error) : undefined}
        onRetryGroups={() => void groups.refetch()}
        editing={s.editing}
        canSaveCalculated={canCompute}
        pending={busy === 'save'}
        error={saveError}
        onSave={(v) => void save(v)}
      />
      <OptimizeCostDialog
        open={optimizeOpen}
        onClose={() => {
          if (!busy) setOptimizeOpen(false)
        }}
        rows={s.rows}
        pending={busy === 'optimize'}
        error={optimizeError}
        onOptimize={(c, b) => void optimize(c, b)}
      />
    </>
  )
}

export function AuthenticatedCalculator() {
  const user = useSession((state) => state.user)
  const status = useSession((state) => state.status)
  return status === 'authenticated' && user ? (
    <CalculatorScreen key={user.id} />
  ) : null
}
