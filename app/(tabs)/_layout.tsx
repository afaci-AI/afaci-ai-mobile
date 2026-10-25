import { Tabs } from 'expo-router'
import { Bookmark, Calculator, Database, Home, User } from 'lucide-react-native'
import { useColorScheme, useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { getNavigatorColors } from '@/shared/theme/navigator-colors'
import { Text } from '@/shared/ui/text'

export default function TabsLayout() {
  const colors = getNavigatorColors(useColorScheme())
  const { fontScale } = useWindowDimensions()
  const insets = useSafeAreaInsets()

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.foreground,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarLabel: ({ children, focused }) => (
          <Text
            size="xs"
            numberOfLines={2}
            className={
              focused
                ? 'w-full px-1 text-center text-foreground'
                : 'w-full px-1 text-center text-muted-foreground'
            }
          >
            {children}
          </Text>
        ),
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          // Native navigation needs numeric height; reserve two scaled lines.
          height: 36 + 32 * fontScale + insets.bottom,
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
