export type SourceKind = 'article' | 'document' | 'book' | 'link' | 'file'

export interface Source {
  id: string
  kind: SourceKind | string
  title: string
  authors?: string | null
  year?: number | null
  location?: string | null
  url?: string | null
  pdf_url?: string | null
  used_for?: string | null
}

export interface DailyNormRow {
  key: string
  name: string
  unit: string
  /** Усреднённая суточная норма. */
  norm: number
  /** Содержание на 100 г; null — данных нет. */
  amount: number | null
  /** Доля от нормы, %; считается на backend. */
  percent: number | null
  source_id?: string | null
  basis?: string | null
}

export interface DailyNormsInfo {
  title: string
  paragraphs: string[]
  disclaimer: string
}

export interface DailyNorms {
  norms: DailyNormRow[]
  sources: Source[]
  info: DailyNormsInfo
}

export const SOURCE_KIND_LABELS: Record<string, string> = {
  article: 'Статья',
  document: 'Документ',
  book: 'Книга',
  link: 'Ссылка',
  file: 'Файл',
}
