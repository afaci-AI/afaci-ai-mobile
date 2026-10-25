'use client'
import React from 'react'
import { Switch as RNSwitch, useColorScheme } from 'react-native'
import { getNavigatorColors } from '@/shared/theme/navigator-colors'
import { createSwitch } from '@gluestack-ui/core/switch/creator'
import { tva, withStyleContext } from '@gluestack-ui/utils/nativewind-utils'
import type { VariantProps } from '@gluestack-ui/utils/nativewind-utils'

const UISwitch = createSwitch({
  Root: withStyleContext(RNSwitch),
})

const switchStyle = tva({
  base: 'data-[focus=true]:outline-0 data-[focus=true]:ring-2 data-[focus=true]:ring-ring web:cursor-pointer disabled:cursor-not-allowed data-[disabled=true]:bg-muted/50 data-[invalid=true]:border-destructive data-[invalid=true]:rounded-xl data-[invalid=true]:border-2',

  variants: {
    size: {
      sm: 'scale-75',
      md: '',
      lg: 'scale-125',
    },
  },
})

type ISwitchProps = React.ComponentProps<typeof UISwitch> &
  VariantProps<typeof switchStyle>
const Switch = React.forwardRef<
  React.ComponentRef<typeof UISwitch>,
  ISwitchProps
>(function Switch({ className, size = 'md', ...props }, ref) {
  const colors = getNavigatorColors(useColorScheme())
  return (
    <UISwitch
      ref={ref}
      // Native Switch accepts literal colors; resolve the shared semantic palette.
      trackColor={{ false: colors.muted, true: colors.primary }}
      thumbColor={props.value ? colors.primaryForeground : colors.foreground}
      {...props}
      className={switchStyle({ size, class: className })}
    />
  )
})

Switch.displayName = 'Switch'
export { Switch }
