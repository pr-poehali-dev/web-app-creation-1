import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface OfferAdditionalSectionProps {
  formData: {
    deliveryTime: string;
    deliveryPeriodStart: string;
    deliveryPeriodEnd: string;
    expiryDate: string;
    publicationStartDate: string;
    publicationDuration: string;
  };
  onInputChange: (field: string, value: string | boolean) => void;
}

export default function OfferAdditionalSection({ formData, onInputChange }: OfferAdditionalSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Дополнительно</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="deliveryTime">Срок доставки/поставки (необязательно)</Label>
          <Input
            id="deliveryTime"
            type="text"
            placeholder="Например: 1-2 дня, 3-5 рабочих дней"
            value={formData.deliveryTime}
            onChange={(e) => onInputChange('deliveryTime', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="deliveryPeriod">Период поставки (необязательно)</Label>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div>
              <Label htmlFor="deliveryPeriodStart" className="text-sm text-muted-foreground">Дата начала</Label>
              <div className="flex gap-2">
                <Input
                  id="deliveryPeriodStart"
                  type="date"
                  value={formData.deliveryPeriodStart}
                  onChange={(e) => onInputChange('deliveryPeriodStart', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  max={formData.deliveryPeriodEnd || undefined}
                />
                {formData.deliveryPeriodStart && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onInputChange('deliveryPeriodStart', '')}
                  >
                    <Icon name="X" className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="deliveryPeriodEnd" className="text-sm text-muted-foreground">Дата окончания</Label>
              <div className="flex gap-2">
                <Input
                  id="deliveryPeriodEnd"
                  type="date"
                  value={formData.deliveryPeriodEnd}
                  onChange={(e) => onInputChange('deliveryPeriodEnd', e.target.value)}
                  min={formData.deliveryPeriodStart || new Date().toISOString().split('T')[0]}
                />
                {formData.deliveryPeriodEnd && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onInputChange('deliveryPeriodEnd', '')}
                  >
                    <Icon name="X" className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
        <div>
          <Label htmlFor="expiryDate">Срок годности (необязательно)</Label>
          <div className="flex gap-2 mt-2">
            <Input
              id="expiryDate"
              type="date"
              value={formData.expiryDate}
              onChange={(e) => onInputChange('expiryDate', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
            {formData.expiryDate && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onInputChange('expiryDate', '')}
              >
                <Icon name="X" className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <Label>Период публикации *</Label>
            <p className="text-xs text-muted-foreground mt-1 mb-3">
              Укажите период, в течение которого предложение будет активно
            </p>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Label htmlFor="publicationStartDate" className="text-xs">Дата начала</Label>
              <Label htmlFor="publicationDuration" className="text-xs">Дата окончания</Label>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex gap-1">
                <Input
                  id="publicationStartDate"
                  type="date"
                  value={formData.publicationStartDate}
                  onChange={(e) => onInputChange('publicationStartDate', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="text-sm"
                  required
                />
                {formData.publicationStartDate && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={() => onInputChange('publicationStartDate', '')}
                  >
                    <Icon name="X" className="h-3 w-3" />
                  </Button>
                )}
              </div>

              <div className="flex gap-1">
                <Input
                  id="publicationDuration"
                  type="date"
                  value={formData.publicationDuration}
                  onChange={(e) => onInputChange('publicationDuration', e.target.value)}
                  min={formData.publicationStartDate || new Date().toISOString().split('T')[0]}
                  className="text-sm"
                  required
                />
                {formData.publicationDuration && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={() => onInputChange('publicationDuration', '')}
                  >
                    <Icon name="X" className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
