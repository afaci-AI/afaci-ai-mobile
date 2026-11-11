/** Presentation names for backend NAK_GROUPS; unknown names remain readable as supplied. */
const names: Record<string, string> = {
  ИЗО: 'Изолейцин',
  ЛЕЙ: 'Лейцин',
  ВАЛ: 'Валин',
  'МЕТ+ЦИС': 'Метионин + цистеин',
  'Ф+Т': 'Фенилаланин + тирозин',
  ТРИ: 'Триптофан',
  ТРЕ: 'Треонин',
  ЛИЗ: 'Лизин',
}

export function aminoAcidName(name: string): string {
  return names[name.trim().toUpperCase().replace(/\s+/g, '')] ?? name
}
