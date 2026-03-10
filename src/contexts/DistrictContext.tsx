import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { detectLocationByIP, detectLocationByBrowser, isFirstVisit, markLocationDetected, getLocationFromStorage, saveLocationToStorage } from '@/utils/geolocation';
import { REGIONS, findRegionByLocation, type Region } from '@/data/regions';
import { DISTRICTS, getDistrictsByRegion, findDistrictByName, type District as DistrictType } from '@/data/districts';

export interface District {
  id: string;
  name: string;
}

interface DistrictContextType {
  selectedRegion: string;
  setSelectedRegion: (region: string) => void;
  selectedDistricts: string[];
  setSelectedDistricts: (districts: string[]) => void;
  toggleDistrict: (districtId: string) => void;
  regions: District[];
  districts: DistrictType[];
  isDetecting: boolean;
  requestGeolocation: () => Promise<void>;
  detectedCity: string | null;
  detectedDistrictId: string | null;
}

const DistrictContext = createContext<DistrictContextType | undefined>(undefined);

const ALL_REGIONS: District[] = [
  { id: 'all', name: 'Все регионы' },
  ...REGIONS.map(region => ({
    id: region.id,
    name: region.name
  }))
];

export function DistrictProvider({ children }: { children: ReactNode }) {
  const [selectedRegion, setSelectedRegionState] = useState<string>('all');
  
  const detectedDistrictIdStored = localStorage.getItem('detectedDistrictId');
  
  const [selectedDistricts, setSelectedDistrictsState] = useState<string[]>(() => {
    const stored = localStorage.getItem('selectedDistricts');
    return stored ? JSON.parse(stored) : [];
  });
  
  const [detectedCity, setDetectedCity] = useState<string | null>(() => {
    const stored = localStorage.getItem('detectedCity');
    return stored || null;
  });
  const [detectedDistrictId, setDetectedDistrictId] = useState<string | null>(() => {
    return detectedDistrictIdStored || null;
  });
  const [isDetecting, setIsDetecting] = useState(false);
  const [availableDistricts, setAvailableDistricts] = useState<DistrictType[]>([]);

  useEffect(() => {
    const initLocation = async () => {
      console.log('🌍 Инициализация местоположения...');
      
      const storedLocation = getLocationFromStorage();
      console.log('📦 Сохранённое местоположение:', storedLocation);
      
      if (storedLocation) {
        const regionId = findRegionByLocation(storedLocation.city, storedLocation.district);
        console.log('📍 Найден регион:', regionId);
        setSelectedRegionState(regionId);
        setDetectedCity(storedLocation.city);
        
        const districts = getDistrictsByRegion(regionId);
        setAvailableDistricts(districts);
        
        let district = DISTRICTS.find(d => d.id === storedLocation.district);
        
        if (!district) {
          district = findDistrictByName(storedLocation.district, regionId);
        }
        
        console.log('🎯 Найден район:', district);
        
        if (district) {
          setDetectedDistrictId(district.id);
          localStorage.setItem('detectedDistrictId', district.id);
          localStorage.setItem('detectedCity', storedLocation.city);
          
          // Не перезаписываем selectedDistricts если пользователь уже сделал выбор вручную
          const storedDistricts = localStorage.getItem('selectedDistricts');
          const parsedDistricts = storedDistricts ? JSON.parse(storedDistricts) : [];
          
          if (parsedDistricts.length === 0) {
            setSelectedDistrictsState([district.id]);
            localStorage.setItem('selectedDistricts', JSON.stringify([district.id]));
          } else {
            setSelectedDistrictsState(parsedDistricts);
          }
        }
        return;
      }

      const storedRegion = localStorage.getItem('selectedRegion');
      if (storedRegion) {
        setSelectedRegionState(storedRegion);
        const districts = getDistrictsByRegion(storedRegion);
        setAvailableDistricts(districts);
        return;
      }

      // Автоопределение при каждом открытии, если нет сохранённых данных
      setIsDetecting(true);
      try {
        const location = await Promise.race([
          detectLocationByIP(),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
        ]);
        
        const regionId = findRegionByLocation(location.city, location.district);
        
        if (regionId !== 'all') {
          setSelectedRegionState(regionId);
          setDetectedCity(location.city);
          saveLocationToStorage(location);
          
          const districts = getDistrictsByRegion(regionId);
          setAvailableDistricts(districts);
          
          const district = findDistrictByName(location.district, regionId);
          if (district) {
            setDetectedDistrictId(district.id);
            localStorage.setItem('detectedDistrictId', district.id);
            localStorage.setItem('detectedCity', location.city);
            setSelectedDistrictsState([district.id]);
            localStorage.setItem('selectedDistricts', JSON.stringify([district.id]));
          }
        }
        
        markLocationDetected();
      } catch (error) {
        console.error('Location detection failed:', error);
      } finally {
        setIsDetecting(false);
      }
    };

    initLocation();
  }, []);

  useEffect(() => {
    if (selectedRegion !== 'all') {
      localStorage.setItem('selectedRegion', selectedRegion);
      const districts = getDistrictsByRegion(selectedRegion);
      setAvailableDistricts(districts);
    } else {
      setAvailableDistricts([]);
    }
  }, [selectedRegion]);

  useEffect(() => {
    localStorage.setItem('selectedDistricts', JSON.stringify(selectedDistricts));
  }, [selectedDistricts]);

  const setSelectedRegion = (region: string) => {
    setSelectedRegionState(region);
    if (region !== selectedRegion) {
      setSelectedDistrictsState([]);
      // Сбрасываем сохранённую геолокацию при ручной смене региона
      localStorage.removeItem('userLocation');
      localStorage.removeItem('detectedDistrictId');
      localStorage.removeItem('detectedCity');
      setDetectedDistrictId(null);
      setDetectedCity(null);
    }
    
    // Сразу обновляем доступные районы
    if (region !== 'all') {
      const districts = getDistrictsByRegion(region);
      setAvailableDistricts(districts);
    } else {
      setAvailableDistricts([]);
    }
  };

  const setSelectedDistricts = (districts: string[]) => {
    setSelectedDistrictsState(districts);
    // Сбрасываем сохранённую геолокацию при ручном выборе районов
    localStorage.removeItem('userLocation');
  };

  const toggleDistrict = (districtId: string) => {
    if (districtId === 'all') {
      setSelectedDistrictsState([]);
      return;
    }

    // Сбрасываем сохранённую геолокацию при ручном переключении района
    localStorage.removeItem('userLocation');

    setSelectedDistrictsState(prev => {
      if (prev.includes(districtId)) {
        return prev.filter(id => id !== districtId);
      } else {
        return [...prev, districtId];
      }
    });
  };

  const requestGeolocation = async () => {
    setIsDetecting(true);
    try {
      // Проверяем статус разрешения на геолокацию (Android/iOS)
      if (navigator.permissions) {
        try {
          const permStatus = await navigator.permissions.query({ name: 'geolocation' });
          if (permStatus.state === 'denied') {
            // Разрешение отклонено — используем IP без вызова браузерного диалога
            const location = await detectLocationByIP();
            if (location.source !== 'default' && location.district && location.district !== 'Все районы') {
              const districtData = DISTRICTS.find(d => d.id === location.district);
              if (districtData) {
                setSelectedRegionState(districtData.regionId);
                setDetectedCity(location.city);
                saveLocationToStorage(location);
                setAvailableDistricts(getDistrictsByRegion(districtData.regionId));
                setDetectedDistrictId(districtData.id);
                localStorage.setItem('detectedDistrictId', districtData.id);
                localStorage.setItem('detectedCity', location.city);
                setSelectedDistrictsState([districtData.id]);
                localStorage.setItem('selectedDistricts', JSON.stringify([districtData.id]));
              }
            }
            setIsDetecting(false);
            return;
          }
        } catch {
          // permissions API не поддерживается — продолжаем без проверки
        }
      }

      let location = await detectLocationByBrowser();
      
      // Если браузерная геолокация не работает, используем IP
      if (location.city === 'Не определен' || location.source === 'default') {
        try {
          location = await detectLocationByIP();
        } catch (ipError) {
          console.error('IP location detection failed:', ipError);
          setIsDetecting(false);
          return;
        }
      }
      
      // Если district это ID района, получаем регион из него
      let regionId = 'all';
      let districtToSelect = null;
      
      if (location.district && location.district !== 'Все районы') {
        // Проверяем, является ли district ID-ом района
        const districtData = DISTRICTS.find(d => d.id === location.district);
        if (districtData) {
          regionId = districtData.regionId;
          districtToSelect = districtData;
        } else {
          // Если не нашли по ID, ищем по названию через старую функцию
          regionId = findRegionByLocation(location.city, location.district);
          if (regionId !== 'all') {
            const district = findDistrictByName(location.district, regionId);
            if (district) {
              districtToSelect = district;
            }
          }
        }
      } else {
        // Используем старую логику поиска по городу
        regionId = findRegionByLocation(location.city, location.district);
      }
      
      if (regionId !== 'all') {
        setSelectedRegionState(regionId);
        setDetectedCity(location.city);
        saveLocationToStorage(location);
        
        const districts = getDistrictsByRegion(regionId);
        setAvailableDistricts(districts);
        
        if (districtToSelect) {
          setDetectedDistrictId(districtToSelect.id);
          localStorage.setItem('detectedDistrictId', districtToSelect.id);
          localStorage.setItem('detectedCity', location.city);
          const districtIds = [districtToSelect.id];
          setSelectedDistrictsState(districtIds);
          localStorage.setItem('selectedDistricts', JSON.stringify(districtIds));
        }
      }
    } catch (error) {
      console.error('Geolocation failed:', error);
    } finally {
      setIsDetecting(false);
    }
  };

  return (
    <DistrictContext.Provider value={{ 
      selectedRegion, 
      setSelectedRegion, 
      selectedDistricts, 
      setSelectedDistricts, 
      toggleDistrict,
      regions: ALL_REGIONS,
      districts: availableDistricts,
      isDetecting, 
      requestGeolocation,
      detectedCity,
      detectedDistrictId
    }}>
      {children}
    </DistrictContext.Provider>
  );
}

export function useDistrict() {
  const context = useContext(DistrictContext);
  if (context === undefined) {
    throw new Error('useDistrict must be used within a DistrictProvider');
  }
  return context;
}