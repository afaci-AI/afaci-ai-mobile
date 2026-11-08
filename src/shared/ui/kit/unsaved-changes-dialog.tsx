import { Box } from '@/shared/ui/box'
import { Heading } from '@/shared/ui/heading'
import {
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from '@/shared/ui/modal'
import { Text } from '@/shared/ui/text'

import { Button } from './button'
import { FontSize } from '@/shared/theme/font-sizes'

interface Props {
  isOpen: boolean
  isLoading?: boolean
  onSave: () => void
  onDiscard: () => void
  onStay: () => void
}

/** Выбор при уходе с экрана, где есть несохранённые изменения. */
export function UnsavedChangesDialog({
  isOpen,
  isLoading = false,
  onSave,
  onDiscard,
  onStay,
}: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onStay} closeOnOverlayClick={!isLoading}>
      <ModalBackdrop />
      <ModalContent>
        <ModalHeader>
          <Heading size={FontSize.md} className="text-foreground">
            Сохранить изменения?
          </Heading>
        </ModalHeader>
        <ModalBody>
          <Text size={FontSize.sm} className="text-muted-foreground">
            В рецептуре есть несохранённые изменения.
          </Text>
        </ModalBody>
        <ModalFooter>
          <Box className="w-full gap-2">
            <Button label="Сохранить" isLoading={isLoading} onPress={onSave} />
            <Button
              label="Не сохранять"
              variant="outline"
              isDisabled={isLoading}
              onPress={onDiscard}
            />
            <Button
              label="Остаться"
              variant="outline"
              isDisabled={isLoading}
              onPress={onStay}
            />
          </Box>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
