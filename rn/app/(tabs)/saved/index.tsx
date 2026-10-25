import { Bookmark } from 'lucide-react-native'

import { useSession } from '@/shared/session/store'

import { EmptyState, Header, Screen } from '@/shared/ui/kit'

export default function SavedScreen() {
  const status = useSession((state) => state.status)
  if (status !== 'authenticated') return null

  return (
    <Screen>
      <Header
        title="Рецептуры"
        subtitle="Сохранённые рецептуры и ранжирование"
      />
      <EmptyState
        icon={Bookmark}
        title="Раздел в разработке"
        description="Группы, перемещение рецептур и ранжирование появятся после калькулятора."
      />
    </Screen>
  )
}
