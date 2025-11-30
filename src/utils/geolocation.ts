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
    
    return {
      city: data.city || 'Не определен',
      district: data.region || 'Все районы',
      coordinates: data.loc ? {
        latitude: parseFloat(data.loc.split(',')[0]),
        longitude: parseFloat(data.loc.split(',')[1])
      } : undefined,
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
        
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ru`
          );
          const data = await response.json();
          
          resolve({
            city: data.address?.city || data.address?.town || data.address?.village || 'Не определен',
            district: data.address?.state || data.address?.county || 'Все районы',
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
