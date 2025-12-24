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
  fallback: string = 'Неизвестно',
  timeZone?: string
): string {
  const d = safeDate(date);
  if (!d) return fallback;
  
  const tz = timeZone || getUserTimezone();
  return d.toLocaleDateString(locale, { timeZone: tz });
}

/**
 * Безопасно форматирует дату и время в локальную строку
 * Использует часовой пояс из localStorage или дефолтный Asia/Yakutsk
 */
export function safeToLocaleString(
  date: Date | string | null | undefined,
  locale: string = 'ru-RU',
  fallback: string = 'Неизвестно',
  timeZone?: string
): string {
  const d = safeDate(date);
  if (!d) return fallback;
  
  const tz = timeZone || getUserTimezone();
  return d.toLocaleString(locale, { timeZone: tz });
}

/**
 * Получить часовой пояс пользователя из localStorage
 */
export function getUserTimezone(): string {
  if (typeof window === 'undefined') return 'Asia/Yakutsk';
  return localStorage.getItem('userTimezone') || 'Asia/Yakutsk';
}

/**
 * Форматировать дату с автоматическим часовым поясом
 */
export function formatWithTimezone(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = date instanceof Date ? date : new Date(date);
  const tz = getUserTimezone();
  return d.toLocaleString('ru-RU', { ...options, timeZone: tz });
}

/**
 * Форматировать только дату с автоматическим часовым поясом
 */
export function formatDateWithTimezone(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = date instanceof Date ? date : new Date(date);
  const tz = getUserTimezone();
  return d.toLocaleDateString('ru-RU', { ...options, timeZone: tz });
}

/**
 * Форматировать только время с автоматическим часовым поясом
 */
export function formatTimeWithTimezone(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = date instanceof Date ? date : new Date(date);
  const tz = getUserTimezone();
  return d.toLocaleTimeString('ru-RU', { ...options, timeZone: tz });
}