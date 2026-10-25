import { useRouter } from 'expo-router'
import { Boxes, Tags, Users } from 'lucide-react-native'

import { useSession } from '@/shared/session/store'
import { Box } from '@/shared/ui/box'
import { Icon } from '@/shared/ui/icon'
import { Badge, Card, Header, ScrollScreen } from '@/shared/ui/kit'
import { Text } from '@/shared/ui/text'

const SECTIONS = [
  {
    title: 'Продукты',
    description: 'Справочник продуктов и нутриентов',
    icon: Boxes,
  },
  {
    title: 'Словари',
    description: 'Категории, регионы, единицы, нутриенты',
    icon: Tags,
  },
  {
    title: 'Пользователи',
    description: 'Доступы и сроки действия',
    icon: Users,
  },
] as const

export default function AdminDashboardScreen() {
  const router = useRouter()
  const goBack = () => {
    if (router.canGoBack()) router.back()
    else router.replace('/profile')
  }
  const user = useSession((state) => state.user)

  return (
    <ScrollScreen>
      <Header
        title="Админка"
        subtitle={user ? `${user.name} · ${user.email}` : undefined}
        onBack={goBack}
        className="-mx-4 -mt-4 mb-2"
      />

      <Box className="gap-3">
        {SECTIONS.map((section) => (
          <Card key={section.title}>
            <Box className="flex-row items-center gap-3">
              <Icon as={section.icon} className="text-foreground" />
              <Box className="flex-1">
                <Text className="text-card-foreground">{section.title}</Text>
                <Text size="sm" className="text-muted-foreground">
                  {section.description}
                </Text>
              </Box>
              <Badge label="скоро" variant="secondary" />
            </Box>
          </Card>
        ))}
      </Box>

      <Text size="sm" className="text-muted-foreground">
        Разделы админки появятся на этапах 5 и 6 плана.
      </Text>
    </ScrollScreen>
  )
}
