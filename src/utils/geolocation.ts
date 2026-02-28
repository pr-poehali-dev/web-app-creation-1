import { findSettlementByCoordinates, findSettlementByName } from '@/data/settlements';
import { findDistrictByName } from '@/data/districts';
import { findNaslegByCoordinates } from '@/data/naslegs';

export interface LocationData {
  city: string;
  district: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  timezone?: string;
  timezoneOffset?: number;
  source: 'ip' | 'geolocation' | 'default';
}

export interface IPLocationResponse {
  city?: string;
  region?: string;
  country?: string;
  loc?: string;
  timezone?: string;
  utc_offset?: string;
}

export const detectLocationByIP = async (): Promise<LocationData> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const response = await fetch('https://ipapi.co/json/', { signal: controller.signal });
    clearTimeout(timeoutId);
    const data: IPLocationResponse = await response.json();
    
    const coordinates = data.loc ? {
      latitude: parseFloat(data.loc.split(',')[0]),
      longitude: parseFloat(data.loc.split(',')[1])
    } : undefined;

    let city = data.city || 'Не определен';
    let district = data.region || 'Все районы';

    if (coordinates) {
      // Сначала проверяем наслеги (более точное определение для Якутии)
      const nasleg = findNaslegByCoordinates(coordinates.latitude, coordinates.longitude);
      if (nasleg) {
        city = nasleg.name;
        district = nasleg.districtId;
      } else {
        // Если наслег не найден, ищем по общим поселениям
        const settlement = findSettlementByCoordinates(coordinates.latitude, coordinates.longitude);
        if (settlement) {
          city = settlement.name;
          if (settlement.districtId) {
            district = settlement.districtId;
          }
        }
      }
    }

    if (city !== 'Не определен') {
      const settlementByName = findSettlementByName(city);
      if (settlementByName && settlementByName.districtId) {
        district = settlementByName.districtId;
      }
    }
    
    // Получаем часовой пояс
    const timezone = data.timezone || 'Asia/Yakutsk';
    const timezoneOffset = data.utc_offset ? parseFloat(data.utc_offset) : 9;
    
    return {
      city,
      district,
      coordinates,
      timezone,
      timezoneOffset,
      source: 'ip'
    };
  } catch (error) {
    console.error('Ошибка определения местоположения по IP:', error);
    return {
      city: 'Не определен',
      district: 'Все районы',
      timezone: 'Asia/Yakutsk',
      timezoneOffset: 9,
      source: 'default'
    };
  }
};

export const detectLocationByBrowser = (): Promise<LocationData> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({
        city: 'Не определен',
        district: 'Все районы',
        timezone: 'Asia/Yakutsk',
        timezoneOffset: 9,
        source: 'default'
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Сначала проверяем наслеги (более точное определение для Якутии)
        const nasleg = findNaslegByCoordinates(latitude, longitude);
        
        if (nasleg) {
          const timezoneOffset = getTimezoneOffsetByCoordinates(latitude, longitude);
          resolve({
            city: nasleg.name,
            district: nasleg.districtId,
            coordinates: { latitude, longitude },
            timezone: getTimezoneNameByOffset(timezoneOffset),
            timezoneOffset,
            source: 'geolocation'
          });
          return;
        }
        
        // Если наслег не найден, ищем по общим поселениям
        const settlement = findSettlementByCoordinates(latitude, longitude);
        
        if (settlement) {
          const timezoneOffset = getTimezoneOffsetByCoordinates(latitude, longitude);
          resolve({
            city: settlement.name,
            district: settlement.districtId || 'Все районы',
            coordinates: { latitude, longitude },
            timezone: getTimezoneNameByOffset(timezoneOffset),
            timezoneOffset,
            source: 'geolocation'
          });
          return;
        }

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ru`
          );
          const data = await response.json();
          
          let city = data.address?.city || data.address?.town || data.address?.village || 'Не определен';
          let district = 'Все районы';

          if (city !== 'Не определен') {
            const settlementByName = findSettlementByName(city);
            if (settlementByName && settlementByName.districtId) {
              city = settlementByName.name;
              district = settlementByName.districtId;
            }
          }
          
          const timezoneOffset = getTimezoneOffsetByCoordinates(latitude, longitude);
          resolve({
            city,
            district,
            coordinates: { latitude, longitude },
            timezone: getTimezoneNameByOffset(timezoneOffset),
            timezoneOffset,
            source: 'geolocation'
          });
        } catch (error) {
          console.error('Ошибка определения адреса по координатам:', error);
          const timezoneOffset = getTimezoneOffsetByCoordinates(latitude, longitude);
          resolve({
            city: 'Не определен',
            district: 'Все районы',
            coordinates: { latitude, longitude },
            timezone: getTimezoneNameByOffset(timezoneOffset),
            timezoneOffset,
            source: 'geolocation'
          });
        }
      },
      (error) => {
        console.error('Ошибка геолокации (code ' + error.code + '):', error.message);
        resolve({
          city: 'Не определен',
          district: 'Все районы',
          timezone: 'Asia/Yakutsk',
          timezoneOffset: 9,
          source: 'default'
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
};

export const saveLocationToStorage = (location: LocationData): void => {
  localStorage.setItem('userLocation', JSON.stringify(location));
};

export const getLocationFromStorage = (): LocationData | null => {
  const stored = localStorage.getItem('userLocation');
  return stored ? JSON.parse(stored) : null;
};

export const isFirstVisit = (): boolean => {
  return !localStorage.getItem('locationDetected');
};

export const markLocationDetected = (): void => {
  localStorage.setItem('locationDetected', 'true');
};

// Определение часового пояса по координатам (упрощенная версия для России)
export const getTimezoneOffsetByCoordinates = (latitude: number, longitude: number): number => {
  // Якутия и Дальний Восток
  if (longitude >= 105 && longitude <= 162) {
    if (longitude >= 105 && longitude <= 120) return 9; // UTC+9 (Якутск)
    if (longitude >= 120 && longitude <= 135) return 10; // UTC+10 (Владивосток)
    if (longitude >= 135 && longitude <= 150) return 11; // UTC+11 (Магадан)
    if (longitude >= 150 && longitude <= 162) return 12; // UTC+12 (Камчатка)
  }
  
  // Сибирь
  if (longitude >= 84 && longitude <= 105) {
    if (longitude >= 84 && longitude <= 92) return 7; // UTC+7 (Красноярск)
    if (longitude >= 92 && longitude <= 105) return 8; // UTC+8 (Иркутск)
  }
  
  // Урал и западнее
  if (longitude < 84) {
    if (longitude >= 60 && longitude < 68) return 5; // UTC+5 (Екатеринбург)
    if (longitude >= 30 && longitude < 60) return 3; // UTC+3 (Москва)
    if (longitude < 30) return 2; // UTC+2 (Калининград)
  }
  
  // По умолчанию Якутск
  return 9;
};

export const getTimezoneNameByOffset = (offset: number): string => {
  const timezones: { [key: number]: string } = {
    2: 'Europe/Kaliningrad',
    3: 'Europe/Moscow',
    5: 'Asia/Yekaterinburg',
    7: 'Asia/Krasnoyarsk',
    8: 'Asia/Irkutsk',
    9: 'Asia/Yakutsk',
    10: 'Asia/Vladivostok',
    11: 'Asia/Magadan',
    12: 'Asia/Kamchatka'
  };
  
  return timezones[offset] || 'Asia/Yakutsk';
};