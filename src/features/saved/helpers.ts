export function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Не удалось выполнить запрос. Попробуйте ещё раз.'
}

/** Search locally after the group filter; collapse incidental whitespace. */
export function matchesRecipeName(name: string, search: string): boolean {
  const normalize = (value: string) =>
    value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('ru-RU')
  return normalize(name).includes(normalize(search))
}
