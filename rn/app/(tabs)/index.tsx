import { useRouter } from 'expo-router'
import {
  Bookmark,
  Calculator,
  Database,
  ShieldCheck,
  Sparkles,
} from 'lucide-react-native'

import { useSession } from '@/shared/session/store'
import { Box } from '@/shared/ui/box'
import { Heading } from '@/shared/ui/heading'
import { Icon } from '@/shared/ui/icon'
import { Badge, Button, Card, ScrollScreen } from '@/shared/ui/kit'
import { Text } from '@/shared/ui/text'

export default function HomeScreen() {
  const router = useRouter()
  const status = useSession((state) => state.status)

  return (
    <ScrollScreen>
      <Box className="gap-2 pt-4">
        <Badge label="AFACI" variant="outline" className="self-start" />
        <Heading size="2xl" className="text-foreground">
          Пищевая и биологическая ценность рецептур
        </Heading>
        <Text className="text-muted-foreground">
          Расчёт по методике Липатова, база продуктов и сохранённые рецептуры —
          в одном приложении.
        </Text>
      </Box>

      <Card>
        <Box className="flex-row items-center gap-3">
          <Box className="h-11 w-11 items-center justify-center rounded-lg bg-primary">
            <Icon as={Sparkles} className="text-primary-foreground" />
          </Box>
          <Box className="flex-1 gap-1">
            <Text bold className="text-card-foreground">
              Начните с калькулятора
            </Text>
            <Text size="sm" className="text-muted-foreground">
              Эталон, ингредиенты и стоимость одной рецептуры.
            </Text>
          </Box>
        </Box>

        {status === 'authenticated' ? (
          <Button
            label="Открыть калькулятор"
            icon={Calculator}
            onPress={() => router.push('/calculator')}
          />
        ) : (
          <Button label="Войти" onPress={() => router.push('/login')} />
        )}
      </Card>

      <Box className="gap-3">
        <Text size="sm" bold className="text-muted-foreground">
          РАЗДЕЛЫ
        </Text>

        <Card>
          <Box className="flex-row items-center gap-3">
            <Icon as={Database} className="text-foreground" />
            <Box className="flex-1">
              <Text className="text-card-foreground">База продуктов</Text>
              <Text size="sm" className="text-muted-foreground">
                Поиск, фильтры и карточки продуктов
              </Text>
            </Box>
            <Badge label="скоро" variant="secondary" />
          </Box>
        </Card>

        <Card>
          <Box className="flex-row items-center gap-3">
            <Icon as={Bookmark} className="text-foreground" />
            <Box className="flex-1">
              <Text className="text-card-foreground">
                Сохранённые рецептуры
              </Text>
              <Text size="sm" className="text-muted-foreground">
                Группы, ранжирование и повторное использование
              </Text>
            </Box>
            <Badge label="скоро" variant="secondary" />
          </Box>
        </Card>

        <Card>
          <Box className="flex-row items-center gap-3">
            <Icon as={ShieldCheck} className="text-foreground" />
            <Box className="flex-1">
              <Text className="text-card-foreground">
                Только расчёт на сервере
              </Text>
              <Text size="sm" className="text-muted-foreground">
                Формулы и единицы измерения — в backend, клиент не дублирует
              </Text>
            </Box>
          </Box>
        </Card>
      </Box>
    </ScrollScreen>
  )
}
