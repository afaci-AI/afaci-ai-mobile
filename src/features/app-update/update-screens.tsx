import { Download } from 'lucide-react-native'

import { FontSize } from '@/shared/theme/font-sizes'
import { Box } from '@/shared/ui/box'
import { Heading } from '@/shared/ui/heading'
import { Icon } from '@/shared/ui/icon'
import { Button, ScrollScreen } from '@/shared/ui/kit'
import {
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from '@/shared/ui/modal'
import { Text } from '@/shared/ui/text'

import type { AppVersionInfo } from './api'
import { formatChangelog } from './update-policy'

const INSTALL_HINT =
  'APK скачается в браузере. Если браузер предупредит о файле, выберите «Скачать». Затем откройте APK и разрешите установку из этого источника, если Android попросит.'

function Changelog({ info }: { info: AppVersionInfo }) {
  const text = formatChangelog(info.changelog)
  if (!text) return null
  return (
    <Box className="gap-1">
      <Text size={FontSize.sm} className="font-medium text-foreground">
        Что нового
      </Text>
      <Text size={FontSize.sm} className="text-muted-foreground">
        {text}
      </Text>
    </Box>
  )
}

interface UpdateProps {
  info: AppVersionInfo
  error: string | null
  onDownload: () => void
}

/** Обязательное обновление: экран без возможности продолжить работу. */
export function RequiredUpdateScreen({ info, error, onDownload }: UpdateProps) {
  return (
    <ScrollScreen
      edges={['top', 'bottom']}
      contentClassName="flex-1 justify-center gap-6 px-6"
    >
      <Box className="items-center gap-3">
        <Icon as={Download} size="xl" className="text-primary" />
        <Heading size={FontSize.xl} className="text-center text-foreground">
          Нужно обновить приложение
        </Heading>
        <Text className="text-center text-muted-foreground">
          {`Версия ${info.version} обязательна: текущая больше не поддерживается сервером.`}
        </Text>
      </Box>
      <Changelog info={info} />
      <Box className="gap-2">
        <Button
          label="Скачать обновление"
          icon={Download}
          onPress={onDownload}
        />
        <Text size={FontSize.xs} className="text-center text-muted-foreground">
          {INSTALL_HINT}
        </Text>
        {error ? (
          <Text size={FontSize.sm} className="text-center text-destructive">
            {error}
          </Text>
        ) : null}
      </Box>
    </ScrollScreen>
  )
}

interface OptionalUpdateProps extends UpdateProps {
  isOpen: boolean
  onClose: () => void
}

/** Необязательное обновление: окно, которое можно отложить. */
export function OptionalUpdateDialog({
  info,
  error,
  isOpen,
  onDownload,
  onClose,
}: OptionalUpdateProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalBackdrop />
      <ModalContent>
        <ModalHeader>
          <Heading size={FontSize.md} className="text-foreground">
            {`Доступна версия ${info.version}`}
          </Heading>
        </ModalHeader>
        <ModalBody>
          <Box className="gap-3">
            <Changelog info={info} />
            <Text size={FontSize.xs} className="text-muted-foreground">
              {INSTALL_HINT}
            </Text>
            {error ? (
              <Text size={FontSize.sm} className="text-destructive">
                {error}
              </Text>
            ) : null}
          </Box>
        </ModalBody>
        <ModalFooter>
          <Box className="flex-row justify-end gap-2">
            <Button
              label="Позже"
              variant="outline"
              size="sm"
              onPress={onClose}
            />
            <Button label="Обновить" size="sm" onPress={onDownload} />
          </Box>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
