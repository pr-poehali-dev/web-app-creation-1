import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getLocationFromStorage } from '@/utils/geolocation';

interface TimezoneContextType {
  timezone: string;
  isDetecting: boolean;
}

const TimezoneContext = createContext<TimezoneContextType | undefined>(undefined);

// Карта районов Якутии к часовому поясу (вся Якутия - UTC+9)
const DISTRICT_TIMEZONE_MAP: Record<string, string> = {
  // Вся территория Якутии использует единый часовой пояс UTC+9
  'mirny': 'Asia/Yakutsk',
  'lensky': 'Asia/Yakutsk',
  'nyurbinsky': 'Asia/Yakutsk',
  'yakutsk-nyurbinsky': 'Asia/Yakutsk',
  'suntarsky': 'Asia/Yakutsk',
  'vilyuysky': 'Asia/Yakutsk',
  'yakutsk': 'Asia/Yakutsk',
  'yakutsk-city': 'Asia/Yakutsk',
  'namsky': 'Asia/Yakutsk',
  'megino-kangalassky': 'Asia/Yakutsk',
  'churapchinsky': 'Asia/Yakutsk',
  'tattinsky': 'Asia/Yakutsk',
  'ust-aldansky': 'Asia/Yakutsk',
  'khangalassky': 'Asia/Yakutsk',
  'gorny': 'Asia/Yakutsk',
  'amginsky': 'Asia/Yakutsk',
  'ust-maysky': 'Asia/Yakutsk',
  'aldansky': 'Asia/Yakutsk',
  'neryungrinsky': 'Asia/Yakutsk',
  'olyokminsky': 'Asia/Yakutsk',
  'tomponsky': 'Asia/Yakutsk',
  'oymyakonsky': 'Asia/Yakutsk',
  'verkhoyansk': 'Asia/Yakutsk',
  'eveno-bytantaysky': 'Asia/Yakutsk',
  'zhigansky': 'Asia/Yakutsk',
  'bulunsky': 'Asia/Yakutsk',
  'anabarsky': 'Asia/Yakutsk',
  'allaikhovsky': 'Asia/Yakutsk',
  'momsky': 'Asia/Yakutsk',
  'ust-yansky': 'Asia/Yakutsk',
  'verkhoyansky': 'Asia/Yakutsk',
  'abyysky': 'Asia/Yakutsk',
  'nizhnekolymsky': 'Asia/Yakutsk',
  'srednekolymsky': 'Asia/Yakutsk',
  'verkhnekolymsky': 'Asia/Yakutsk',
};

// Получить часовой пояс по ID района
function getTimezoneByDistrict(districtId: string): string {
  // Сначала проверяем точное совпадение
  if (DISTRICT_TIMEZONE_MAP[districtId]) {
    return DISTRICT_TIMEZONE_MAP[districtId];
  }
  
  // Если это составной ID (например "yakutsk-nyurbinsky"), проверяем части
  if (districtId.includes('-')) {
    const parts = districtId.split('-');
    for (const part of parts) {
      if (DISTRICT_TIMEZONE_MAP[part]) {
        return DISTRICT_TIMEZONE_MAP[part];
      }
    }
  }
  
  return 'Asia/Yakutsk'; // По умолчанию - Якутск
}

export function TimezoneProvider({ children }: { children: ReactNode }) {
  const [timezone, setTimezone] = useState<string>(() => {
    // Сначала пробуем сохранённый timezone
    const saved = localStorage.getItem('userTimezone');
    if (saved) return saved;
    // Затем из сохранённой локации
    const loc = getLocationFromStorage();
    if (loc?.timezone) return loc.timezone;
    if (loc?.district) return getTimezoneByDistrict(loc.district);
    // Иначе — браузерный timezone (мгновенно, без запросов)
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return 'Asia/Yakutsk';
    }
  });
  const [isDetecting] = useState(false);

  useEffect(() => {
    // Слушаем событие от DistrictContext когда он определит локацию по IP
    const handler = (e: Event) => {
      const tz = (e as CustomEvent<{ timezone: string }>).detail?.timezone;
      if (tz) setTimezone(tz);
    };
    window.addEventListener('timezoneDetected', handler);
    return () => window.removeEventListener('timezoneDetected', handler);
  }, []);

  return (
    <TimezoneContext.Provider value={{ timezone, isDetecting }}>
      {children}
    </TimezoneContext.Provider>
  );
}

export function useTimezone() {
  const context = useContext(TimezoneContext);
  if (context === undefined) {
    throw new Error('useTimezone must be used within a TimezoneProvider');
  }
  return context;
}