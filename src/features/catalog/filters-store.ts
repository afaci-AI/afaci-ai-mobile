import { create } from 'zustand'

/** Значение «без фильтра» — общее для store и экранов. */
export const ALL = '__all__'

export interface CatalogSelection {
  categoryId: string
  subcategoryId: string
  regionId: string
}

interface CatalogFiltersState extends CatalogSelection {
  search: string
  setSearch: (search: string) => void
  setSelection: (selection: CatalogSelection) => void
  clearSelection: () => void
  reset: () => void
}

const empty: CatalogSelection = {
  categoryId: ALL,
  subcategoryId: ALL,
  regionId: ALL,
}

/**
 * Поиск и фильтры живут в store, потому что их задают отдельные экраны
 * (`database/search`, `database/filters`), а список читает их на вкладке.
 */
export const useCatalogFilters = create<CatalogFiltersState>((set) => ({
  search: '',
  ...empty,

  setSearch(search) {
    set({ search })
  },

  setSelection(selection) {
    set(selection)
  },

  clearSelection() {
    set({ ...empty })
  },

  reset() {
    set({ search: '', ...empty })
  },
}))

export function countActiveFilters(selection: CatalogSelection): number {
  return [
    selection.categoryId,
    selection.subcategoryId,
    selection.regionId,
  ].filter((value) => value !== ALL).length
}
