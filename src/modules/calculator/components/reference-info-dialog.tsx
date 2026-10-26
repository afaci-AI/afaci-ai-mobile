import { X } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { formatNumber } from '@/shared/lib/format'
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
import { aminoAcidName } from '../amino-acid-names'
import type { ReferenceProtein } from '../types'

interface ReferenceInfoDialogProps {
  open: boolean
  reference: ReferenceProtein | undefined
  onClose: () => void
}

export function ReferenceInfoDialog({
  open,
  reference,
  onClose,
}: ReferenceInfoDialogProps) {
  const insets = useSafeAreaInsets()
  return (
    <Modal
      isOpen={open && !!reference}
      onClose={onClose}
      size="lg"
      avoidKeyboard
      // Safe-area measurements come from the current native window.
      style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }}
    >
      <ModalBackdrop />
      <ModalContent className="max-h-full shrink p-4" accessibilityViewIsModal>
        <ModalHeader className="items-start">
          <Box className="min-w-0 flex-1">
            <Heading size="md" className="text-foreground">
              {reference?.name}
            </Heading>
          </Box>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Закрыть информацию об эталоне"
            onPress={onClose}
            className="h-12 w-12 shrink-0 items-center justify-center rounded-md data-[active=true]:bg-muted"
          >
            <Icon as={X} size="lg" className="text-foreground" />
          </Pressable>
        </ModalHeader>
        <ModalBody
          scrollEnabled
          className="shrink"
          keyboardShouldPersistTaps="handled"
        >
          <VStack space="lg" className="py-3">
            {reference?.description ? (
              <Text className="text-foreground">{reference.description}</Text>
            ) : null}
            <Text size="sm" className="text-muted-foreground">
              Аминокислоты, г/100 г белка
            </Text>
            {reference?.values.map((value, index) => (
              <Box
                key={`${aminoAcidName(value.amino_acid)}-${index}`}
                className="gap-1 border-b border-border pb-3"
              >
                <Text size="sm" className="text-foreground">
                  {aminoAcidName(value.amino_acid)}
                </Text>
                <Text size="sm" className="text-muted-foreground">
                  {formatNumber(value.value)}
                </Text>
              </Box>
            ))}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button label="Закрыть" variant="outline" onPress={onClose} />
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
