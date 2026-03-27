import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import TradingPlatformFilters from '@/components/trading/TradingPlatformFilters';

interface TradingPlatformHeaderProps {
  selectedType: string;
  searchQuery: string;
  selectedCategory: string;
  onSearchChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onShowBarterInfo: () => void;
  onShowForwardInfo: () => void;
  onCreateContract: () => void;
}

export default function TradingPlatformHeader({
  selectedType,
  searchQuery,
  selectedCategory,
  onSearchChange,
  onTypeChange,
  onCategoryChange,
  onShowBarterInfo,
  onShowForwardInfo,
  onCreateContract,
}: TradingPlatformHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Торговая площадка</h1>
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-muted-foreground">
              {selectedType === 'barter'
                ? 'Бартерные контракты для верифицированных участников'
                : selectedType === 'forward'
                ? 'Доступ — только верифицированным.'
                : selectedType === 'forward-request'
                ? 'Запросы на закупку для верифицированных участников'
                : 'Доступ — только верифицированным.'}
            </p>
            {selectedType === 'barter' ? (
              <button
                onClick={onShowBarterInfo}
                className="flex items-center gap-1 text-sm text-primary hover:underline underline-offset-2 shrink-0"
              >
                <Icon name="BookOpen" size={14} />
                Что такое бартерные контракты?
              </button>
            ) : (
              <button
                onClick={onShowForwardInfo}
                className="flex items-center gap-1 text-sm text-primary hover:underline underline-offset-2 shrink-0"
              >
                <Icon name="BookOpen" size={14} />
                Что такое форвардные контракты?
              </button>
            )}
          </div>
        </div>
        <Button onClick={onCreateContract} size="lg">
          <Icon name="Plus" className="mr-2 h-4 w-4" />
          Создать контракт
        </Button>
      </div>

      <TradingPlatformFilters
        searchQuery={searchQuery}
        selectedType={selectedType}
        selectedCategory={selectedCategory}
        onSearchChange={onSearchChange}
        onTypeChange={onTypeChange}
        onCategoryChange={onCategoryChange}
      />
    </div>
  );
}