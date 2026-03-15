import { useState, useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import Icon from '@/components/ui/icon';
import { useDistrict } from '@/contexts/DistrictContext';
import { DISTRICTS } from '@/data/districts';
import type { TransportWaypoint } from '@/types/offer';
import { formatCityName } from './transportConstants';

interface AddDistrictRowProps {
  district: { id: string; name: string };
  priceType: string;
  originName?: string;
  onAdd: (price: string) => void;
}

function AddDistrictRow({ district, priceType, originName, onAdd }: AddDistrictRowProps) {
  const [price, setPrice] = useState('');
  const routeLabel = originName ? `${originName} — ${district.name}` : district.name;
  return (
    <div className="flex items-center gap-1.5">
      <Input
        type="number"
        placeholder="Цена ₽"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className="h-7 text-xs w-28"
        min="0"
      />
      <span className="text-xs text-muted-foreground flex-1">{routeLabel} / {priceType || 'место'}</span>
      <button
        type="button"
        onClick={() => { if (price && Number(price) > 0) onAdd(price); }}
        disabled={!price || Number(price) <= 0}
        className="h-7 w-7 rounded border flex items-center justify-center text-sm font-bold text-primary border-primary hover:bg-primary/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        title="Добавить"
      >+</button>
    </div>
  );
}

interface TransportDistrictSectionProps {
  formData: {
    district: string;
    availableDistricts: string[];
    transportAllDistricts: boolean;
    transportPriceType: string;
  };
  transportWaypoints: TransportWaypoint[];
  onInputChange: (field: string, value: string | boolean) => void;
  onDistrictToggle: (districtId: string) => void;
  onAddWaypoint?: (districtId: string, districtName: string) => void;
  onRemoveWaypoint?: (districtId: string) => void;
  onWaypointPriceChange?: (districtId: string, price: string) => void;
}

export default function TransportDistrictSection({
  formData,
  transportWaypoints,
  onInputChange,
  onDistrictToggle,
  onAddWaypoint,
  onRemoveWaypoint,
  onWaypointPriceChange,
}: TransportDistrictSectionProps) {
  const { detectedDistrictId } = useDistrict();
  const [districtInput, setDistrictInput] = useState('');
  const [showAdditional, setShowAdditional] = useState(false);
  const [showWaypoints, setShowWaypoints] = useState(false);
  const [newWaypointFrom, setNewWaypointFrom] = useState('');
  const [newWaypointTo, setNewWaypointTo] = useState('');
  const [newWaypointPrice, setNewWaypointPrice] = useState('');

  useEffect(() => {
    const autoDistrict = formData.district || detectedDistrictId || '';
    if (autoDistrict && !formData.district) {
      onInputChange('district', autoDistrict);
    }
    const found = DISTRICTS.find(d => d.id === (formData.district || autoDistrict));
    if (found) setDistrictInput(found.name);
  }, [detectedDistrictId]);

  useEffect(() => {
    const found = DISTRICTS.find(d => d.id === formData.district);
    if (found) setDistrictInput(found.name);
  }, [formData.district]);

  const filteredDistricts = useMemo(() => {
    if (!districtInput || districtInput.length < 1) return [];
    const current = DISTRICTS.find(d => d.id === formData.district);
    if (current && districtInput === current.name) return [];
    return DISTRICTS.filter(d =>
      d.name.toLowerCase().includes(districtInput.toLowerCase()) && d.id !== 'all'
    ).slice(0, 6);
  }, [districtInput, formData.district]);

  const additionalDistricts = useMemo(() => {
    if (!formData.district) return [];
    const current = DISTRICTS.find(d => d.id === formData.district);
    if (!current) return [];
    return DISTRICTS.filter(d => d.regionId === current.regionId && d.id !== 'all' && d.id !== formData.district);
  }, [formData.district]);

  return (
    <>
      <div className="space-y-3">
        <Label>Районы обслуживания</Label>
        <div className="space-y-2">
          <Label htmlFor="district" className="text-xs text-muted-foreground font-normal">Основной район *</Label>
          <div className="relative">
            <Input
              id="district"
              value={districtInput}
              onChange={(e) => {
                const value = e.target.value;
                setDistrictInput(value);
                const matched = DISTRICTS.find(d => d.name.toLowerCase() === value.toLowerCase() && d.id !== 'all');
                if (matched) onInputChange('district', matched.id);
              }}
              placeholder="Начните вводить название района..."
              className="text-sm"
            />
            {filteredDistricts.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-md">
                {filteredDistricts.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors flex items-center gap-2"
                    onClick={() => {
                      setDistrictInput(d.name);
                      onInputChange('district', d.id);
                    }}
                  >
                    <Icon name="MapPin" className="h-4 w-4 text-muted-foreground" />
                    {d.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <button
              type="button"
              onClick={() => setShowAdditional(v => !v)}
              className="flex items-center gap-1 text-xs md:text-sm font-bold text-green-500 hover:text-green-600 transition-colors mt-1"
            >
              <Icon name={showAdditional ? 'ChevronUp' : 'ChevronDown'} size={14} />
              {showAdditional ? 'Скрыть дополнительные районы' : 'Дополнительные районы в регионе'}
              {formData.availableDistricts.length > 0 && (
                <span className="ml-1 text-primary font-medium">({formData.availableDistricts.length} выбрано)</span>
              )}
            </button>
            {showAdditional && (
              <div className="mt-2 space-y-2">
                {additionalDistricts.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Сначала выберите основной район</p>
                ) : (
                  <div className="space-y-1.5">
                    {additionalDistricts.map(d => {
                      const checked = formData.availableDistricts.includes(d.id);
                      return (
                        <div key={d.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`district-${d.id}`}
                            checked={checked}
                            onCheckedChange={() => onDistrictToggle(d.id)}
                          />
                          <label htmlFor={`district-${d.id}`} className="text-sm cursor-pointer">{d.name}</label>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setShowWaypoints(v => !v)}
          className="flex items-center gap-1 text-xs md:text-sm font-bold text-green-500 hover:text-green-600 transition-colors"
        >
          <Icon name={showWaypoints ? 'ChevronUp' : 'ChevronDown'} size={14} />
          {showWaypoints ? 'Скрыть промежуточные маршруты' : 'Дополнительные маршруты по пути'}
          {transportWaypoints.length > 0 && (
            <span className="ml-1 text-primary font-medium">({transportWaypoints.length})</span>
          )}
        </button>
        {showWaypoints && (
          <div className="space-y-2 pt-1">
            {transportWaypoints.length > 0 && (
              <div className="space-y-1.5">
                {transportWaypoints.map((wp) => (
                  <div key={wp.id} className="flex items-center gap-1.5 bg-muted/40 rounded-md px-2 py-1.5">
                    <span className="text-xs flex-1 font-medium">{wp.address}</span>
                    <Input
                      type="number"
                      placeholder="Цена ₽"
                      value={wp.price ?? ''}
                      onChange={(e) => onWaypointPriceChange?.(wp.id, e.target.value)}
                      className="h-7 text-xs w-24"
                      min="0"
                    />
                    <span className="text-xs text-muted-foreground">₽</span>
                    <button
                      type="button"
                      onClick={() => onRemoveWaypoint?.(wp.id)}
                      className="text-xs text-destructive hover:text-destructive/80 px-1"
                      title="Удалить"
                    >✕</button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Input
                placeholder="Откуда"
                value={newWaypointFrom}
                onChange={(e) => setNewWaypointFrom(e.target.value)}
                onBlur={(e) => setNewWaypointFrom(formatCityName(e.target.value))}
                className="h-8 text-xs"
              />
              <span className="text-muted-foreground text-xs">→</span>
              <Input
                placeholder="Куда"
                value={newWaypointTo}
                onChange={(e) => setNewWaypointTo(e.target.value)}
                onBlur={(e) => setNewWaypointTo(formatCityName(e.target.value))}
                className="h-8 text-xs"
              />
              <Input
                type="number"
                placeholder="Цена ₽"
                value={newWaypointPrice}
                onChange={(e) => setNewWaypointPrice(e.target.value)}
                className="h-8 text-xs w-24"
                min="0"
              />
              <button
                type="button"
                disabled={!newWaypointFrom || !newWaypointTo || !newWaypointPrice}
                onClick={() => {
                  const label = `${formatCityName(newWaypointFrom)} - ${formatCityName(newWaypointTo)}`;
                  const id = `wp-${Date.now()}`;
                  onAddWaypoint?.(id, label);
                  setTimeout(() => {
                    onWaypointPriceChange?.(id, newWaypointPrice);
                  }, 0);
                  setNewWaypointFrom('');
                  setNewWaypointTo('');
                  setNewWaypointPrice('');
                }}
                className="h-8 w-8 rounded border flex items-center justify-center text-sm font-bold text-primary border-primary hover:bg-primary/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >+</button>
            </div>
            <p className="text-xs text-muted-foreground">Например: Нюрба → Вилюйск, 3000 ₽</p>
          </div>
        )}
      </div>
    </>
  );
}
