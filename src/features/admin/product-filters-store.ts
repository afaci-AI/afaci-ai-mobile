import { create } from 'zustand'

export interface AdminProductSelection {
  categoryId: string
  subcategoryId: string
  regionId: string
}

export type ProductSort = 'product_name:asc' | 'product_name:desc'

interface State extends AdminProductSelection {
  search: string
  sort: ProductSort
  page: number
  setSearch: (search: string) => void
  setSort: (sort: ProductSort) => void
  setSelection: (selection: AdminProductSelection) => void
  setPage: (page: number) => void
}

/** Админские фильтры независимы от публичной базы; возврат с экрана их сохраняет. */
export const useAdminProductFilters = create<State>((set) => ({
  categoryId: '',
  subcategoryId: '',
  regionId: '',
  search: '',
  sort: 'product_name:asc',
  page: 0,
  setSearch: (search) => set({ search: search.trim(), page: 0 }),
  setSort: (sort) => set({ sort, page: 0 }),
  setSelection: (selection) => set({ ...selection, page: 0 }),
  setPage: (page) => set({ page }),
}))
