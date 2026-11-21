/**
 * Данные восстановления между экранами (email → код → пароль). Код держим
 * только в памяти: не в параметрах маршрута и не в хранилище устройства.
 */
export const resetDraft = {
  email: '',
  code: '',
  notice: '',
  /** Момент (мс), после которого можно запросить код повторно. */
  resendAt: 0,
  clear() {
    this.email = ''
    this.code = ''
    this.notice = ''
    this.resendAt = 0
  },
}

export function resendDeadline(seconds: number | undefined) {
  return Date.now() + (seconds ?? 60) * 1000
}

export function formatSeconds(total: number) {
  const minutes = Math.floor(total / 60)
  return `${minutes}:${String(total % 60).padStart(2, '0')}`
}

export function errorText(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'Произошла ошибка. Попробуйте позже.'
}
