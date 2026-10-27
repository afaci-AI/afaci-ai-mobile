import { Tabs } from 'expo-router'
import { BottomTabBar, type BottomTabBarProps } from 'expo-router/js-tabs'
import { Bookmark, Calculator, Database, Home, User } from 'lucide-react-native'
import { useColorScheme } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { getNavigatorColors } from '@/shared/theme/navigator-colors'
import { Box } from '@/shared/ui/box'
import { FloatingTabButton } from '@/shared/ui/kit/floating-tab-button'

function renderFloatingTabBar(props: BottomTabBarProps) {
  return (
    <Box className="bg-background">
      <BottomTabBar {...props} />
    </Box>
  )
}

export default function TabsLayout() {
  const colors = getNavigatorColors(useColorScheme())
  const insets = useSafeAreaInsets()
  const sideMargin = 16

  return (
    <Tabs
      tabBar={renderFloatingTabBar}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primaryForeground,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarButton: (props) => <FloatingTabButton {...props} />,
        tabBarShowLabel: false,
        tabBarStyle: {
          // Native navigation accepts numeric styles, including safe-area gaps.
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderWidth: 1,
          borderTopWidth: 1,
          borderRadius: 32,
          marginTop: 8,
          marginLeft: sideMargin + insets.left,
          marginRight: sideMargin + insets.right,
          marginBottom: insets.bottom + 12,
          paddingTop: 4,
          paddingBottom: 4,
          paddingHorizontal: 4,
          height: 64,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Главная',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="database"
        options={{
          title: 'База',
          tabBarIcon: ({ color, size }) => (
            <Database color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="calculator/index"
        options={{
          title: 'Калькулятор',
          tabBarIcon: ({ color, size }) => (
            <Calculator color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="saved/index"
        options={{
          title: 'Рецептуры',
          tabBarIcon: ({ color, size }) => (
            <Bookmark color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: 'Профиль',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
      <Tabs.Screen name="about" options={{ href: null }} />
    </Tabs>
  )
}
