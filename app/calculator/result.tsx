import { useRouter } from 'expo-router'
import { CalculatorResults } from '@/modules/calculator/components/calculator-results'
import {
  metricDifferences,
  useCalculatorReport,
} from '@/modules/calculator/report-store'
import { useSession } from '@/shared/session/store'
import { Text } from '@/shared/ui/text'
import { Button, EmptyState, Header, ScrollScreen } from '@/shared/ui/kit'
import { Calculator } from 'lucide-react-native'

export default function CalculatorResultScreen() {
  const router = useRouter()
  const user = useSession((s) => s.user)
  const status = useSession((s) => s.status)
  const { ownerId, result, compare } = useCalculatorReport()
  const differences =
    ownerId === user?.id && result && compare
      ? metricDifferences(result, compare.metrics)
      : []
  const back = () => {
    if (router.canGoBack()) router.back()
    else router.replace('/calculator')
  }
  if (status !== 'authenticated') return null
  return (
    <ScrollScreen>
      <Header title="Результат расчёта" onBack={back} />
      {ownerId === user?.id &&
      result &&
      Math.abs(result.sum_g - 100) >= 1e-8 ? (
        <Text className="text-destructive-text">
          Сервер округлил массы. Перед повторным расчётом и сохранением готовой
          рецептуры скорректируйте сумму до 100 г.
        </Text>
      ) : null}
      {differences.length ? (
        <Text className="text-foreground">
          Значения пересчитаны по текущим данным продуктов и отличаются от
          сохранённых в рецептуре «{compare?.name}»: {differences.join(', ')}.
          Сохранённые показатели не изменены.
        </Text>
      ) : null}
      {ownerId === user?.id && result ? (
        <CalculatorResults result={result} />
      ) : (
        <EmptyState
          icon={Calculator}
          title="Нет актуального расчёта"
          description="Составьте рецептуру и выполните расчёт в калькуляторе."
        />
      )}
      <Button label="Вернуться к рецептуре" variant="outline" onPress={back} />
    </ScrollScreen>
  )
}
