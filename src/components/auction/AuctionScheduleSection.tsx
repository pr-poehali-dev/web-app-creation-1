import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';

interface AuctionScheduleSectionProps {
  formData: {
    startDate: string;
    startTime: string;
    duration: string;
  };
  onInputChange: (field: string, value: string) => void;
}

export default function AuctionScheduleSection({ formData, onInputChange }: AuctionScheduleSectionProps) {
  const [isDurationOpen, setIsDurationOpen] = useState(false);
  const durationOptions = [
    { value: '1', label: '1 день' },
    { value: '3', label: '3 дня' },
    { value: '5', label: '5 дней' },
    { value: '7', label: '7 дней' },
    { value: '14', label: '14 дней' }
  ];

  const selectedDuration = durationOptions.find(opt => opt.value === formData.duration);

  const handleSelectDuration = (value: string) => {
    onInputChange('duration', value);
    setIsDurationOpen(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Время проведения</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="startDate">Дата начала *</Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) => onInputChange('startDate', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div>
            <Label htmlFor="startTime">Время начала *</Label>
            <Input
              id="startTime"
              type="time"
              value={formData.startTime}
              onChange={(e) => onInputChange('startTime', e.target.value)}
              required
            />
          </div>
        </div>

        <div className="relative">
          <Label htmlFor="duration">Длительность (дней)</Label>
          <div className="relative">
            <Input
              id="duration"
              value={selectedDuration?.label || ''}
              onFocus={() => setIsDurationOpen(true)}
              placeholder="Выберите длительность..."
              className="pr-8"
              readOnly
            />
            <button
              type="button"
              onClick={() => setIsDurationOpen(!isDurationOpen)}
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              <Icon name={isDurationOpen ? "ChevronUp" : "ChevronDown"} className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          
          {isDurationOpen && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setIsDurationOpen(false)}
              />
              <div className="absolute z-20 w-full mt-1 max-h-60 overflow-auto bg-background border border-input rounded-md shadow-lg">
                {durationOptions.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelectDuration(option.value)}
                    className={`w-full text-left px-3 py-2 hover:bg-accent transition-colors ${
                      formData.duration === option.value ? 'bg-accent font-medium' : ''
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}