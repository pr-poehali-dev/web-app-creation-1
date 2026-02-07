import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import Icon from '@/components/ui/icon';

interface OfferPricingSectionProps {
  formData: {
    quantity: string;
    minOrderQuantity: string;
    unit: string;
    pricePerUnit: string;
    hasVAT: boolean;
    vatRate: string;
    noNegotiation?: boolean;
  };
  onInputChange: (field: string, value: string | boolean) => void;
}

export default function OfferPricingSection({ formData, onInputChange }: OfferPricingSectionProps) {
  const [isUnitOpen, setIsUnitOpen] = useState(false);
  const [isVatRateOpen, setIsVatRateOpen] = useState(false);
  const [minQuantityError, setMinQuantityError] = useState<string>('');
  
  const unitOptions = [
    { value: 'шт', label: 'шт' },
    { value: 'кг', label: 'кг' },
    { value: 'т', label: 'т' },
    { value: 'м', label: 'м' },
    { value: 'м²', label: 'м²' },
    { value: 'м³', label: 'м³' },
    { value: 'л', label: 'л' },
    { value: 'упак', label: 'упак' },
    { value: 'кВт·ч', label: 'кВт·ч' }
  ];

  const vatOptions = [
    { value: '0', label: '0%' },
    { value: '10', label: '10%' },
    { value: '20', label: '20%' }
  ];

  const selectedUnit = unitOptions.find(opt => opt.value === formData.unit);
  const selectedVatRate = vatOptions.find(opt => opt.value === formData.vatRate);

  const handleSelectUnit = (value: string) => {
    onInputChange('unit', value);
    setIsUnitOpen(false);
  };

  const handleSelectVatRate = (value: string) => {
    onInputChange('vatRate', value);
    setIsVatRateOpen(false);
  };

  const handleMinQuantityChange = (value: string) => {
    onInputChange('minOrderQuantity', value);
    
    const minQty = parseFloat(value);
    const totalQty = parseFloat(formData.quantity);
    
    if (value && !isNaN(minQty) && !isNaN(totalQty)) {
      if (minQty > totalQty) {
        setMinQuantityError(`Минимальное количество не может быть больше общего количества (${formData.quantity} ${formData.unit})`);
      } else if (minQty < 0.01) {
        setMinQuantityError('Минимальное количество должно быть больше 0');
      } else {
        setMinQuantityError('');
      }
    } else {
      setMinQuantityError('');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Цена и количество</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="quantity">Доступное количество *</Label>
            <Input
              id="quantity"
              type="number"
              value={formData.quantity}
              onChange={(e) => onInputChange('quantity', e.target.value)}
              placeholder="0"
              required
              min="0.01"
              step="0.01"
            />
          </div>

          <div>
            <Label htmlFor="minOrderQuantity">Мин. количество заказа</Label>
            <Input
              id="minOrderQuantity"
              type="number"
              value={formData.minOrderQuantity}
              onChange={(e) => handleMinQuantityChange(e.target.value)}
              onBlur={(e) => {
                const value = parseFloat(e.target.value);
                const totalQty = parseFloat(formData.quantity);
                if (!isNaN(value) && !isNaN(totalQty) && value > totalQty) {
                  onInputChange('minOrderQuantity', formData.quantity);
                  setMinQuantityError('');
                }
              }}
              placeholder="0"
              min="0.01"
              max={formData.quantity}
              step="0.01"
              className={minQuantityError ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {minQuantityError && (
              <div className="flex items-center gap-1 mt-1">
                <Icon name="XCircle" size={12} className="text-red-500" />
                <p className="text-xs text-red-500 font-medium">{minQuantityError}</p>
              </div>
            )}
          </div>

          <div className="relative">
            <Label htmlFor="unit">Единица измерения *</Label>
            <div className="relative">
              <Input
                id="unit"
                value={selectedUnit?.label || ''}
                onFocus={() => setIsUnitOpen(true)}
                placeholder="Выберите единицу..."
                className="pr-8"
                readOnly
                required
              />
              <button
                type="button"
                onClick={() => setIsUnitOpen(!isUnitOpen)}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                <Icon name={isUnitOpen ? "ChevronUp" : "ChevronDown"} className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            
            {isUnitOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsUnitOpen(false)}
                />
                <div className="absolute z-20 w-full mt-1 max-h-60 overflow-auto bg-background border border-input rounded-md shadow-lg">
                  {unitOptions.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSelectUnit(option.value)}
                      className={`w-full text-left px-3 py-2 hover:bg-accent transition-colors ${
                        formData.unit === option.value ? 'bg-accent font-medium' : ''
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div>
            <Label htmlFor="pricePerUnit">Цена за единицу (₽) *</Label>
            <Input
              id="pricePerUnit"
              type="number"
              value={formData.pricePerUnit}
              onChange={(e) => onInputChange('pricePerUnit', e.target.value)}
              placeholder="0"
              required
              min="0"
              step="0.01"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-start space-x-2">
            <Checkbox
              id="noNegotiation"
              checked={formData.noNegotiation || false}
              onCheckedChange={(checked) => onInputChange('noNegotiation', checked as boolean)}
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="noNegotiation"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Без торга
              </label>
              <p className="text-xs text-muted-foreground">
                Цена фиксирована, переговоры не предусмотрены
              </p>
            </div>
          </div>
        </div>

        {formData.hasVAT && (
          <div className="w-40 relative">
            <Label htmlFor="vatRate">Ставка НДС (%)</Label>
            <div className="relative">
              <Input
                id="vatRate"
                value={selectedVatRate?.label || ''}
                onFocus={() => setIsVatRateOpen(true)}
                placeholder="Выберите ставку НДС..."
                className="pr-8"
                readOnly
              />
              <button
                type="button"
                onClick={() => setIsVatRateOpen(!isVatRateOpen)}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                <Icon name={isVatRateOpen ? "ChevronUp" : "ChevronDown"} className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            
            {isVatRateOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsVatRateOpen(false)}
                />
                <div className="absolute z-20 w-full mt-1 max-h-60 overflow-auto bg-background border border-input rounded-md shadow-lg">
                  {vatOptions.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSelectVatRate(option.value)}
                      className={`w-full text-left px-3 py-2 hover:bg-accent transition-colors ${
                        formData.vatRate === option.value ? 'bg-accent font-medium' : ''
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {formData.quantity && formData.pricePerUnit && (
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-1">Общая стоимость</p>
            <p className="text-2xl font-bold text-primary">
              {(Number(formData.quantity) * Number(formData.pricePerUnit)).toLocaleString('ru-RU')} ₽
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}