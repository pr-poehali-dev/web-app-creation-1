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
  const [selectedDistricts, setSelectedDistrictsState] = useState<string[]>(() => {
    const stored = localStorage.getItem('selectedDistricts');
    return stored ? JSON.parse(stored) : [];
  });
  const [detectedCity, setDetectedCity] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [availableDistricts, setAvailableDistricts] = useState<DistrictType[]>([]);

  useEffect(() => {
    const initLocation = async () => {
      const storedLocation = getLocationFromStorage();
      
      if (storedLocation) {
        const regionId = findRegionByLocation(storedLocation.city, storedLocation.district);
        setSelectedRegionState(regionId);
        setDetectedCity(storedLocation.city);
        
        const districts = getDistrictsByRegion(regionId);
        setAvailableDistricts(districts);
        
        const district = findDistrictByName(storedLocation.district, regionId);
        if (district) {
          setSelectedDistrictsState([district.id]);
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

      if (isFirstVisit()) {
        setIsDetecting(true);
        try {
          const location = await detectLocationByIP();
          const regionId = findRegionByLocation(location.city, location.district);
          
          if (regionId !== 'all') {
            setSelectedRegionState(regionId);
            setDetectedCity(location.city);
            saveLocationToStorage(location);
            
            const districts = getDistrictsByRegion(regionId);
            setAvailableDistricts(districts);
            
            const district = findDistrictByName(location.district, regionId);
            if (district) {
              setSelectedDistrictsState([district.id]);
            }
          }
          
          markLocationDetected();
        } catch (error) {
          console.error('Location detection failed:', error);
        } finally {
          setIsDetecting(false);
        }
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
    }
  };

  const setSelectedDistricts = (districts: string[]) => {
    setSelectedDistrictsState(districts);
  };

  const toggleDistrict = (districtId: string) => {
    if (districtId === 'all') {
      setSelectedDistrictsState([]);
      return;
    }

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
      let location = await detectLocationByBrowser();
      
      // Если браузерная геолокация не работает, используем IP
      if (location.city === 'Не определен' || location.source === 'default') {
        console.log('Browser geolocation failed, trying IP detection...');
        location = await detectLocationByIP();
      }
      
      console.log('Location detected:', location);
      
      // Если district это ID района, получаем регион из него
      let regionId = 'all';
      let districtToSelect = null;
      
      if (location.district && location.district !== 'Все районы') {
        // Проверяем, является ли district ID-ом района
        const districtData = DISTRICTS.find(d => d.id === location.district);
        if (districtData) {
          regionId = districtData.regionId;
          districtToSelect = districtData;
          console.log('Found district by ID:', districtData);
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
      
      console.log('Selected region ID:', regionId);
      
      if (regionId !== 'all') {
        setSelectedRegionState(regionId);
        setDetectedCity(location.city);
        saveLocationToStorage(location);
        
        const districts = getDistrictsByRegion(regionId);
        setAvailableDistricts(districts);
        
        if (districtToSelect) {
          setSelectedDistrictsState([districtToSelect.id]);
          console.log('Selected district:', districtToSelect.name);
        }
      } else {
        console.log('Could not determine region from location:', location);
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
      detectedCity
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