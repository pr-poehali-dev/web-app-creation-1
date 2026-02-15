import AuctionSearchBlock from '@/components/auction/AuctionSearchBlock';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import type { SearchFilters } from '@/types/offer';
import type { District } from '@/types/district';

interface OffersFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onSearch: () => void;
  showOnlyMy: boolean;
  onShowOnlyMyChange: (value: boolean) => void;
  isAuthenticated: boolean;
  filteredOffersCount: number;
  premiumCount: number;
  selectedDistricts: string[];
  districts: District[];
  currentDistrictName?: string;
}

function OffersFilters({
  filters,
  onFiltersChange,
  onSearch,
  showOnlyMy,
  onShowOnlyMyChange,
  isAuthenticated,
  filteredOffersCount,
  premiumCount,
  selectedDistricts,
  districts,
  currentDistrictName,
}: OffersFiltersProps) {
  return (
    <>
      {filters.district !== 'all' && (
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Icon name="MapPin" className="h-5 w-5 text-primary" />
              <p className="text-sm">
                Район: <span className="font-semibold">{currentDistrictName}</span>
              </p>
              <span className="text-xs text-muted-foreground ml-auto">
                Показаны предложения, доступные в этом районе
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <AuctionSearchBlock
        filters={filters}
        onFiltersChange={onFiltersChange}
        onSearch={onSearch}
        placeholder="Поиск по предложениям..."
        label="Поиск предложений"
      />

      <div className="mb-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm flex-wrap">
            <span className="text-muted-foreground">Найдено:</span>
            <span className="font-semibold">{filteredOffersCount}</span>
            {filters.query && filters.query.length >= 2 && (
              <span className="text-muted-foreground">по "{filters.query}"</span>
            )}
            {premiumCount > 0 && (
              <>
                <span className="text-muted-foreground">•</span>
                <Icon name="Star" className="h-3.5 w-3.5 text-primary inline" />
                <span className="text-primary font-semibold">{premiumCount}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap text-xs">
            {isAuthenticated && (
              <div className="flex items-center gap-1.5 px-3 py-2 border-2 border-primary rounded-lg bg-primary/5">
                <Switch
                  id="show-only-my"
                  checked={showOnlyMy}
                  onCheckedChange={onShowOnlyMyChange}
                  className="scale-75"
                />
                <Label htmlFor="show-only-my" className="cursor-pointer text-foreground font-medium">
                  Ваши предложения цены
                </Label>
              </div>
            )}
            
            <span className="text-muted-foreground">
              Сортировка: <span className="font-medium text-foreground">Премиум + Новизна</span>
            </span>
          </div>
        </div>

        {filters.category && (
          <div className="mt-3 flex flex-wrap gap-2">
            {filters.category && (
              <span className="inline-flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium">
                <Icon name="Tag" className="h-3 w-3" />
                {filters.category}
              </span>
            )}
            {filters.subcategory && (
              <span className="inline-flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium">
                {filters.subcategory}
              </span>
            )}
            {selectedDistricts.length > 0 && (
              <>
                {selectedDistricts.slice(0, 3).map((districtId) => {
                  const district = districts.find(d => d.id === districtId);
                  return (
                    <span key={districtId} className="inline-flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium">
                      <Icon name="MapPin" className="h-3 w-3" />
                      {district?.name}
                    </span>
                  );
                })}
                {selectedDistricts.length > 3 && (
                  <span className="inline-flex items-center gap-1 bg-muted text-muted-foreground px-3 py-1 rounded-full text-xs font-medium">
                    +{selectedDistricts.length - 3} еще
                  </span>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default OffersFilters;