import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import Icon from '@/components/ui/icon';

interface RequestPricingSectionProps {
  formData: {
    quantity: string;
    unit: string;
    pricePerUnit: string;
    hasVAT: boolean;
    vatRate: string;
    negotiableQuantity: boolean;
    negotiablePrice: boolean;
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

export default function RequestPricingSection({
  formData,
  onInputChange,
}: RequestPricingSectionProps) {
  const isService = formData.category === 'utilities';
  
  const totalBudget = !isService && formData.quantity && formData.pricePerUnit
    ? (Number(formData.quantity) * Number(formData.pricePerUnit)).toLocaleString('ru-RU')
    : null;

  const [isUnitOpen, setIsUnitOpen] = useState(false);
  const [isVatRateOpen, setIsVatRateOpen] = useState(false);
  
  const unitOptions = [
    { value: 'шт', label: 'шт' },
    { value: 'кг', label: 'кг' },
    { value: 'т', label: 'т' },
    { value: 'м', label: 'м' },
    { value: 'м²', label: 'м²' },
    { value: 'м³', label: 'м³' },
    { value: 'л', label: 'л' },
    { value: 'упак', label: 'упак' }
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isService ? 'Сроки и бюджет' : 'Количество и бюджет'}</CardTitle>
        <CardDescription>
          {isService 
            ? 'Укажите срок выполнения работ и бюджет'
            : 'Укажите требуемое количество и желаемую цену'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isService ? (
          <>
            <div className="space-y-4">
              <div>
                <Label>Срок работы *</Label>
                <div className="grid grid-cols-2 gap-2 sm:gap-4 mt-2">
                  <div>
                    <Label htmlFor="deadlineStart" className="text-xs sm:text-sm text-muted-foreground">Начало</Label>
                    <Input
                      id="deadlineStart"
                      type="date"
                      value={formData.deadlineStart || ''}
                      onChange={(e) => onInputChange('deadlineStart', e.target.value)}
                      required={!formData.negotiableDeadline}
                      disabled={formData.negotiableDeadline}
                      min={new Date().toISOString().split('T')[0]}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="deadlineEnd" className="text-xs sm:text-sm text-muted-foreground">Окончание</Label>
                    <Input
                      id="deadlineEnd"
                      type="date"
                      value={formData.deadlineEnd || ''}
                      onChange={(e) => onInputChange('deadlineEnd', e.target.value)}
                      required={!formData.negotiableDeadline}
                      disabled={formData.negotiableDeadline}
                      min={formData.deadlineStart || new Date().toISOString().split('T')[0]}
                      className="h-9 text-sm"
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
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="quantity">Требуемое количество *</Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => onInputChange('quantity', e.target.value)}
                placeholder="0"
                required={!formData.negotiableQuantity}
                min="0.01"
                step="0.01"
                disabled={formData.negotiableQuantity}
              />
              <div className="flex items-center space-x-2 mt-2">
                <Checkbox
                  id="negotiableQuantity"
                  checked={formData.negotiableQuantity}
                  onCheckedChange={(checked) => {
                    onInputChange('negotiableQuantity', checked as boolean);
                    if (checked) onInputChange('quantity', '');
                  }}
                />
                <label
                  htmlFor="negotiableQuantity"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Ваши предложения
                </label>
              </div>
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
              <Label htmlFor="pricePerUnit">Желаемая цена за единицу (₽) *</Label>
              <Input
                id="pricePerUnit"
                type="number"
                value={formData.pricePerUnit}
                onChange={(e) => onInputChange('pricePerUnit', e.target.value)}
                placeholder="0"
                required={!formData.negotiablePrice}
                min="0"
                step="0.01"
                disabled={formData.negotiablePrice}
              />
              <div className="flex items-center space-x-2 mt-2">
                <Checkbox
                  id="negotiablePrice"
                  checked={formData.negotiablePrice}
                  onCheckedChange={(checked) => {
                    onInputChange('negotiablePrice', checked as boolean);
                    if (checked) onInputChange('pricePerUnit', '');
                  }}
                />
                <label
                  htmlFor="negotiablePrice"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Ваша цена (Торг)
                </label>
              </div>
            </div>
          </div>
        )}

        {totalBudget && !isService && (
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-1">Общий бюджет</p>
            <p className="text-2xl font-bold text-primary">
              {totalBudget} ₽
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}