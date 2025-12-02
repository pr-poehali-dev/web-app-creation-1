import { findSettlementByCoordinates, findSettlementByName } from '@/data/settlements';
import { findDistrictByName } from '@/data/districts';

export interface LocationData {
  city: string;
  district: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  source: 'ip' | 'geolocation' | 'default';
}

export interface IPLocationResponse {
  city?: string;
  region?: string;
  country?: string;
  loc?: string;
}

export const detectLocationByIP = async (): Promise<LocationData> => {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data: IPLocationResponse = await response.json();
    
    const coordinates = data.loc ? {
      latitude: parseFloat(data.loc.split(',')[0]),
      longitude: parseFloat(data.loc.split(',')[1])
    } : undefined;

    let city = data.city || 'Не определен';
    let district = data.region || 'Все районы';

    if (coordinates) {
      const settlement = findSettlementByCoordinates(coordinates.latitude, coordinates.longitude);
      if (settlement) {
        city = settlement.name;
        if (settlement.districtId) {
          district = settlement.districtId;
        }
      }
    }

    if (city !== 'Не определен') {
      const settlementByName = findSettlementByName(city);
      if (settlementByName && settlementByName.districtId) {
        district = settlementByName.districtId;
      }
    }
    
    return {
      city,
      district,
      coordinates,
      source: 'ip'
    };
  } catch (error) {
    console.error('Ошибка определения местоположения по IP:', error);
    return {
      city: 'Не определен',
      district: 'Все районы',
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
        source: 'default'
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        const settlement = findSettlementByCoordinates(latitude, longitude);
        
        if (settlement) {
          resolve({
            city: settlement.name,
            district: settlement.districtId || 'Все районы',
            coordinates: { latitude, longitude },
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
          
          resolve({
            city,
            district,
            coordinates: { latitude, longitude },
            source: 'geolocation'
          });
        } catch (error) {
          console.error('Ошибка определения адреса по координатам:', error);
          resolve({
            city: 'Не определен',
            district: 'Все районы',
            coordinates: { latitude, longitude },
            source: 'geolocation'
          });
        }
      },
      (error) => {
        console.error('Ошибка получения геолокации:', error);
        resolve({
          city: 'Не определен',
          district: 'Все районы',
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