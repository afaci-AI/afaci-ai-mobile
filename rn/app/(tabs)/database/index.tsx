import { Database } from 'lucide-react-native'

import { EmptyState, Header, Screen } from '@/shared/ui/kit'

export default function DatabaseScreen() {
  return (
    <Screen>
      <Header title="База продуктов" subtitle="Поиск и карточки продуктов" />
      <EmptyState
        icon={Database}
        title="Раздел в разработке"
        description="Поиск, фильтры и карточки продуктов появятся на этапе публичной части."
      />
    </Screen>
  )
}
