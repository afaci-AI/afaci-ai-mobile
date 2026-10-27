import { MapPin, Pencil, Trash2 } from 'lucide-react-native'

import type { FlatProduct } from '@/modules/catalog/api'
import { Button, ButtonIcon } from '@/shared/ui/button'
import { HStack } from '@/shared/ui/hstack'
import { Icon } from '@/shared/ui/icon'
import { Card } from '@/shared/ui/kit'
import { Pressable } from '@/shared/ui/pressable'
import { Text } from '@/shared/ui/text'
import { VStack } from '@/shared/ui/vstack'

interface Props {
  product: FlatProduct
  canEdit: boolean
  onOpen: () => void
  onEdit: () => void
  onDelete: () => void
}

/** Public catalog tile styling with separate administrative actions. */
export function AdminProductGridCard({
  product,
  canEdit,
  onOpen,
  onEdit,
  onDelete,
}: Props) {
  return (
    <Card className="flex-1 gap-0 p-0">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Открыть состав: ${product.product_name}`}
        onPress={onOpen}
        className="h-36 gap-2 rounded-xl p-3 data-[active=true]:bg-muted"
      >
        <VStack space="xs" className="flex-1">
          <Text bold numberOfLines={2} className="text-card-foreground">
            {product.product_name || 'Продукт без названия'}
          </Text>
          <Text size="sm" numberOfLines={2} className="text-muted-foreground">
            {[product.category_name, product.subcategory_name]
              .filter(Boolean)
              .join(' · ') || 'Категория не указана'}
          </Text>
        </VStack>
        <HStack space="xs" className="items-center">
          <Icon as={MapPin} size="sm" className="text-muted-foreground" />
          <Text
            size="xs"
            numberOfLines={1}
            className="flex-1 text-muted-foreground"
          >
            {product.region_name || 'Регион не указан'}
          </Text>
        </HStack>
      </Pressable>
      {canEdit ? (
        <HStack space="sm" className="justify-end border-t border-border p-2">
          <Button
            size="icon"
            variant="ghost"
            className="min-h-12 min-w-12"
            accessibilityLabel={`Редактировать продукт ${product.product_name}`}
            onPress={onEdit}
          >
            <ButtonIcon as={Pencil} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="min-h-12 min-w-12"
            accessibilityLabel={`Удалить продукт ${product.product_name}`}
            onPress={onDelete}
          >
            <ButtonIcon as={Trash2} className="text-destructive-text" />
          </Button>
        </HStack>
      ) : null}
    </Card>
  )
}
