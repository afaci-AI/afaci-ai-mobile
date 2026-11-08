import { X } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Box } from '@/shared/ui/box'
import { Heading } from '@/shared/ui/heading'
import { Icon } from '@/shared/ui/icon'
import { Button } from '@/shared/ui/kit'
import {
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from '@/shared/ui/modal'
import { Pressable } from '@/shared/ui/pressable'
import { Text } from '@/shared/ui/text'
import { VStack } from '@/shared/ui/vstack'
import { FontSize } from '@/shared/theme/font-sizes'

import type { DailyNorms } from '../types'
import { SourceCard } from './source-card'

/** На какие документы опираются нормы и почему норма одна, усреднённая. */
export function NormsInfoDialog({
  open,
  data,
  onClose,
}: {
  open: boolean
  data: DailyNorms
  onClose: () => void
}) {
  const insets = useSafeAreaInsets()
  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      size="lg"
      style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }}
    >
      <ModalBackdrop />
      <ModalContent className="max-h-full shrink p-4" accessibilityViewIsModal>
        <ModalHeader className="items-start">
          <Box className="min-w-0 flex-1">
            <Heading size={FontSize.md} className="text-foreground">
              {data.info.title}
            </Heading>
          </Box>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Закрыть информацию о суточных нормах"
            onPress={onClose}
            className="h-12 w-12 shrink-0 items-center justify-center rounded-md data-[active=true]:bg-muted"
          >
            <Icon as={X} size="lg" className="text-foreground" />
          </Pressable>
        </ModalHeader>
        <ModalBody scrollEnabled className="shrink">
          <VStack space="lg" className="py-3">
            {data.info.paragraphs.map((paragraph, index) => (
              <Text key={index} className="text-foreground">
                {paragraph}
              </Text>
            ))}
            <VStack space="sm">
              <Heading size={FontSize.sm} className="text-foreground">
                Как получена каждая норма
              </Heading>
              {data.norms.map((row) => (
                <Text
                  key={row.key}
                  size={FontSize.sm}
                  className="text-foreground"
                >
                  {row.name}
                  {row.basis ? (
                    <Text size={FontSize.sm} className="text-muted-foreground">
                      {' '}
                      — {row.basis}
                    </Text>
                  ) : null}
                </Text>
              ))}
            </VStack>
            {data.sources.length ? (
              <VStack space="sm">
                <Heading size={FontSize.sm} className="text-foreground">
                  Источники
                </Heading>
                {data.sources.map((source) => (
                  <SourceCard key={source.id} source={source} />
                ))}
              </VStack>
            ) : null}
            <Text size={FontSize.sm} className="text-muted-foreground">
              {data.info.disclaimer}
            </Text>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button label="Закрыть" variant="outline" onPress={onClose} />
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
