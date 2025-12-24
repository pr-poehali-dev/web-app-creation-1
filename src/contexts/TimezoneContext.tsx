import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { detectLocationByIP, detectLocationByBrowser, getLocationFromStorage } from '@/utils/geolocation';

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
  const [timezone, setTimezone] = useState<string>('Asia/Yakutsk'); // По умолчанию Якутск
  const [isDetecting, setIsDetecting] = useState(false);

  useEffect(() => {
    const detectTimezone = async () => {
      setIsDetecting(true);
      
      try {
        // Сначала проверяем сохраненную локацию
        const storedLocation = getLocationFromStorage();
        
        if (storedLocation?.district) {
          const tz = getTimezoneByDistrict(storedLocation.district);
          setTimezone(tz);
          localStorage.setItem('userTimezone', tz);
          setIsDetecting(false);
          return;
        }

        // Пробуем определить через браузер
        try {
          const browserLocation = await detectLocationByBrowser();
          if (browserLocation.district && browserLocation.district !== 'Все районы') {
            const tz = getTimezoneByDistrict(browserLocation.district);
            setTimezone(tz);
            localStorage.setItem('userTimezone', tz);
            setIsDetecting(false);
            return;
          }
        } catch (error) {
          console.log('Browser geolocation not available, trying IP detection');
        }

        // Определяем через IP
        const ipLocation = await detectLocationByIP();
        if (ipLocation.district && ipLocation.district !== 'Все районы') {
          const tz = getTimezoneByDistrict(ipLocation.district);
          setTimezone(tz);
          localStorage.setItem('userTimezone', tz);
          setIsDetecting(false);
          return;
        }

        // Если не удалось определить район, используем часовой пояс браузера
        // Это сработает для пользователей из других регионов (Владивосток, Чита и т.д.)
        const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        setTimezone(browserTimezone);
        localStorage.setItem('userTimezone', browserTimezone);
      } catch (error) {
        console.error('Timezone detection failed:', error);
        // В случае ошибки используем часовой пояс браузера
        try {
          const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          setTimezone(browserTimezone);
          localStorage.setItem('userTimezone', browserTimezone);
        } catch {
          // Последний fallback - Якутск
          setTimezone('Asia/Yakutsk');
        }
      } finally {
        setIsDetecting(false);
      }
    };

    // Проверяем сохраненный часовой пояс
    const savedTimezone = localStorage.getItem('userTimezone');
    if (savedTimezone) {
      setTimezone(savedTimezone);
      // Не делаем detectTimezone() если уже есть сохраненный
    } else {
      // Сначала используем часовой пояс браузера мгновенно
      try {
        const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        setTimezone(browserTimezone);
        localStorage.setItem('userTimezone', browserTimezone);
      } catch {
        setTimezone('Asia/Yakutsk');
      }
      
      // Потом в фоне пробуем определить более точно
      detectTimezone();
    }
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