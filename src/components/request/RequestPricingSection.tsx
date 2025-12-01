import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface RequestPricingSectionProps {
  formData: {
    quantity: string;
    unit: string;
    pricePerUnit: string;
    hasVAT: boolean;
    vatRate: string;
  };
  onInputChange: (field: string, value: string | boolean) => void;
}

export default function RequestPricingSection({
  formData,
  onInputChange,
}: RequestPricingSectionProps) {
  const totalBudget = formData.quantity && formData.pricePerUnit
    ? (Number(formData.quantity) * Number(formData.pricePerUnit)).toLocaleString('ru-RU')
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Количество и бюджет</CardTitle>
        <CardDescription>
          Укажите требуемое количество и желаемую цену
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="quantity">Требуемое количество *</Label>
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
            <Label htmlFor="unit">Единица измерения *</Label>
            <select
              id="unit"
              value={formData.unit}
              onChange={(e) => onInputChange('unit', e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              required
            >
              <option value="шт">шт</option>
              <option value="кг">кг</option>
              <option value="т">т</option>
              <option value="м">м</option>
              <option value="м²">м²</option>
              <option value="м³">м³</option>
              <option value="л">л</option>
              <option value="упак">упак</option>
            </select>
          </div>

          <div>
            <Label htmlFor="pricePerUnit">Желаемая цена за единицу (₽) *</Label>
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

        <div className="flex items-start space-x-2">
          <Checkbox
            id="hasVAT"
            checked={formData.hasVAT}
            onCheckedChange={(checked) => onInputChange('hasVAT', checked as boolean)}
          />
          <div className="grid gap-1.5 leading-none">
            <label
              htmlFor="hasVAT"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Цена должна включать НДС
            </label>
          </div>
        </div>

        {formData.hasVAT && (
          <div className="w-40">
            <Label htmlFor="vatRate">Ставка НДС (%)</Label>
            <select
              id="vatRate"
              value={formData.vatRate}
              onChange={(e) => onInputChange('vatRate', e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="0">0%</option>
              <option value="10">10%</option>
              <option value="20">20%</option>
            </select>
          </div>
        )}

        {totalBudget && (
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
