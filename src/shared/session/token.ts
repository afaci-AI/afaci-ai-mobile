import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

export const TOKEN_KEY = 'afaci_token'
const isWeb = Platform.OS === 'web'
let memoryToken: string | null = null
let revision = 0
let storageQueue: Promise<unknown> = Promise.resolve()

/** Сериализуем операции: старое удаление не должно стереть новый вход. */
function inStorageOrder<T>(operation: () => Promise<T>): Promise<T> {
  const result = storageQueue.then(operation)
  storageQueue = result.catch(() => undefined)
  return result
}

export function getToken(): string | null {
  return memoryToken
}

export async function loadToken(): Promise<string | null> {
  if (isWeb) return memoryToken
  const currentRevision = revision
  const token = await inStorageOrder(() => SecureStore.getItemAsync(TOKEN_KEY))
  if (currentRevision === revision) memoryToken = token
  return memoryToken
}

export async function saveToken(token: string): Promise<void> {
  const currentRevision = ++revision
  if (!isWeb) {
    await inStorageOrder(() => SecureStore.setItemAsync(TOKEN_KEY, token))
  }
  if (currentRevision === revision) memoryToken = token
}

export async function clearToken(): Promise<void> {
  ++revision
  memoryToken = null
  if (isWeb) return
  await inStorageOrder(() => SecureStore.deleteItemAsync(TOKEN_KEY))
}
