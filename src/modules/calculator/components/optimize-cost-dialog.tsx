import { useState } from 'react'

import { parseNumberInput } from '@/shared/lib/format'
import { Box } from '@/shared/ui/box'
import { Heading } from '@/shared/ui/heading'
import { Button, FormField, Input } from '@/shared/ui/kit'
import {
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalContent,
  ModalHeader,
} from '@/shared/ui/modal'
import { Text } from '@/shared/ui/text'
import { VStack } from '@/shared/ui/vstack'

import type { CalculatorRow, OptConstraints } from '../types'

export interface OptimizationBound {
  key: string
  min_amount_g: number
  max_amount_g: number
}
interface Props {
  open: boolean
  onClose: () => void
  rows: CalculatorRow[]
  pending: boolean
  error?: string
  onOptimize: (constraints: OptConstraints, bounds: OptimizationBound[]) => void
}

export function OptimizeCostDialog(props: Props) {
  return (
    <Modal
      avoidKeyboard
      isOpen={props.open}
      onClose={() => {
        if (!props.pending) props.onClose()
      }}
      size="lg"
      closeOnOverlayClick={!props.pending}
    >
      <ModalBackdrop />
      <ModalContent className="max-h-5/6 p-4">
        <ModalHeader>
          <Heading size="md" className="text-foreground">
            Оптимизация стоимости
          </Heading>
        </ModalHeader>
        {props.open ? <OptimizeForm {...props} /> : null}
      </ModalContent>
    </Modal>
  )
}

function OptimizeForm({ onClose, rows, pending, error, onOptimize }: Props) {
  const [bc, setBc] = useState('')
  const [kras, setKras] = useState('')
  const [bounds, setBounds] = useState(() =>
    rows.map((row) => ({ key: row.key, min: '', max: '' })),
  )
  const [validation, setValidation] = useState('')
  const patch = (key: string, field: 'min' | 'max', value: string) =>
    setBounds((current) =>
      current.map((bound) =>
        bound.key === key ? { ...bound, [field]: value } : bound,
      ),
    )
  const submit = () => {
    const bcValue = bc.trim() ? parseNumberInput(bc) : undefined
    const krasValue = kras.trim() ? parseNumberInput(kras) : undefined
    if (
      bcValue === null ||
      krasValue === null ||
      (bcValue !== undefined && (bcValue < 0 || bcValue > 100)) ||
      (krasValue !== undefined && (krasValue < 0 || krasValue > 100))
    ) {
      setValidation('Ограничения качества должны быть числами от 0 до 100.')
      return
    }
    const values: OptimizationBound[] = []
    for (const bound of bounds) {
      const min = bound.min.trim() ? parseNumberInput(bound.min) : 0
      const max = bound.max.trim() ? parseNumberInput(bound.max) : 100
      if (min === null || max === null || min < 0 || max > 100 || min > max) {
        setValidation(
          'Для каждого ингредиента: 0 ≤ минимум ≤ максимум ≤ 100 г.',
        )
        return
      }
      values.push({ key: bound.key, min_amount_g: min, max_amount_g: max })
    }
    if (
      values.reduce((sum, bound) => sum + bound.min_amount_g, 0) > 100 ||
      values.reduce((sum, bound) => sum + bound.max_amount_g, 0) < 100
    ) {
      setValidation('В указанных диапазонах невозможно получить сумму 100 г.')
      return
    }
    setValidation('')
    onOptimize(
      {
        ...(bcValue !== undefined ? { bc_min: bcValue } : {}),
        ...(krasValue !== undefined ? { kras_max: krasValue } : {}),
      },
      values,
    )
  }
  return (
    <ModalBody keyboardShouldPersistTaps="handled">
      <VStack space="lg">
        <Text className="text-muted-foreground">
          Сервер подберёт массы для минимальной стоимости на 100 г. Цены
          ингредиентов задаются в сом/кг. Ограничения качества необязательны.
        </Text>
        <FormField label="Минимальная БЦ, %">
          <Input
            accessibilityLabel="Минимальная биологическая ценность"
            keyboardType="decimal-pad"
            value={bc}
            onChangeText={setBc}
            isDisabled={pending}
            placeholder="Без ограничения"
          />
        </FormField>
        <FormField label="Максимальный КРАС, %">
          <Input
            accessibilityLabel="Максимальный КРАС"
            keyboardType="decimal-pad"
            value={kras}
            onChangeText={setKras}
            isDisabled={pending}
            placeholder="Без ограничения"
          />
        </FormField>
        <Heading size="sm" className="text-foreground">
          Диапазоны масс ингредиентов
        </Heading>
        {rows.map((row) => {
          const bound = bounds.find((item) => item.key === row.key)
          return (
            <Box key={row.key} className="gap-3 border-b border-border pb-3">
              <Text bold className="text-foreground">
                {row.product_name}
              </Text>
              <FormField label="Минимум, г">
                <Input
                  accessibilityLabel={`Минимальная масса: ${row.product_name}`}
                  keyboardType="decimal-pad"
                  value={bound?.min ?? ''}
                  placeholder="0"
                  isDisabled={pending}
                  onChangeText={(value) => patch(row.key, 'min', value)}
                />
              </FormField>
              <FormField label="Максимум, г">
                <Input
                  accessibilityLabel={`Максимальная масса: ${row.product_name}`}
                  keyboardType="decimal-pad"
                  value={bound?.max ?? ''}
                  placeholder="100"
                  isDisabled={pending}
                  onChangeText={(value) => patch(row.key, 'max', value)}
                />
              </FormField>
            </Box>
          )
        })}
        {validation || error ? (
          <Text accessibilityRole="alert" className="text-destructive-text">
            {validation || error}
          </Text>
        ) : null}
        <Button
          label="Оптимизировать"
          isLoading={pending}
          isDisabled={!rows.length}
          onPress={submit}
        />
        <Button
          label="Отмена"
          variant="outline"
          isDisabled={pending}
          onPress={onClose}
        />
      </VStack>
    </ModalBody>
  )
}
