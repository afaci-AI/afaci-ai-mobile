import { router } from 'expo-router'
import { MapPin } from 'lucide-react-native'
import { memo } from 'react'

import type { FlatProduct } from '@/modules/catalog/api'
import { HStack } from '@/shared/ui/hstack'
import { Icon } from '@/shared/ui/icon'
import { Card } from '@/shared/ui/kit'
import { Pressable } from '@/shared/ui/pressable'
import { Text } from '@/shared/ui/text'
import { VStack } from '@/shared/ui/vstack'
import { FontSize } from '@/shared/theme/font-sizes'

/**
 * Плитка продукта для сетки в две колонки. Высота фиксирована, чтобы все
 * плитки были одного размера; длинные названия и категории обрезаются
 * многоточием, а регион прижат к низу карточки.
 */
export const ProductGridCard = memo(function ProductGridCard({
  product,
}: {
  product: FlatProduct
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Открыть состав: ${product.product_name}`}
      onPress={() =>
        router.push({
          pathname: '/database/[id]',
          params: { id: product.product_id },
        })
      }
      className="flex-1 rounded-xl data-[active=true]:bg-muted"
    >
      <Card className="h-36 gap-2 p-3">
        <VStack space="xs" className="flex-1">
          <Text bold numberOfLines={2} className="text-card-foreground">
            {product.product_name || 'Продукт без названия'}
          </Text>
          <Text
            size={FontSize.sm}
            numberOfLines={2}
            className="text-muted-foreground"
          >
            {[product.category_name, product.subcategory_name]
              .filter(Boolean)
              .join(' · ') || 'Категория не указана'}
          </Text>
        </VStack>
        <HStack space="xs" className="items-center">
          <Icon as={MapPin} size="sm" className="text-muted-foreground" />
          <Text
            size={FontSize.xs}
            numberOfLines={1}
            className="flex-1 text-muted-foreground"
          >
            {product.region_name || 'Регион не указан'}
          </Text>
        </HStack>
      </Card>
    </Pressable>
  )
})
