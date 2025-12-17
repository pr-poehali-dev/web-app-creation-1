/**
 * Безопасно преобразует значение в Date объект
 * Работает кросс-браузерно (Chrome, Firefox, Safari, Yandex)
 */
export function safeDate(value: Date | string | null | undefined): Date | undefined {
  if (!value) return undefined;
  
  try {
    const date = value instanceof Date ? value : new Date(value);
    return isNaN(date.getTime()) ? undefined : date;
  } catch {
    return undefined;
  }
}

/**
 * Безопасно получает timestamp из даты
 * Возвращает 0 если дата некорректна
 */
export function safeGetTime(date: Date | string | null | undefined): number {
  const d = safeDate(date);
  return d ? d.getTime() : 0;
}

/**
 * Безопасно форматирует дату в локальную строку
 * Возвращает fallback если дата некорректна
 */
export function safeToLocaleDateString(
  date: Date | string | null | undefined,
  locale: string = 'ru-RU',
  fallback: string = 'Неизвестно'
): string {
  const d = safeDate(date);
  return d ? d.toLocaleDateString(locale) : fallback;
}

/**
 * Безопасно форматирует дату и время в локальную строку
 */
export function safeToLocaleString(
  date: Date | string | null | undefined,
  locale: string = 'ru-RU',
  fallback: string = 'Неизвестно'
): string {
  const d = safeDate(date);
  return d ? d.toLocaleString(locale) : fallback;
}
