import { useTimezone } from '@/contexts/TimezoneContext';

/**
 * Хук для форматирования дат с учетом часового пояса пользователя
 */
export function useDateFormat() {
  const { timezone } = useTimezone();

  const formatDate = (
    date: Date | string,
    options?: Intl.DateTimeFormatOptions
  ): string => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('ru-RU', { ...options, timeZone: timezone });
  };

  const formatDateTime = (
    date: Date | string,
    options?: Intl.DateTimeFormatOptions
  ): string => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleString('ru-RU', { ...options, timeZone: timezone });
  };

  const formatTime = (
    date: Date | string,
    options?: Intl.DateTimeFormatOptions
  ): string => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleTimeString('ru-RU', { ...options, timeZone: timezone });
  };

  return {
    formatDate,
    formatDateTime,
    formatTime,
    timezone,
  };
}