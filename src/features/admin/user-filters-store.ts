import { create } from 'zustand'

export interface AdminUserSelection {
  role: string
  status: string
}

interface State extends AdminUserSelection {
  search: string
  setSearch: (search: string) => void
  setSelection: (selection: AdminUserSelection) => void
}

/** Сохраняет поиск и применённые фильтры при переходе на отдельный экран. */
export const useAdminUserFilters = create<State>((set) => ({
  role: '',
  status: '',
  search: '',
  setSearch: (search) => set({ search }),
  setSelection: (selection) => set(selection),
}))
