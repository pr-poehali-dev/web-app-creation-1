import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { detectLocationByIP, detectLocationByBrowser, isFirstVisit, markLocationDetected, getLocationFromStorage, saveLocationToStorage } from '@/utils/geolocation';

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

const DISTRICTS: District[] = [
  { id: 'all', name: 'Все районы' },
  { id: 'yakutsk', name: 'г. Якутск' },
  { id: 'aldan', name: 'Алданский улус' },
  { id: 'amga', name: 'Амгинский улус' },
  { id: 'anabar', name: 'Анабарский улус' },
  { id: 'bulun', name: 'Булунский улус' },
  { id: 'verkhnekolymsk', name: 'Верхнеколымский улус' },
  { id: 'verkhnevilyuisk', name: 'Верхневилюйский улус' },
  { id: 'verkhoyansk', name: 'Верхоянский улус' },
  { id: 'vilyuisk', name: 'Вилюйский улус' },
  { id: 'gorny', name: 'Горный улус' },
  { id: 'zhigansky', name: 'Жиганский улус' },
  { id: 'kobyai', name: 'Кобяйский улус' },
  { id: 'lensk', name: 'Ленский улус' },
  { id: 'megino-kangalassky', name: 'Мегино-Кангаласский улус' },
  { id: 'mirny', name: 'Мирнинский улус' },
  { id: 'momsky', name: 'Момский улус' },
  { id: 'namsky', name: 'Намский улус' },
  { id: 'neryungri', name: 'Нерюнгринский улус' },
  { id: 'nizhnekolymsk', name: 'Нижнеколымский улус' },
  { id: 'nyurbinsky', name: 'Нюрбинский улус' },
  { id: 'oymyakon', name: 'Оймяконский улус' },
  { id: 'olekminsk', name: 'Олёкминский улус' },
  { id: 'ust-aldan', name: 'Усть-Алданский улус' },
  { id: 'ust-maya', name: 'Усть-Майский улус' },
  { id: 'ust-yan', name: 'Усть-Янский улус' },
  { id: 'khangalassky', name: 'Хангаласский улус' },
  { id: 'churapcha', name: 'Чурапчинский улус' },
  { id: 'eveno-bytantai', name: 'Эвено-Бытантайский улус' },
];

const DISTRICT_KEYWORDS: Record<string, string[]> = {
  'yakutsk': ['якутск', 'yakutsk'],
  'aldan': ['алдан', 'aldan', 'алданский'],
  'amga': ['амга', 'amga', 'амгинский'],
  'anabar': ['анабар', 'anabar', 'анабарский'],
  'bulun': ['булун', 'bulun', 'тикси', 'tiksi', 'булунский'],
  'verkhnekolymsk': ['верхнеколымск', 'verkhnekolymsk', 'верхнеколымский'],
  'verkhnevilyuisk': ['верхневилюйск', 'verkhnevilyuisk', 'верхневилюйский'],
  'verkhoyansk': ['верхоянск', 'verkhoyansk', 'верхоянский'],
  'vilyuisk': ['вилюйск', 'vilyuisk', 'вилюйский'],
  'gorny': ['горный', 'gorny', 'бердигестях', 'berdigestyakh'],
  'zhigansky': ['жиганск', 'zhigansky', 'жиганский'],
  'kobyai': ['кобяй', 'kobyai', 'сангар', 'sangar', 'кобяйский'],
  'lensk': ['ленск', 'lensk', 'ленский'],
  'megino-kangalassky': ['мегино-кангаласский', 'megino-kangalassky', 'майя', 'maya'],
  'mirny': ['мирный', 'mirny', 'мирнинский'],
  'momsky': ['момский', 'momsky', 'хонуу', 'khonuu'],
  'namsky': ['намский', 'namsky'],
  'neryungri': ['нерюнгри', 'neryungri', 'нерюнгринский'],
  'nizhnekolymsk': ['нижнеколымск', 'nizhnekolymsk', 'черский', 'chersky', 'нижнеколымский'],
  'nyurbinsky': ['нюрбинский', 'nyurbinsky', 'нюрба', 'nyurba'],
  'oymyakon': ['оймякон', 'oymyakon', 'оймяконский'],
  'olekminsk': ['олёкминск', 'olekminsk', 'олёкминский'],
  'ust-aldan': ['усть-алданский', 'ust-aldan', 'усть-алдан'],
  'ust-maya': ['усть-майский', 'ust-maya', 'усть-мая'],
  'ust-yan': ['усть-янский', 'ust-yan', 'усть-яна'],
  'khangalassky': ['хангаласский', 'khangalassky', 'покровск', 'pokrovsk'],
  'churapcha': ['чурапчинский', 'churapcha', 'чурапча'],
  'eveno-bytantai': ['эвено-бытантайский', 'eveno-bytantai', 'батагай-алыта', 'batagay-alyta'],
};

function findDistrictByLocation(city: string, district: string): string {
  const searchText = `${city} ${district}`.toLowerCase();
  
  for (const [districtId, keywords] of Object.entries(DISTRICT_KEYWORDS)) {
    for (const keyword of keywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        return districtId;
      }
    }
  }
  
  return 'all';
}

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
        const districtId = findDistrictByLocation(storedLocation.city, storedLocation.district);
        setSelectedDistrictState(districtId);
        if (districtId !== 'all') {
          setSelectedDistrictsState([districtId]);
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
          const districtId = findDistrictByLocation(location.city, location.district);
          
          if (districtId !== 'all') {
            setSelectedDistrictState(districtId);
            setSelectedDistrictsState([districtId]);
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
      const districtId = findDistrictByLocation(location.city, location.district);
      
      if (districtId !== 'all') {
        setSelectedDistrictState(districtId);
        setSelectedDistrictsState([districtId]);
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
      districts: DISTRICTS, 
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