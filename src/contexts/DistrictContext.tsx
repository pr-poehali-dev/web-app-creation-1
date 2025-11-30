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