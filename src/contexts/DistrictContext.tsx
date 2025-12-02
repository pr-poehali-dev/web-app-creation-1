import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { detectLocationByIP, detectLocationByBrowser, isFirstVisit, markLocationDetected, getLocationFromStorage, saveLocationToStorage } from '@/utils/geolocation';
import { REGIONS, FEDERAL_DISTRICTS, findRegionByLocation, type Region } from '@/data/regions';

export interface District {
  id: string;
  name: string;
}

interface DistrictContextType {
  selectedDistrict: string;
  setSelectedDistrict: (district: string) => void;
  selectedDistricts: string[];
  setSelectedDistricts: (districts: string[]) => void;
  toggleDistrict: (districtId: string) => void;
  districts: District[];
  isDetecting: boolean;
  requestGeolocation: () => Promise<void>;
}

const DistrictContext = createContext<DistrictContextType | undefined>(undefined);

const ALL_DISTRICTS: District[] = [
  { id: 'all', name: 'Все регионы' },
  ...REGIONS.map(region => ({
    id: region.id,
    name: region.name
  }))
];

export function DistrictProvider({ children }: { children: ReactNode }) {
  const [selectedDistrict, setSelectedDistrictState] = useState<string>('all');
  const [selectedDistricts, setSelectedDistrictsState] = useState<string[]>(() => {
    const stored = localStorage.getItem('selectedDistricts');
    return stored ? JSON.parse(stored) : [];
  });
  const [isDetecting, setIsDetecting] = useState(false);

  useEffect(() => {
    const initLocation = async () => {
      const storedLocation = getLocationFromStorage();
      
      if (storedLocation) {
        const regionId = findRegionByLocation(storedLocation.city, storedLocation.district);
        setSelectedDistrictState(regionId);
        if (regionId !== 'all') {
          setSelectedDistrictsState([regionId]);
        }
        return;
      }

      const storedDistrict = localStorage.getItem('selectedDistrict');
      if (storedDistrict) {
        setSelectedDistrictState(storedDistrict);
        return;
      }

      if (isFirstVisit()) {
        setIsDetecting(true);
        try {
          const location = await detectLocationByIP();
          const regionId = findRegionByLocation(location.city, location.district);
          
          if (regionId !== 'all') {
            setSelectedDistrictState(regionId);
            setSelectedDistrictsState([regionId]);
            saveLocationToStorage(location);
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
    if (selectedDistrict !== 'all') {
      localStorage.setItem('selectedDistrict', selectedDistrict);
    }
  }, [selectedDistrict]);

  useEffect(() => {
    localStorage.setItem('selectedDistricts', JSON.stringify(selectedDistricts));
  }, [selectedDistricts]);

  const setSelectedDistrict = (district: string) => {
    setSelectedDistrictState(district);
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
      const location = await detectLocationByBrowser();
      const regionId = findRegionByLocation(location.city, location.district);
      
      if (regionId !== 'all') {
        setSelectedDistrictState(regionId);
        setSelectedDistrictsState([regionId]);
        saveLocationToStorage(location);
      }
    } catch (error) {
      console.error('Browser geolocation failed:', error);
    } finally {
      setIsDetecting(false);
    }
  };

  return (
    <DistrictContext.Provider value={{ 
      selectedDistrict, 
      setSelectedDistrict, 
      selectedDistricts, 
      setSelectedDistricts, 
      toggleDistrict,
      districts: ALL_DISTRICTS, 
      isDetecting, 
      requestGeolocation 
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
