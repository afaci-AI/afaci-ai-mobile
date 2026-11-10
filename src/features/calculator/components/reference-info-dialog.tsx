import { X } from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'
import { Linking } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { formatNumber } from '@/shared/lib/format'
import { API_BASE_URL } from '@/shared/api/client'
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
import { FontSize } from '@/shared/theme/font-sizes'

interface ReferenceInfoDialogProps {
  open: boolean
  reference: ReferenceProtein | undefined
  onClose: () => void
}

export function ReferenceInfoDialog(props: ReferenceInfoDialogProps) {
  return (
    <ReferenceInfoDialogContent
      key={`${props.open}:${props.reference?.id}:${props.reference?.source?.pdf_url}:${props.reference?.source?.url}`}
      {...props}
    />
  )
}

function ReferenceInfoDialogContent({
  open,
  reference,
  onClose,
}: ReferenceInfoDialogProps) {
  const insets = useSafeAreaInsets()
  const [documentError, setDocumentError] = useState<string | null>(null)
  const [openingDocument, setOpeningDocument] = useState(false)
  const documentAttempt = useRef(0)
  const source = reference?.source
  const documentUrl = source?.pdf_url?.trim() || source?.url?.trim()

  useEffect(() => {
    return () => {
      documentAttempt.current += 1
    }
  }, [])

  const openDocument = async () => {
    if (!documentUrl || openingDocument) return
    const attempt = ++documentAttempt.current
    setDocumentError(null)
    setOpeningDocument(true)
    try {
      const url = new URL(documentUrl, `${API_BASE_URL}/`)
      if (url.protocol !== 'https:' && url.protocol !== 'http:') {
        throw new Error('Unsupported document URL')
      }
      if (!(await Linking.canOpenURL(url.href))) {
        throw new Error('No application can open the document')
      }
      if (attempt !== documentAttempt.current) return
      await Linking.openURL(url.href)
    } catch {
      if (attempt === documentAttempt.current) {
        setDocumentError(
          'Не удалось открыть документ. Проверьте подключение к интернету и наличие браузера или приложения для PDF, затем повторите попытку.',
        )
      }
    } finally {
      if (attempt === documentAttempt.current) setOpeningDocument(false)
    }
  }

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
            <Heading size={FontSize.md} className="text-foreground">
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
            <VStack space="sm">
              <Heading size={FontSize.sm} className="text-foreground">
                Источник
              </Heading>
              {source ? (
                <>
                  <Text className="text-foreground">{source.title}</Text>
                  {source.authors ? (
                    <Text size={FontSize.sm} className="text-muted-foreground">
                      {source.authors}
                    </Text>
                  ) : null}
                  {source.year != null ? (
                    <Text size={FontSize.sm} className="text-muted-foreground">
                      Год: {source.year}
                    </Text>
                  ) : null}
                  {source.location ? (
                    <Text size={FontSize.sm} className="text-muted-foreground">
                      {source.location}
                    </Text>
                  ) : null}
                  {documentUrl ? (
                    <>
                      <Button
                        label="Открыть документ"
                        variant="outline"
                        isLoading={openingDocument}
                        onPress={() => void openDocument()}
                      />
                      <Text
                        size={FontSize.sm}
                        className="text-muted-foreground"
                      >
                        Документ откроется во внешнем приложении. Для загрузки
                        требуется интернет; ошибки загрузки показывает браузер
                        или приложение для PDF.
                      </Text>
                    </>
                  ) : (
                    <Text size={FontSize.sm} className="text-muted-foreground">
                      Ссылка на документ не указана.
                    </Text>
                  )}
                </>
              ) : (
                <Text size={FontSize.sm} className="text-muted-foreground">
                  Источник не указан.
                </Text>
              )}
              {documentError ? (
                <Text
                  size={FontSize.sm}
                  className="text-destructive-text"
                  accessibilityRole="alert"
                >
                  {documentError}
                </Text>
              ) : null}
            </VStack>
            <Text size={FontSize.sm} className="text-muted-foreground">
              Аминокислоты, г/100 г белка
            </Text>
            {reference?.values.map((value, index) => (
              <Box
                key={`${aminoAcidName(value.amino_acid)}-${index}`}
                className="gap-1 border-b border-border pb-3"
              >
                <Text size={FontSize.sm} className="text-foreground">
                  {aminoAcidName(value.amino_acid)}
                </Text>
                <Text size={FontSize.sm} className="text-muted-foreground">
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
