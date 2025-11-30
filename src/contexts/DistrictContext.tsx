import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface District {
  id: string;
  name: string;
}

interface DistrictContextType {
  selectedDistrict: string;
  setSelectedDistrict: (district: string) => void;
  districts: District[];
}

const DistrictContext = createContext<DistrictContextType | undefined>(undefined);

const DISTRICTS: District[] = [
  { id: 'all', name: 'Все районы' },
  { id: 'central', name: 'Центральный район' },
  { id: 'northern', name: 'Северный район' },
  { id: 'southern', name: 'Южный район' },
  { id: 'eastern', name: 'Восточный район' },
  { id: 'western', name: 'Западный район' },
  { id: 'industrial', name: 'Промышленный район' },
  { id: 'zavolzhsky', name: 'Заволжский район' },
  { id: 'sovetsky', name: 'Советский район' },
];

export function DistrictProvider({ children }: { children: ReactNode }) {
  const [selectedDistrict, setSelectedDistrictState] = useState<string>(() => {
    const stored = localStorage.getItem('selectedDistrict');
    return stored || 'all';
  });

  useEffect(() => {
    localStorage.setItem('selectedDistrict', selectedDistrict);
  }, [selectedDistrict]);

  const setSelectedDistrict = (district: string) => {
    setSelectedDistrictState(district);
  };

  return (
    <DistrictContext.Provider value={{ selectedDistrict, setSelectedDistrict, districts: DISTRICTS }}>
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
