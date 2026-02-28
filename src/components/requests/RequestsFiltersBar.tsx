import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import type { SearchFilters } from '@/types/offer';
import { useDistrict } from '@/contexts/DistrictContext';

interface RequestsFiltersBarProps {
  filteredCount: number;
  filters: SearchFilters;
  isAuthenticated: boolean;
  showOnlyMy: boolean;
  onShowOnlyMyChange: (value: boolean) => void;
}

export default function RequestsFiltersBar({
  filteredCount,
  filters,
  isAuthenticated,
  showOnlyMy,
  onShowOnlyMyChange,
}: RequestsFiltersBarProps) {
  const { selectedDistricts, districts } = useDistrict();

  return (
    <div className="mb-3">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <span className="text-muted-foreground">Найдено:</span>
          <span className="font-semibold">{filteredCount}</span>
          {filters.query && filters.query.length >= 2 && (
            <span className="text-muted-foreground">по "{filters.query}"</span>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap text-xs">
          {isAuthenticated && (
            <div className="flex items-center gap-1.5 px-3 py-2 border-2 border-primary rounded-lg bg-primary/5">
              <Switch
                id="show-only-my-requests"
                checked={showOnlyMy}
                onCheckedChange={onShowOnlyMyChange}
                className="scale-75"
              />
              <Label htmlFor="show-only-my-requests" className="cursor-pointer text-foreground font-medium">
                Только мои
              </Label>
            </div>
          )}

          <span className="text-muted-foreground">
            Сортировка: <span className="font-medium text-foreground">Новизна</span>
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
  );
}
