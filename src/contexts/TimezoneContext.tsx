import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { detectLocationByIP, detectLocationByBrowser, getLocationFromStorage } from '@/utils/geolocation';

interface TimezoneContextType {
  timezone: string;
  isDetecting: boolean;
}

const TimezoneContext = createContext<TimezoneContextType | undefined>(undefined);

// Карта районов Якутии к часовым поясам
const DISTRICT_TIMEZONE_MAP: Record<string, string> = {
  // Западная Якутия (UTC+9)
  'mirny': 'Asia/Yakutsk',
  'lensky': 'Asia/Yakutsk',
  'nyurbinsky': 'Asia/Yakutsk',
  'yakutsk-nyurbinsky': 'Asia/Yakutsk',
  'suntarsky': 'Asia/Yakutsk',
  'vilyuysky': 'Asia/Yakutsk',
  
  // Центральная Якутия (UTC+9)
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
  
  // Восточная Якутия (UTC+10)
  'ust-maysky': 'Asia/Vladivostok',
  'aldansky': 'Asia/Vladivostok',
  'neryungrinsky': 'Asia/Vladivostok',
  'olyokminsky': 'Asia/Vladivostok',
  'tomponsky': 'Asia/Vladivostok',
  'oymyakonsky': 'Asia/Vladivostok',
  
  // Северо-Восточная Якутия (UTC+11)
  'verkhoyansk': 'Asia/Srednekolymsk',
  'eveno-bytantaysky': 'Asia/Srednekolymsk',
  'zhigansky': 'Asia/Srednekolymsk',
  'bulunsky': 'Asia/Srednekolymsk',
  'anabarsky': 'Asia/Srednekolymsk',
  'allaikhovsky': 'Asia/Srednekolymsk',
  'momsky': 'Asia/Srednekolymsk',
  'ust-yansky': 'Asia/Srednekolymsk',
  'verkhoyansky': 'Asia/Srednekolymsk',
  'abyysky': 'Asia/Srednekolymsk',
  'nizhnekolymsky': 'Asia/Srednekolymsk',
  'srednekolymsky': 'Asia/Srednekolymsk',
  'verkhnekolymsky': 'Asia/Srednekolymsk',
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
        }
      } catch (error) {
        console.error('Timezone detection failed:', error);
        // Оставляем дефолтный Asia/Yakutsk
      } finally {
        setIsDetecting(false);
      }
    };

    // Проверяем сохраненный часовой пояс
    const savedTimezone = localStorage.getItem('userTimezone');
    if (savedTimezone) {
      setTimezone(savedTimezone);
    } else {
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