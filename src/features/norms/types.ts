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
  /** Единица на 100 г: «г», «мг», «ккал», «%». */
  unit: string | null
  /** Усреднённая суточная норма; null — нормы для нутриента нет. */
  norm: number | null
  /** Содержание на 100 г; null — данных нет. */
  amount: number | null
  /** Доля от нормы, %; считается на backend. */
  percent: number | null
  source_id?: string | null
  basis?: string | null
  /** Значение есть не у всех ингредиентов рецептуры: сумма неполная. */
  partial?: boolean
  /** norm — физиологическая норма; adequate — адекватный уровень потребления. */
  kind?: 'norm' | 'adequate' | null
}

export interface DailyNormsInfo {
  title: string
  paragraphs: string[]
  disclaimer: string
}

export interface DailyNorms {
  /** Макросостав. */
  macro: DailyNormRow[]
  /** @deprecated прежнее имя списка `macro`. */
  norms: DailyNormRow[]
  /** Микросостав (минералы); пустой, если данных нет. */
  micro: DailyNormRow[]
  /** Прочее: влага, зольность и т. п. */
  other: DailyNormRow[]
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
