import { useEffect, useRef, useState } from 'react'
import { Redirect, router, useLocalSearchParams } from 'expo-router'
import * as DocumentPicker from 'expo-document-picker'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useSession } from '@/shared/session/store'
import { Text } from '@/shared/ui/text'
import {
  Button,
  Card,
  ErrorState,
  FormField,
  Header,
  Input,
  LoadingView,
  ScrollScreen,
  SwitchRow,
  useAppToast,
} from '@/shared/ui/kit'
import {
  createVersion,
  listVersions,
  updateVersion,
  uploadApk,
  versionsKey,
  type AppVersion,
} from './versions-api'

const message = (error: unknown) =>
  error instanceof Error ? error.message : 'Не удалось сохранить версию.'
export function AdminVersionFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>()
  const user = useSession((s) => s.user)
  const versions = useQuery({
    queryKey: versionsKey,
    queryFn: listVersions,
    enabled: Boolean(id) && user?.role === 'admin',
  })
  if (!user) return null
  if (user.role !== 'admin') return <Redirect href="/admin" />
  if (id && versions.isPending) return <LoadingView />
  if (id && versions.error)
    return (
      <ScrollScreen>
        <Header
          title="Версия"
          onBack={() => router.replace('/admin/app-versions')}
        />
        <ErrorState
          message={message(versions.error)}
          onRetry={() => void versions.refetch()}
        />
      </ScrollScreen>
    )
  const version = versions.data?.find((item) => item.id === id)
  if (id && !version)
    return (
      <ScrollScreen>
        <Header
          title="Версия"
          onBack={() => router.replace('/admin/app-versions')}
        />
        <Text className="text-foreground">Версия не найдена.</Text>
      </ScrollScreen>
    )
  return <VersionForm key={id ?? 'new'} original={version} owner={user.id} />
}

function VersionForm({
  original,
  owner,
}: {
  original?: AppVersion
  owner: string
}) {
  const client = useQueryClient()
  const toast = useAppToast()
  const [version, setVersion] = useState(original?.version ?? '')
  const [code, setCode] = useState('')
  const [minimum, setMinimum] = useState(
    original?.minSupportedVersionCode?.toString() ?? '',
  )
  const [changelog, setChangelog] = useState(original?.changelog ?? '')
  const [force, setForce] = useState(original?.forceUpdate ?? false)
  const [current, setCurrent] = useState(true)
  const [filename, setFilename] = useState('')
  const [fileLabel, setFileLabel] = useState('')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const controller = useRef<AbortController | null>(null)
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      controller.current?.abort()
    }
  }, [])
  const active = () =>
    mounted.current &&
    useSession.getState().user?.id === owner &&
    useSession.getState().user?.role === 'admin'
  const save = useMutation({
    mutationFn: async () => {
      if (!active()) throw new Error('Недостаточно прав.')
      if (!version.trim()) throw new Error('Укажите номер версии.')
      const min = minimum.trim() ? Number(minimum) : null
      if (
        min !== null &&
        (!/^\d+$/.test(minimum.trim()) || !Number.isSafeInteger(min) || min < 1)
      )
        throw new Error(
          'Минимальный код должен быть положительным целым числом.',
        )
      const body = {
        version: version.trim(),
        changelog: changelog.trim(),
        forceUpdate: force,
        minSupportedVersionCode: min,
      }
      if (original) {
        if (min !== null && min > original.versionCode)
          throw new Error('Минимальный код не должен превышать код версии.')
        return updateVersion(original.id, body)
      }
      const numericCode = Number(code)
      if (
        !/^\d+$/.test(code.trim()) ||
        !Number.isSafeInteger(numericCode) ||
        numericCode < 1
      )
        throw new Error('Код версии должен быть положительным целым числом.')
      if (!filename) throw new Error('Сначала загрузите APK.')
      if (min !== null && min > numericCode)
        throw new Error('Минимальный код не должен превышать код версии.')
      return createVersion({
        ...body,
        versionCode: numericCode,
        apkFilename: filename,
        isCurrent: current,
      })
    },
    onSuccess: async () => {
      if (!active()) return
      await client.invalidateQueries({ queryKey: versionsKey })
      if (active()) {
        toast.success({ title: 'Версия сохранена' })
        router.replace('/admin/app-versions')
      }
    },
  })
  const pick = async () => {
    if (uploading || save.isPending || !active()) return
    setError('')
    setUploading(true)
    try {
      // Some Android providers classify APKs as octet-stream; validate extension and size ourselves.
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: false,
        copyToCacheDirectory: true,
      })
      if (result.canceled || !active()) return
      const file = result.assets[0]
      controller.current = new AbortController()
      setProgress(0)
      const uploaded = await uploadApk(
        file,
        (value) => {
          if (active()) setProgress(value)
        },
        controller.current.signal,
      )
      if (active()) {
        setFilename(uploaded.filename)
        setFileLabel(file.name)
      }
    } catch (failure) {
      if (active()) setError(message(failure))
    } finally {
      controller.current = null
      if (mounted.current) setUploading(false)
    }
  }
  const busy = uploading || save.isPending
  return (
    <ScrollScreen>
      <Header
        title={original ? 'Редактирование версии' : 'Новая версия'}
        onBack={() =>
          router.canGoBack()
            ? router.back()
            : router.replace('/admin/app-versions')
        }
      />
      <Card>
        <FormField label="Версия" isRequired>
          <Input
            accessibilityLabel="Версия приложения"
            value={version}
            onChangeText={setVersion}
            isDisabled={busy}
            placeholder="2.0.1"
          />
        </FormField>
        {original ? (
          <Text className="text-muted-foreground">
            Код версии: {original.versionCode}. APK и код существующей версии не
            изменяются.
          </Text>
        ) : (
          <>
            <FormField
              label="Код версии"
              isRequired
              hint="Целое число больше кода любой существующей версии."
            >
              <Input
                accessibilityLabel="Код версии"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                isDisabled={busy}
              />
            </FormField>
            <Button
              label={
                uploading
                  ? 'Загрузка APK…'
                  : filename
                    ? 'Заменить APK'
                    : 'Выбрать и загрузить APK'
              }
              variant="outline"
              isDisabled={busy}
              onPress={() => void pick()}
            />
            <Text className="text-muted-foreground">
              {fileLabel ? `Загружен: ${fileLabel}` : 'APK до 200 МБ.'}
            </Text>
            {uploading ? (
              <>
                <Text
                  accessibilityLiveRegion="polite"
                  className="text-foreground"
                >
                  {progress === 100
                    ? 'Файл отправлен, ожидаем подтверждения сервера…'
                    : `Загрузка: ${progress}%`}
                </Text>
                <Button
                  label="Отменить загрузку"
                  variant="outline"
                  onPress={() => controller.current?.abort()}
                />
              </>
            ) : null}
            <SwitchRow
              label="Назначить текущей"
              value={current}
              onValueChange={setCurrent}
              isDisabled={busy}
            />
          </>
        )}
        <FormField label="Описание изменений">
          <Input
            accessibilityLabel="Описание изменений"
            value={changelog}
            onChangeText={setChangelog}
            isDisabled={busy}
            multiline
          />
        </FormField>
        <FormField
          label="Минимальный поддерживаемый код"
          hint="Оставьте пустым, если ограничение не требуется."
        >
          <Input
            accessibilityLabel="Минимальный поддерживаемый код"
            value={minimum}
            onChangeText={setMinimum}
            keyboardType="number-pad"
            isDisabled={busy}
          />
        </FormField>
        <SwitchRow
          label="Обязательное обновление"
          value={force}
          onValueChange={setForce}
          isDisabled={busy}
        />
        {error || save.error ? (
          <Text accessibilityRole="alert" className="text-destructive-text">
            {error || message(save.error)}
          </Text>
        ) : null}
        <Button
          label="Сохранить"
          isLoading={save.isPending}
          isDisabled={uploading}
          onPress={() => {
            setError('')
            save.mutate()
          }}
        />
      </Card>
    </ScrollScreen>
  )
}
