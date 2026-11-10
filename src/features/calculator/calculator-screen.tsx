import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { BackHandler } from 'react-native'
import { Info, Plus, Save } from 'lucide-react-native'

import { useSession } from '@/shared/session/store'
import { formatNumber, formatSom } from '@/shared/lib/format'
import { Box } from '@/shared/ui/box'
import {
  Button as IconButton,
  ButtonIcon,
  ButtonText,
} from '@/shared/ui/button'
import { Text } from '@/shared/ui/text'
import { Icon } from '@/shared/ui/icon'
import { Pressable } from '@/shared/ui/pressable'
import { HStack } from '@/shared/ui/hstack'
import {
  Button,
  Card,
  ConfirmDialog,
  ErrorState,
  FormField,
  Header,
  LoadingView,
  Screen,
  ScrollScreen,
  Select,
  SwitchRow,
  UnsavedChangesDialog,
  useAppToast,
} from '@/shared/ui/kit'
import { calculatorApi } from './api'
import type {
  CalculatorRow,
  OptConstraints,
  RecipeMetrics,
  SaveRecipeBody,
} from './types'
import { emptyRow, recipeSignature, rowKey, useCalculatorState } from './state'
import { parseNumberInput, totalCost as calculateTotalCost } from './helpers'
import { ReferenceInfoDialog } from './components/reference-info-dialog'
import { IngredientCard } from './components/ingredient-card'
import { IngredientEditorSheet } from './components/ingredient-editor-sheet'
import { SaveRecipeDialog } from './components/save-recipe-dialog'
import { OptimizeCostDialog } from './components/optimize-cost-dialog'
import { FontSize } from '@/shared/theme/font-sizes'

interface SaveValues {
  name: string
  group_id: string | null
  new_group_name?: string
  draft: boolean
  asNew: boolean
}

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
  const { edit, calc } = useLocalSearchParams<{
    edit?: string
    calc?: string
  }>()
  const toast = useAppToast()
  const queryClient = useQueryClient()
  const [editorRow, setEditorRow] = useState<CalculatorRow | null>(null)
  const [saveOpen, setSaveOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [deleteRow, setDeleteRow] = useState<CalculatorRow | null>(null)
  const [optimizeOpen, setOptimizeOpen] = useState(false)
  const [showReference, setShowReference] = useState(false)
  const [confirmSave, setConfirmSave] = useState<SaveValues | null>(null)
  const [leaveOpen, setLeaveOpen] = useState(false)
  const [leaveAfterSave, setLeaveAfterSave] = useState(false)
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
  const dirty =
    s.editing !== null &&
    s.baseline !== null &&
    recipeSignature(s.rows, referenceId, s.costEnabled) !== s.baseline
  const totalCost = s.costEnabled ? calculateTotalCost(s.rows) : null
  const items = () =>
    s.rows.map((r, i) => ({
      product_id: r.product_id,
      amount_g: parseNumberInput(r.amount) ?? 0,
      sort_order: i,
      price_per_kg: s.costEnabled ? parseNumberInput(r.price) : null,
    }))

  async function loadRecipe(id: string, thenCompute = false) {
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
      const loadedRows = rows.length ? rows : [emptyRow()]
      s.setEditing(recipe)
      s.setBaseline(
        recipeSignature(
          loadedRows,
          recipe.reference_protein_id,
          recipe.items.some((i) => i.price_per_kg != null),
        ),
      )
      if (thenCompute) {
        const loadedItems = recipe.items.map((item, i) => ({
          product_id: item.product_id,
          amount_g: item.amount_g,
          sort_order: i,
          price_per_kg: item.price_per_kg ?? null,
        }))
        if (!loadedItems.length) {
          setError('В рецептуре нет ингредиентов: расчёт невозможен.')
        } else if (
          Math.abs(loadedItems.reduce((t, i) => t + i.amount_g, 0) - 100) >=
          1e-8
        ) {
          setError(
            'Сумма состава не равна 100 г (рецептура сохранена как черновик): расчёт невозможен. Скорректируйте массы.',
          )
        } else {
          await computeWith(recipe.reference_protein_id, loadedItems, recipe)
        }
      }
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
      router.setParams({ edit: undefined, calc: undefined })
      void loadRecipe(edit, calc === '1')
    }
  })

  /** Расчёт на backend; `compare` — сохранённая рецептура, с метриками которой сверяется результат. */
  async function computeWith(
    refId: string,
    computeItems: ReturnType<typeof items>,
    compare: { name: string; metrics: RecipeMetrics } | null,
    startedAt: number = s.revision.current,
  ) {
    const result = await calculatorApi.compute({
      reference_protein_id: refId,
      items: computeItems,
    })
    if (active() && startedAt === s.revision.current) {
      s.setResult(result, compare)
      router.push('/calculator/result')
    }
  }
  async function compute() {
    if (!canCompute || busy) return
    setBusy('compute')
    setError(undefined)
    s.setResult(null)
    const revision = s.revision.current
    try {
      // Сверка с сохранёнными метриками имеет смысл, только пока состав не менялся.
      await computeWith(
        referenceId,
        items(),
        s.editing && !dirty
          ? { name: s.editing.name, metrics: s.editing.metrics }
          : null,
      )
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
      s.setBaseline(recipeSignature(s.rows, referenceId, s.costEnabled))
      setSaveOpen(false)
      void queryClient.invalidateQueries({ queryKey: ['calculator', 'saved'] })
      void queryClient.invalidateQueries({ queryKey: ['calculator', 'groups'] })
      void queryClient.invalidateQueries({
        queryKey: ['saved', 'detail', recipe.id],
      })
      toast.success({ title: 'Рецептура сохранена' })
      if (leaveAfterSave) {
        setLeaveAfterSave(false)
        leave()
      }
    } catch (e) {
      if (active()) {
        setSaveError(errorMessage(e))
        // Диалог мог быть закрыт ради подтверждения: показываем ошибку и данные.
        setSaveOpen(true)
        setLeaveAfterSave(false)
      }
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
  /** Выход из редактирования сохранённой рецептуры: состояние калькулятора очищается. */
  function leave() {
    const id = s.editing?.id
    s.changeRows([])
    s.setReferenceId('')
    s.setCostEnabled(false)
    s.setEditing(null)
    s.setBaseline(null)
    setError(undefined)
    // Возврат к карточке рецептуры: history вкладок вернул бы на главную.
    if (id) router.dismissTo({ pathname: '/saved/[id]', params: { id } })
    else router.navigate('/(tabs)/saved')
  }
  function requestBack() {
    if (busy) return
    if (dirty) setLeaveOpen(true)
    else leave()
  }
  function saveBeforeLeave() {
    if (!s.editing) return
    setLeaveOpen(false)
    if (!validRows || !validPrices || !referenceId) {
      setError('Исправьте состав рецептуры, чтобы сохранить изменения.')
      return
    }
    setLeaveAfterSave(true)
    setConfirmSave({
      name: s.editing.name,
      group_id: s.editing.group_id,
      draft: !canCompute,
      asNew: false,
    })
  }
  const backRef = useRef(requestBack)
  backRef.current = requestBack
  const isEditing = s.editing !== null
  useFocusEffect(
    useCallback(() => {
      if (!isEditing) return undefined
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          backRef.current()
          return true
        },
      )
      return () => subscription.remove()
    }, [isEditing]),
  )
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
    <Box className="flex-1">
      <ScrollScreen contentClassName="pb-24">
        <Header
          title="Калькулятор"
          subtitle="Расчёт по методике Липатова"
          onBack={s.editing ? requestBack : undefined}
        />
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
                  searchable={false}
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
              onDelete={() => setDeleteRow(row)}
            />
          ))}
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
        <HStack space="sm" className="items-center">
          <Button
            label="Рассчитать"
            className="flex-1"
            disabled={!canCompute || !!busy}
            isLoading={busy === 'compute'}
            onPress={() => void compute()}
          />
          <IconButton
            variant="outline"
            size="icon"
            className="h-12 w-12"
            accessibilityLabel="Сохранить рецептуру"
            isDisabled={!validRows || !validPrices || !referenceId || !!busy}
            onPress={() => {
              setSaveError(undefined)
              setSaveOpen(true)
            }}
          >
            <ButtonIcon as={Save} />
          </IconButton>
        </HStack>
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
        <IconButton
          variant="outline"
          className="min-h-12 border-destructive data-[active=true]:bg-destructive/10 dark:border-destructive dark:data-[active=true]:bg-destructive/10"
          isDisabled={!!busy}
          onPress={() => setResetOpen(true)}
        >
          <ButtonText className="text-destructive-text">Сбросить</ButtonText>
        </IconButton>
        {s.result ? (
          <Button
            label="Открыть результат"
            variant="outline"
            onPress={() => router.push('/calculator/result')}
          />
        ) : null}
      </ScrollScreen>
      {!editorRow && !saveOpen && !showReference && !resetOpen && !deleteRow ? (
        <IconButton
          size="icon"
          className="absolute right-4 bottom-4 h-14 w-14 rounded-full shadow-lg"
          accessibilityLabel="Добавить ингредиент"
          isDisabled={!!busy}
          onPress={() => setEditorRow(emptyRow())}
        >
          <ButtonIcon as={Plus} className="h-6 w-6" />
        </IconButton>
      ) : null}
      <ConfirmDialog
        isOpen={resetOpen}
        title="Сбросить рецептуру?"
        description="Все ингредиенты будут удалены, результаты расчёта и несохранённые изменения — очищены."
        confirmLabel="Сбросить"
        isDestructive
        onClose={() => setResetOpen(false)}
        onConfirm={() => {
          if (busy) return
          s.changeRows([])
          s.setReferenceId('')
          s.setCostEnabled(false)
          s.setEditing(null)
          setError(undefined)
          setResetOpen(false)
        }}
      />
      <ConfirmDialog
        isOpen={deleteRow !== null}
        title="Удалить ингредиент?"
        description={
          deleteRow
            ? `«${deleteRow.product_name || 'Ингредиент'}» будет удалён из рецептуры. Результат расчёта будет сброшен.`
            : undefined
        }
        confirmLabel="Удалить"
        isDestructive
        onClose={() => setDeleteRow(null)}
        onConfirm={() => {
          if (busy || !deleteRow) return
          s.changeRows(s.rows.filter((row) => row.key !== deleteRow.key))
          setError(undefined)
          setDeleteRow(null)
        }}
      />
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
        onSave={(v) => {
          // Перезапись существующей рецептуры требует отдельного подтверждения.
          if (s.editing && !v.asNew) {
            setSaveOpen(false)
            setConfirmSave(v)
          } else void save(v)
        }}
      />
      <ConfirmDialog
        isOpen={confirmSave !== null}
        title="Сохранить изменения в рецептуре?"
        description={
          s.editing
            ? `Рецептура «${s.editing.name}» будет перезаписана.`
            : undefined
        }
        confirmLabel="Сохранить"
        isLoading={busy === 'save'}
        onClose={() => {
          if (busy) return
          setConfirmSave(null)
          if (leaveAfterSave) {
            setLeaveAfterSave(false)
            setLeaveOpen(true)
          } else setSaveOpen(true)
        }}
        onConfirm={() => {
          const value = confirmSave
          if (!value || busy) return
          setConfirmSave(null)
          void save(value)
        }}
      />
      <UnsavedChangesDialog
        isOpen={leaveOpen}
        onSave={saveBeforeLeave}
        onDiscard={() => {
          setLeaveOpen(false)
          leave()
        }}
        onStay={() => setLeaveOpen(false)}
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
    </Box>
  )
}

export function AuthenticatedCalculator() {
  const user = useSession((state) => state.user)
  const status = useSession((state) => state.status)
  return status === 'authenticated' && user ? (
    <CalculatorScreen key={user.id} />
  ) : null
}
