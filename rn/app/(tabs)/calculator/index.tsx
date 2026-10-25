import { Calculator } from 'lucide-react-native'

import { useSession } from '@/shared/session/store'

import { EmptyState, Header, Screen } from '@/shared/ui/kit'

export default function CalculatorScreen() {
  const status = useSession((state) => state.status)
  if (status !== 'authenticated') return null

  return (
    <Screen>
      <Header title="Калькулятор" subtitle="Расчёт по методике Липатова" />
      <EmptyState
        icon={Calculator}
        title="Раздел в разработке"
        description="Эталон, ингредиенты, стоимость и результаты расчёта появятся на этапе калькулятора."
      />
    </Screen>
  )
}
