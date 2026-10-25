import type { BottomTabBarButtonProps } from 'expo-router/js-tabs'
import { useEffect } from 'react'
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

import { Box } from '@/shared/ui/box'
import { Pressable } from '@/shared/ui/pressable'

const AnimatedBox = Animated.createAnimatedComponent(Box)

/** Штатные события вкладки с локальным оформлением и подложкой иконки. */
export function FloatingTabButton({
  children,
  onPress,
  onLongPress,
  testID,
  'aria-selected': selected,
  'aria-label': accessibilityLabel,
  accessibilityLargeContentTitle,
}: BottomTabBarButtonProps) {
  const focused = selected === true
  const progress = useSharedValue(focused ? 1 : 0)

  useEffect(() => {
    progress.value = withTiming(focused ? 1 : 0, {
      duration: 200,
      easing: Easing.out(Easing.cubic),
      reduceMotion: ReduceMotion.System,
    })
  }, [focused, progress])

  const highlightStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.9 + progress.value * 0.1 }],
  }))

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={accessibilityLabel ?? accessibilityLargeContentTitle}
      testID={testID}
      onPress={onPress}
      onLongPress={onLongPress}
      className="min-h-12 min-w-12 flex-1 items-center justify-center rounded-2xl py-1 data-[active=true]:bg-muted/50"
    >
      {/* Animated values require style; all surface colors stay semantic. */}
      <AnimatedBox
        pointerEvents="none"
        accessible={false}
        className="absolute h-8 w-12 rounded-full bg-primary"
        style={highlightStyle}
      />
      {children}
    </Pressable>
  )
}
