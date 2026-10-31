import { Pencil, Trash2 } from 'lucide-react-native'
import { memo } from 'react'

import { formatNumber } from '@/shared/lib/format'
import { Box } from '@/shared/ui/box'
import { Button, ButtonIcon } from '@/shared/ui/button'
import { Card } from '@/shared/ui/kit'
import { Text } from '@/shared/ui/text'

import { parseNumberInput } from '../helpers'
import type { CalculatorRow } from '../types'
import { FontSize } from '@/shared/theme/font-sizes'

interface IngredientCardProps {
  row: CalculatorRow
  costEnabled: boolean
  disabled?: boolean
  onEdit: () => void
  onDelete: () => void
}

export const IngredientCard = memo(function IngredientCard({
  row,
  costEnabled,
  disabled,
  onEdit,
  onDelete,
}: IngredientCardProps) {
  const name = row.product_name || 'Выберите ингредиент'
  return (
    <Card className="gap-2 p-3">
      <Text bold className="text-foreground">
        {name}
      </Text>
      <Box className="flex-row flex-wrap items-center gap-x-3 gap-y-1">
        <Box className="flex-row items-center gap-1">
          <Text size={FontSize.xs} className="text-muted-foreground">
            Масса, г
          </Text>
          <Text size={FontSize.sm} bold className="text-foreground">
            {formatNumber(parseNumberInput(row.amount), 6)}
          </Text>
        </Box>
        {costEnabled ? (
          <Box className="flex-row items-center gap-1">
            <Text size={FontSize.xs} className="text-muted-foreground">
              Цена, сом/кг
            </Text>
            <Text size={FontSize.sm} bold className="text-foreground">
              {formatNumber(parseNumberInput(row.price), 6)}
            </Text>
          </Box>
        ) : null}
        <Box className="ml-auto flex-row">
          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12"
            accessibilityLabel={`Редактировать: ${name}`}
            isDisabled={disabled}
            onPress={onEdit}
          >
            <ButtonIcon as={Pencil} className="text-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12"
            accessibilityLabel={`Удалить: ${name}`}
            isDisabled={disabled}
            onPress={onDelete}
          >
            <ButtonIcon as={Trash2} className="text-destructive-text" />
          </Button>
        </Box>
      </Box>
    </Card>
  )
})
