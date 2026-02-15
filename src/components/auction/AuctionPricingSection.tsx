import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import Icon from '@/components/ui/icon';

interface AuctionPricingSectionProps {
  formData: {
    startingPrice: string;
    minBidStep: string;
    buyNowPrice: string;
    hasVAT: boolean;
    vatRate: string;
  };
  onInputChange: (field: string, value: string | boolean) => void;
}

export default function AuctionPricingSection({ formData, onInputChange }: AuctionPricingSectionProps) {
  const [isVatRateOpen, setIsVatRateOpen] = useState(false);
  const vatOptions = [
    { value: '20', label: '20%' },
    { value: '10', label: '10%' },
    { value: '0', label: '0%' }
  ];

  const selectedVatRate = vatOptions.find(opt => opt.value === formData.vatRate);

  const handleSelectVatRate = (value: string) => {
    onInputChange('vatRate', value);
    setIsVatRateOpen(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Условия аукциона</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="startingPrice">Начальная цена *</Label>
            <Input
              id="startingPrice"
              type="number"
              value={formData.startingPrice}
              onChange={(e) => onInputChange('startingPrice', e.target.value)}
              placeholder="0"
              min="0"
              step="0.01"
              required
            />
          </div>

          <div>
            <Label htmlFor="minBidStep">Минимальный шаг ставки *</Label>
            <Input
              id="minBidStep"
              type="number"
              value={formData.minBidStep}
              onChange={(e) => onInputChange('minBidStep', e.target.value)}
              placeholder="100"
              min="1"
              step="0.01"
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="buyNowPrice">Цена &quot;Купить сейчас&quot; (опционально)</Label>
          <Input
            id="buyNowPrice"
            type="number"
            value={formData.buyNowPrice}
            onChange={(e) => onInputChange('buyNowPrice', e.target.value)}
            placeholder="Оставьте пустым, если не требуется"
            min="0"
            step="0.01"
          />
          <p className="text-sm text-muted-foreground mt-1">
            Покупатель сможет немедленно купить лот по этой цене
          </p>
        </div>

      </CardContent>
    </Card>
  );
}