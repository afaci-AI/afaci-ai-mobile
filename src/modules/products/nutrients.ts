import type {
  DictionaryEntry,
  Nutrient,
  NutrientName,
} from '@/modules/catalog/api'

export interface NutrientRow {
  id: string
  name: string
  quantity: number | null
  errorRate: number | null
}

export interface NutrientSection {
  key: string
  title: string
  unit: string
  data: NutrientRow[]
}

export interface MacroValue {
  key: 'protein' | 'fat' | 'carb'
  label: string
  value: number | null
  unit: string
}

export function groupNutrients(
  nutrients: Nutrient[],
  names: NutrientName[],
  types: DictionaryEntry[],
  units: DictionaryEntry[],
): NutrientSection[] {
  const nameMap = new Map(names.map((item) => [item.id, item]))
  const typeMap = new Map(types.map((item) => [item.id, item.name]))
  const unitMap = new Map(units.map((item) => [item.id, item.name]))
  const groups = new Map<string, NutrientSection>()

  for (const item of nutrients) {
    const name = nameMap.get(item.nutrient_name_id)
    const typeId = name?.nutrient_type_id ?? item.nutrient_type_id
    const key = `${typeId ?? 'untyped'}:${item.unit_id}`
    let group = groups.get(key)
    if (!group) {
      group = {
        key,
        title: (typeId && typeMap.get(typeId)) || 'Без типа',
        unit: unitMap.get(item.unit_id) || 'Единица не указана',
        data: [],
      }
      groups.set(key, group)
    }
    group.data.push({
      id: item.id,
      name: name?.name || 'Название не указано',
      quantity: item.quantity,
      errorRate: item.error_rate ?? null,
    })
  }
  return [...groups.values()]
    .sort((a, b) => a.title.localeCompare(b.title, 'ru'))
    .map((group) => ({
      ...group,
      data: group.data.sort((a, b) => a.name.localeCompare(b.name, 'ru')),
    }))
}

// Preserve source units and missing values: the chart compares only values
// with the same unit, without conversion or an inferred remainder.
export function getMacroValues(
  nutrients: Nutrient[],
  names: NutrientName[],
  units: DictionaryEntry[],
): MacroValue[] {
  const nameMap = new Map(names.map((item) => [item.id, item.name]))
  const unitMap = new Map(units.map((item) => [item.id, item.name]))
  const candidates = nutrients
    .map((item) => ({
      item,
      name: (nameMap.get(item.nutrient_name_id) ?? '').toLowerCase(),
    }))
    .sort((a, b) => a.name.length - b.name.length)

  const definitions: {
    key: MacroValue['key']
    label: string
    matches: (name: string) => boolean
  }[] = [
    {
      key: 'protein',
      label: 'Белки',
      matches: (name) => name.includes('белок') || name.includes('белк'),
    },
    {
      key: 'fat',
      label: 'Жиры',
      matches: (name) => name.includes('жир') && !name.includes('кислот'),
    },
    {
      key: 'carb',
      label: 'Углеводы',
      matches: (name) => name.includes('углевод'),
    },
  ]
  return definitions.map(({ key, label, matches }) => {
    const nutrient = candidates.find(({ name }) => matches(name))?.item
    const value = nutrient?.quantity
    return {
      key,
      label,
      unit: (nutrient && unitMap.get(nutrient.unit_id)) || '',
      value:
        typeof value === 'number' && Number.isFinite(value) && value >= 0
          ? value
          : null,
    }
  })
}
