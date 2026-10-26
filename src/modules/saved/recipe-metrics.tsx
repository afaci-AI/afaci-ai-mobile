import type { SavedRecipe } from '@/modules/calculator/types'
import { formatNumber } from '@/shared/lib/format'
import { ScrollView } from '@/shared/ui/scroll-view'
import { Badge } from '@/shared/ui/kit'
import { Text } from '@/shared/ui/text'

export function isCalculated(recipe: SavedRecipe) {
  return recipe.metrics.bc != null
}

export function RecipeMetrics({ recipe }: { recipe: SavedRecipe }) {
  if (!isCalculated(recipe)) return <Badge label="Черновик" />
  const summary = `БЦ ${formatNumber(recipe.metrics.bc)}% · КРАС ${formatNumber(recipe.metrics.kras)}% · V ${formatNumber(recipe.metrics.V, 4)} · G ${formatNumber(recipe.metrics.G, 4)}`
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityLabel={summary}
    >
      <Text size="sm" className="text-foreground">
        {summary}
      </Text>
    </ScrollView>
  )
}
