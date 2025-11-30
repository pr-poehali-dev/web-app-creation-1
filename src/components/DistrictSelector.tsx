import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useDistrict } from '@/contexts/DistrictContext';

interface DistrictSelectorProps {
  className?: string;
  showLabel?: boolean;
}

export default function DistrictSelector({ className = '', showLabel = true }: DistrictSelectorProps) {
  const { selectedDistrict, setSelectedDistrict, districts } = useDistrict();

  const currentDistrict = districts.find(d => d.id === selectedDistrict);

  return (
    <div className={className}>
      {showLabel && <Label htmlFor="district-select" className="mb-2 block">Район</Label>}
      <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
        <SelectTrigger id="district-select" className="w-full">
          <div className="flex items-center gap-2">
            <Icon name="MapPin" className="h-4 w-4 text-muted-foreground" />
            <SelectValue>
              {currentDistrict?.name || 'Выберите район'}
            </SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent>
          {districts.map((district) => (
            <SelectItem key={district.id} value={district.id}>
              <div className="flex items-center gap-2">
                {district.id === 'all' && <Icon name="Globe" className="h-4 w-4" />}
                {district.id !== 'all' && <Icon name="MapPin" className="h-4 w-4" />}
                <span>{district.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
