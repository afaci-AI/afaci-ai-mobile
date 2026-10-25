import { router } from 'expo-router'
import { ChevronRight, MapPin } from 'lucide-react-native'
import { memo } from 'react'

import type { FlatProduct } from '@/modules/catalog/api'
import { Box } from '@/shared/ui/box'
import { HStack } from '@/shared/ui/hstack'
import { Icon } from '@/shared/ui/icon'
import { Card } from '@/shared/ui/kit'
import { Pressable } from '@/shared/ui/pressable'
import { Text } from '@/shared/ui/text'
import { VStack } from '@/shared/ui/vstack'

export const ProductListCard = memo(function ProductListCard({
  product,
}: {
  product: FlatProduct
}) {
  return (
    <Box className="px-4 pb-3">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Открыть состав: ${product.product_name}`}
        onPress={() =>
          router.push({
            pathname: '/database/[id]',
            params: { id: product.product_id },
          })
        }
        className="rounded-xl data-[active=true]:bg-muted"
      >
        <Card>
          <HStack space="md" className="items-center">
            <VStack space="sm" className="flex-1">
              <Text bold className="text-card-foreground">
                {product.product_name || 'Продукт без названия'}
              </Text>
              <Text size="sm" className="text-muted-foreground">
                {[product.category_name, product.subcategory_name]
                  .filter(Boolean)
                  .join(' · ') || 'Категория не указана'}
              </Text>
              <HStack space="xs" className="items-center">
                <Icon as={MapPin} size="sm" className="text-muted-foreground" />
                <Text size="sm" className="flex-1 text-muted-foreground">
                  {product.region_name || 'Регион не указан'}
                </Text>
              </HStack>
            </VStack>
            <Icon
              as={ChevronRight}
              size="md"
              className="text-muted-foreground"
            />
          </HStack>
        </Card>
      </Pressable>
    </Box>
  )
})
