import { useRouter } from 'expo-router'
import { Rocket } from 'lucide-react-native'

import { Box } from '@/shared/ui/box'
import { Heading } from '@/shared/ui/heading'
import { Icon } from '@/shared/ui/icon'
import { Button, Header, Screen } from '@/shared/ui/kit'
import { Text } from '@/shared/ui/text'
import { VStack } from '@/shared/ui/vstack'
import { FontSize } from '@/shared/theme/font-sizes'

export default function AboutScreen() {
  const router = useRouter()
  const goBack = () => {
    if (router.canGoBack()) router.back()
    else router.replace('/')
  }

  return (
    <Screen edges={['top']}>
      <Header title="О нас" onBack={goBack} />
      <VStack space="lg" className="flex-1 items-center justify-center p-6">
        <Box className="h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Icon as={Rocket} size="xl" className="text-primary" />
        </Box>
        <Heading size={FontSize.xl} className="text-center text-foreground">
          В будущих релизах
        </Heading>
        <Text className="text-center text-muted-foreground">
          Информация о проекте AFACI появится здесь позже.
        </Text>
        <Button
          label="На главную"
          variant="outline"
          className="min-h-12"
          onPress={() => router.replace('/')}
        />
      </VStack>
    </Screen>
  )
}
