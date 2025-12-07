import { useState } from 'react';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

interface TradingPlatformFiltersProps {
  searchQuery: string;
  selectedType: string;
  selectedCategory: string;
  onSearchChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
}

export default function TradingPlatformFilters({
  searchQuery,
  selectedType,
  selectedCategory,
  onSearchChange,
  onTypeChange,
  onCategoryChange,
}: TradingPlatformFiltersProps) {
  const [categorySearch, setCategorySearch] = useState('');
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [typeSearch, setTypeSearch] = useState('');
  const [isTypeOpen, setIsTypeOpen] = useState(false);

  return (
    <div className="flex gap-4 mb-6">
      <div className="flex-1">
        <Input
          placeholder="Поиск по контрактам..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full"
        />
      </div>
      
      <div className="w-[180px] relative">
        <div className="relative">
          <Input
            value={isTypeOpen ? typeSearch : (selectedType === 'all' ? 'Все типы' : selectedType === 'futures' ? 'Фьючерсы' : 'Форварды')}
            onChange={(e) => setTypeSearch(e.target.value)}
            onFocus={() => setIsTypeOpen(true)}
            placeholder="Тип контракта"
            className="pr-8"
            readOnly={!isTypeOpen}
          />
          <button
            type="button"
            onClick={() => setIsTypeOpen(!isTypeOpen)}
            className="absolute right-2 top-1/2 -translate-y-1/2"
          >
            <Icon name={isTypeOpen ? "ChevronUp" : "ChevronDown"} className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        
        {isTypeOpen && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsTypeOpen(false)}
            />
            <div className="absolute z-20 w-full mt-1 max-h-60 overflow-auto bg-background border border-input rounded-md shadow-lg">
              {[{value: 'all', label: 'Все типы'}, {value: 'futures', label: 'Фьючерсы'}, {value: 'forward', label: 'Форварды'}]
                .filter(opt => opt.label.toLowerCase().includes(typeSearch.toLowerCase()))
                .map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onTypeChange(option.value);
                      setIsTypeOpen(false);
                      setTypeSearch('');
                    }}
                    className={`w-full text-left px-3 py-2 hover:bg-accent transition-colors ${
                      selectedType === option.value ? 'bg-accent font-medium' : ''
                    }`}
                  >
                    {option.label}
                  </button>
                ))
              }
            </div>
          </>
        )}
      </div>
      
      <div className="w-[200px] relative">
        <div className="relative">
          <Input
            value={isCategoryOpen ? categorySearch : (
              selectedCategory === 'all' ? 'Все категории' :
              selectedCategory === 'agriculture' ? 'Сельское хозяйство' :
              selectedCategory === 'food' ? 'Продукты питания' :
              selectedCategory === 'materials' ? 'Стройматериалы' :
              selectedCategory === 'services' ? 'Услуги' : 'Прочее'
            )}
            onChange={(e) => setCategorySearch(e.target.value)}
            onFocus={() => setIsCategoryOpen(true)}
            placeholder="Категория"
            className="pr-8"
            readOnly={!isCategoryOpen}
          />
          <button
            type="button"
            onClick={() => setIsCategoryOpen(!isCategoryOpen)}
            className="absolute right-2 top-1/2 -translate-y-1/2"
          >
            <Icon name={isCategoryOpen ? "ChevronUp" : "ChevronDown"} className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        
        {isCategoryOpen && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsCategoryOpen(false)}
            />
            <div className="absolute z-20 w-full mt-1 max-h-60 overflow-auto bg-background border border-input rounded-md shadow-lg">
              {[
                {value: 'all', label: 'Все категории'},
                {value: 'agriculture', label: 'Сельское хозяйство'},
                {value: 'food', label: 'Продукты питания'},
                {value: 'materials', label: 'Стройматериалы'},
                {value: 'services', label: 'Услуги'},
                {value: 'other', label: 'Прочее'}
              ]
                .filter(opt => opt.label.toLowerCase().includes(categorySearch.toLowerCase()))
                .map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onCategoryChange(option.value);
                      setIsCategoryOpen(false);
                      setCategorySearch('');
                    }}
                    className={`w-full text-left px-3 py-2 hover:bg-accent transition-colors ${
                      selectedCategory === option.value ? 'bg-accent font-medium' : ''
                    }`}
                  >
                    {option.label}
                  </button>
                ))
              }
            </div>
          </>
        )}
      </div>
    </div>
  );
}
