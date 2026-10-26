import { useState } from 'react'
import { Heading } from '@/shared/ui/heading'
import { Button, FormField, Input } from '@/shared/ui/kit'
import {
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalContent,
  ModalHeader,
} from '@/shared/ui/modal'
import { Text } from '@/shared/ui/text'
import { VStack } from '@/shared/ui/vstack'

export type EditDialog = {
  kind: 'create-group' | 'rename-group'
  id?: string
  name?: string
}
export function RecipeDialog({
  dialog,
  pending,
  error,
  onClose,
  onSubmit,
}: {
  dialog: EditDialog
  pending: boolean
  error?: string
  onClose: () => void
  onSubmit: (value: string) => void
}) {
  const [name, setName] = useState(dialog.name ?? '')
  const [validation, setValidation] = useState('')
  const title =
    dialog.kind === 'create-group' ? 'Создать группу' : 'Переименовать группу'
  return (
    <Modal
      avoidKeyboard
      isOpen
      onClose={() => {
        if (!pending) onClose()
      }}
      closeOnOverlayClick={!pending}
    >
      <ModalBackdrop />
      <ModalContent className="p-4">
        <ModalHeader>
          <Heading size="md" className="text-foreground">
            {title}
          </Heading>
        </ModalHeader>
        <ModalBody keyboardShouldPersistTaps="handled">
          <VStack space="lg">
            <FormField label="Название" isRequired>
              <Input
                accessibilityLabel="Название"
                value={name}
                onChangeText={setName}
                isDisabled={pending}
                maxLength={200}
              />
            </FormField>
            {validation || error ? (
              <Text accessibilityRole="alert" className="text-destructive-text">
                {validation || error}
              </Text>
            ) : null}
            <Button
              label="Сохранить"
              isLoading={pending}
              onPress={() => {
                if (!name.trim()) {
                  setValidation('Укажите название.')
                  return
                }
                onSubmit(name.trim())
              }}
            />
            <Button
              label="Отмена"
              variant="outline"
              isDisabled={pending}
              onPress={onClose}
            />
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
