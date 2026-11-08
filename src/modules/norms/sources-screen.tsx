import { useRouter } from 'expo-router'

import { FlatList } from '@/shared/ui/flat-list'
import {
  EmptyState,
  ErrorState,
  Header,
  LoadingView,
  Screen,
} from '@/shared/ui/kit'

import { useSources } from './api'
import { SourceCard } from './components/source-card'

/** Список всех документов, статей и ссылок, на которые опирается программа. */
export function SourcesScreen() {
  const router = useRouter()
  const sources = useSources()
  const back = () => {
    if (router.canGoBack()) router.back()
    else router.replace('/profile')
  }
  return (
    <Screen edges={['top']}>
      <Header title="Источники" onBack={back} />
      {sources.isPending ? (
        <LoadingView label="Загрузка источников…" />
      ) : sources.isError ? (
        <ErrorState
          title="Не удалось загрузить источники"
          message={sources.error.message}
          onRetry={() => void sources.refetch()}
        />
      ) : (
        <FlatList
          data={sources.data}
          keyExtractor={(item) => item.id}
          // FlatList content container does not receive NativeWind classes.
          contentContainerStyle={{ padding: 16, gap: 12, flexGrow: 1 }}
          refreshing={sources.isFetching}
          onRefresh={() => void sources.refetch()}
          ListEmptyComponent={
            <EmptyState title="Источники пока не добавлены" />
          }
          renderItem={({ item }) => <SourceCard source={item} />}
        />
      )}
    </Screen>
  )
}
