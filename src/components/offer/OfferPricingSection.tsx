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
    noNegotiation?: boolean;
    category?: string;
    deadline?: string;
    deadlineStart?: string;
    deadlineEnd?: string;
    negotiableDeadline?: boolean;
    budget?: string;
    negotiableBudget?: boolean;
  };
  onInputChange: (field: string, value: string | boolean) => void;
}

export default function OfferPricingSection({ formData, onInputChange }: OfferPricingSectionProps) {
  const isService = formData.category === 'utilities';
  const [isUnitOpen, setIsUnitOpen] = useState(false);
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

  const selectedUnit = unitOptions.find(opt => opt.value === formData.unit);

  const handleSelectUnit = (value: string) => {
    onInputChange('unit', value);
    setIsUnitOpen(false);
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
        <CardTitle>{isService ? 'Сроки и бюджет' : 'Цена и количество'}</CardTitle>
        {!isService && (
          <CardDescription>
            Укажите доступное количество и цену товара
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {isService ? (
          <>
            <div className="space-y-4">
              <div>
                <Label>Срок работы *</Label>
                <div className="grid md:grid-cols-2 gap-4 mt-2">
                  <div>
                    <Label htmlFor="deadlineStart" className="text-sm text-muted-foreground">Начало</Label>
                    <Input
                      id="deadlineStart"
                      type="date"
                      value={formData.deadlineStart || ''}
                      onChange={(e) => onInputChange('deadlineStart', e.target.value)}
                      required={!formData.negotiableDeadline}
                      disabled={formData.negotiableDeadline}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <Label htmlFor="deadlineEnd" className="text-sm text-muted-foreground">Окончание</Label>
                    <Input
                      id="deadlineEnd"
                      type="date"
                      value={formData.deadlineEnd || ''}
                      onChange={(e) => onInputChange('deadlineEnd', e.target.value)}
                      required={!formData.negotiableDeadline}
                      disabled={formData.negotiableDeadline}
                      min={formData.deadlineStart || new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <Checkbox
                    id="negotiableDeadline"
                    checked={formData.negotiableDeadline || false}
                    onCheckedChange={(checked) => {
                      onInputChange('negotiableDeadline', checked as boolean);
                      if (checked) {
                        onInputChange('deadlineStart', '');
                        onInputChange('deadlineEnd', '');
                      }
                    }}
                  />
                  <label
                    htmlFor="negotiableDeadline"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Ваши предложения
                  </label>
                </div>
              </div>

              <div>
                <Label htmlFor="budget">Бюджет для оплаты (₽) *</Label>
                <Input
                  id="budget"
                  type="number"
                  value={formData.budget || ''}
                  onChange={(e) => onInputChange('budget', e.target.value)}
                  placeholder="0"
                  required={!formData.negotiableBudget}
                  min="0"
                  step="0.01"
                  disabled={formData.negotiableBudget}
                />
                <div className="flex items-center space-x-2 mt-2">
                  <Checkbox
                    id="negotiableBudget"
                    checked={formData.negotiableBudget || false}
                    onCheckedChange={(checked) => {
                      onInputChange('negotiableBudget', checked as boolean);
                      if (checked) onInputChange('budget', '');
                    }}
                  />
                  <label
                    htmlFor="negotiableBudget"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Ваша цена (Торг)
                  </label>
                </div>
              </div>
            </div>
          </>
        ) : (
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
        )}

        {!isService && (
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
        )}
      </CardContent>
    </Card>
  );
}