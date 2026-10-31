import { useRouter } from 'expo-router'
import {
  ArrowRight,
  Bookmark,
  Calculator,
  Database,
  FlaskConical,
  Leaf,
  MapPin,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react-native'
import type { LucideIcon } from 'lucide-react-native'

import { useSession } from '@/shared/session/store'
import { Box } from '@/shared/ui/box'
import { Heading } from '@/shared/ui/heading'
import { HStack } from '@/shared/ui/hstack'
import { Icon } from '@/shared/ui/icon'
import { Badge, Button, Card, ScrollScreen } from '@/shared/ui/kit'
import { Pressable } from '@/shared/ui/pressable'
import { Text } from '@/shared/ui/text'
import { VStack } from '@/shared/ui/vstack'
import { FontSize } from '@/shared/theme/font-sizes'

const tools = [
  {
    icon: Calculator,
    title: 'Калькулятор ценности',
    description:
      'Пищевая и биологическая ценность рецептуры по методике Липатова: макросостав, аминокислотный скор, БЦ, КРАС, V и G.',
    href: '/calculator',
    action: 'Открыть калькулятор',
  },
  {
    icon: Bookmark,
    title: 'Сохранённые рецептуры',
    description:
      'Сохраняйте рецептуры с названием, объединяйте в группы и возвращайтесь к ним для редактирования.',
    href: '/saved',
    action: 'Мои рецептуры',
  },
  {
    icon: Sparkles,
    title: 'Ранжирование рецептур',
    description:
      'Сравните сохранённые рецептуры по БЦ, КРАС, V и G. Ранжирование находится в разделе «Рецептуры».',
    href: '/saved',
    action: 'Перейти к рецептурам',
  },
] as const

const features = [
  {
    icon: Database,
    title: 'База продуктов',
    description:
      'Химический, аминокислотный и минеральный состав продуктов питания.',
  },
  {
    icon: Calculator,
    title: 'Расчёт рецептуры',
    description:
      'Составляйте рецептуры из выбранных ингредиентов и оценивайте их пищевую ценность.',
  },
  {
    icon: MapPin,
    title: 'Данные по регионам',
    description:
      'Изучайте состав продуктов с учётом региональных особенностей Кыргызстана.',
  },
  {
    icon: FlaskConical,
    title: 'Нутриентный профиль',
    description:
      'Белки, жиры, углеводы, витамины, макро- и микроэлементы в карточке продукта.',
  },
] as const

interface FeatureProps {
  readonly icon: LucideIcon
  readonly title: string
  readonly description: string
}

function Feature({ icon, title, description }: FeatureProps) {
  return (
    <HStack space="md" className="items-start">
      <Box className="h-12 w-12 items-center justify-center rounded-xl bg-muted">
        <Icon as={icon} className="text-foreground" />
      </Box>
      <VStack space="xs" className="flex-1">
        <Text bold className="text-foreground">
          {title}
        </Text>
        <Text size={FontSize.sm} className="text-muted-foreground">
          {description}
        </Text>
      </VStack>
    </HStack>
  )
}

export function HomeScreen() {
  const router = useRouter()
  const isGuest = useSession((state) => state.status !== 'authenticated')

  return (
    <ScrollScreen contentClassName="gap-8">
      <VStack space="lg" className="rounded-2xl bg-accent/40 p-5">
        <HStack space="sm" className="items-center">
          <Icon as={Leaf} className="text-primary" />
          <Text size={FontSize.sm} className="flex-1 text-muted-foreground">
            AFACI · Продукты Кыргызстана
          </Text>
        </HStack>
        <Heading size={FontSize.xxl} className="text-foreground">
          База данных продуктов питания
        </Heading>
        <Text className="text-muted-foreground">
          Изучайте химический, аминокислотный и минеральный состав продуктов.
          Рассчитывайте пищевую и биологическую ценность рецептур.
        </Text>
        <VStack space="sm">
          <Button
            label="База данных продуктов питания"
            icon={Database}
            className="min-h-12"
            onPress={() => router.push('/database')}
          />
          <Button
            label="Калькулятор"
            icon={Calculator}
            variant="outline"
            className="min-h-12"
            onPress={() => router.push('/calculator')}
          />
        </VStack>
      </VStack>

      <VStack space="lg">
        <VStack space="xs">
          <Heading size={FontSize.xl} className="text-foreground">
            Инструменты
          </Heading>
          <Text size={FontSize.sm} className="text-muted-foreground">
            {isGuest
              ? 'Для расчётов и работы с рецептурами войдите в аккаунт.'
              : 'Рассчитывайте, сохраняйте и сравнивайте рецептуры.'}
          </Text>
        </VStack>
        {tools.map((tool) => (
          <Pressable
            key={tool.title}
            accessibilityRole="button"
            accessibilityLabel={`${tool.title}${isGuest ? '. Требуется вход' : ''}`}
            onPress={() => router.push(tool.href)}
            className="rounded-xl data-[active=true]:bg-accent"
          >
            <Card>
              <HStack space="md" className="items-start">
                <Box className="h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Icon as={tool.icon} className="text-primary" />
                </Box>
                <VStack space="sm" className="flex-1">
                  <Heading size={FontSize.md} className="text-card-foreground">
                    {tool.title}
                  </Heading>
                  {isGuest ? (
                    <Badge
                      label="Требуется вход"
                      variant="outline"
                      className="self-start"
                    />
                  ) : null}
                </VStack>
              </HStack>
              <Text size={FontSize.sm} className="text-muted-foreground">
                {tool.description}
              </Text>
              <HStack space="sm" className="items-center">
                <Text bold size={FontSize.sm} className="flex-1 text-primary">
                  {tool.action}
                </Text>
                <Icon as={ArrowRight} size="sm" className="text-primary" />
              </HStack>
            </Card>
          </Pressable>
        ))}
      </VStack>

      <VStack space="lg">
        <Heading size={FontSize.xl} className="text-foreground">
          Возможности
        </Heading>
        {features.map((feature) => (
          <Feature key={feature.title} {...feature} />
        ))}
      </VStack>

      <VStack space="lg">
        <Heading size={FontSize.xl} className="text-foreground">
          Оптимизация рецептур
        </Heading>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Оптимизация рецептур${isGuest ? '. Требуется вход' : ''}`}
          onPress={() => router.push('/calculator')}
          className="rounded-xl data-[active=true]:bg-accent"
        >
          <Card>
            <HStack space="md" className="items-start">
              <Box className="h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Icon as={SlidersHorizontal} className="text-primary" />
              </Box>
              <VStack space="sm" className="flex-1">
                <Heading size={FontSize.md} className="text-card-foreground">
                  Улучшайте рецептуру без потери качества
                </Heading>
                {isGuest ? (
                  <Badge
                    label="Требуется вход"
                    variant="outline"
                    className="self-start"
                  />
                ) : null}
              </VStack>
            </HStack>
            <Text size={FontSize.sm} className="text-muted-foreground">
              Базовая оптимизация повышает биологическую ценность, а оптимизация
              по цене снижает стоимость. В обоих режимах БЦ и V не уменьшаются,
              а G не растёт. Расчёт выполняется на сервере.
            </Text>
            <HStack space="sm" className="items-center">
              <Text bold size={FontSize.sm} className="flex-1 text-primary">
                Оптимизировать рецептуру
              </Text>
              <Icon as={ArrowRight} size="sm" className="text-primary" />
            </HStack>
          </Card>
        </Pressable>
      </VStack>
    </ScrollScreen>
  )
}
