import { useState } from 'react'

import { Box } from '@/shared/ui/box'
import { Heading } from '@/shared/ui/heading'
import {
  Button,
  FormField,
  Input,
  LoadingView,
  Select,
  SwitchRow,
} from '@/shared/ui/kit'
import {
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalContent,
  ModalHeader,
} from '@/shared/ui/modal'
import { Text } from '@/shared/ui/text'
import { VStack } from '@/shared/ui/vstack'

import type { SavedGroup } from '../types'
import { FontSize } from '@/shared/theme/font-sizes'

export interface SaveRecipeValues {
  name: string
  group_id: string | null
  new_group_name?: string
  draft: boolean
  asNew: boolean
}
interface Props {
  open: boolean
  onClose: () => void
  groups: SavedGroup[]
  groupsLoading?: boolean
  groupsError?: string
  onRetryGroups?: () => void
  editing?: { id: string; name: string; group_id: string | null } | null
  canSaveCalculated: boolean
  pending: boolean
  error?: string
  onSave: (value: SaveRecipeValues) => void
}

export function SaveRecipeDialog(props: Props) {
  // Mount form only while open: each opening starts with the current recipe.
  return (
    <Modal
      avoidKeyboard
      isOpen={props.open}
      onClose={() => {
        if (!props.pending) props.onClose()
      }}
      size="lg"
      closeOnOverlayClick={!props.pending}
    >
      <ModalBackdrop />
      <ModalContent className="max-h-5/6 p-4">
        <ModalHeader>
          <Heading size={FontSize.md} className="text-foreground">
            {props.editing ? 'Обновить рецептуру' : 'Сохранить рецептуру'}
          </Heading>
        </ModalHeader>
        {props.open ? <SaveForm {...props} /> : null}
      </ModalContent>
    </Modal>
  )
}

function SaveForm({
  onClose,
  groups,
  groupsLoading,
  groupsError,
  onRetryGroups,
  editing,
  canSaveCalculated,
  pending,
  error,
  onSave,
}: Props) {
  const [name, setName] = useState(editing?.name ?? '')
  const [choice, setChoice] = useState(editing?.group_id ?? '__none__')
  const [newGroup, setNewGroup] = useState('')
  const [draft, setDraft] = useState(!canSaveCalculated)
  const [validation, setValidation] = useState('')
  const submit = (asNew: boolean) => {
    if (!name.trim()) {
      setValidation('Укажите название рецептуры.')
      return
    }
    if (choice === '__new__' && !newGroup.trim()) {
      setValidation('Укажите название новой группы.')
      return
    }
    setValidation('')
    onSave({
      name: name.trim(),
      group_id: choice === '__none__' || choice === '__new__' ? null : choice,
      ...(choice === '__new__' ? { new_group_name: newGroup.trim() } : {}),
      draft: !canSaveCalculated || draft,
      asNew,
    })
  }
  return (
    <ModalBody keyboardShouldPersistTaps="handled">
      <VStack space="lg">
        {!canSaveCalculated ? (
          <Text className="text-muted-foreground">
            Без полного состава с суммой ровно 100 г можно сохранить только
            черновик. Показатели качества появятся после расчёта.
          </Text>
        ) : null}
        <FormField label="Название" isRequired>
          <Input
            accessibilityLabel="Название рецептуры"
            value={name}
            onChangeText={setName}
            isDisabled={pending}
          />
        </FormField>
        <FormField label="Группа">
          <Select
            value={choice}
            onChange={setChoice}
            isDisabled={pending || groupsLoading}
            options={[
              { value: '__none__', label: 'Без группы' },
              ...groups.map((group) => ({
                value: group.id,
                label: group.name,
              })),
              { value: '__new__', label: 'Новая группа…' },
            ]}
          />
        </FormField>
        {groupsLoading ? <LoadingView fullscreen={false} /> : null}
        {groupsError ? (
          <Box className="gap-2">
            <Text className="text-destructive-text">{groupsError}</Text>
            {onRetryGroups ? (
              <Button
                label="Повторить загрузку групп"
                variant="outline"
                onPress={onRetryGroups}
              />
            ) : null}
          </Box>
        ) : null}
        {choice === '__new__' ? (
          <FormField label="Название новой группы" isRequired>
            <Input
              accessibilityLabel="Название новой группы"
              value={newGroup}
              onChangeText={setNewGroup}
              isDisabled={pending}
            />
          </FormField>
        ) : null}
        <SwitchRow
          label="Сохранить как черновик"
          description="Без показателей качества; можно доработать позже."
          value={!canSaveCalculated || draft}
          onValueChange={setDraft}
          isDisabled={!canSaveCalculated || pending}
        />
        {validation || error ? (
          <Text accessibilityRole="alert" className="text-destructive-text">
            {validation || error}
          </Text>
        ) : null}
        <Button
          label={
            !canSaveCalculated || draft
              ? 'Сохранить черновик'
              : editing
                ? 'Обновить'
                : 'Сохранить'
          }
          isLoading={pending}
          onPress={() => submit(false)}
        />
        {editing ? (
          <Button
            label="Сохранить как новую"
            variant="secondary"
            isDisabled={pending}
            onPress={() => submit(true)}
          />
        ) : null}
        <Button
          label="Отмена"
          variant="outline"
          isDisabled={pending}
          onPress={onClose}
        />
      </VStack>
    </ModalBody>
  )
}
