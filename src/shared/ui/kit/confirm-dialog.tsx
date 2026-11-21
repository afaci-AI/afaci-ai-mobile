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

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  isDestructive?: boolean
  isLoading?: boolean
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Подтвердить',
  cancelLabel = 'Отмена',
  isDestructive = false,
  isLoading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} closeOnOverlayClick={!isLoading}>
      <ModalBackdrop />
      <ModalContent>
        <ModalHeader>
          <Heading size={FontSize.md} className="text-foreground">
            {title}
          </Heading>
        </ModalHeader>

        {description ? (
          <ModalBody>
            <Text size={FontSize.sm} className="text-muted-foreground">
              {description}
            </Text>
          </ModalBody>
        ) : null}

        <ModalFooter>
          <Box className="flex-row justify-end gap-2">
            <Button
              label={cancelLabel}
              variant="outline"
              size="sm"
              isDisabled={isLoading}
              onPress={onClose}
            />
            <Button
              label={confirmLabel}
              variant={isDestructive ? 'destructive' : 'default'}
              size="sm"
              isLoading={isLoading}
              onPress={onConfirm}
            />
          </Box>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
