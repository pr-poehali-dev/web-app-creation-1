import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AuctionScheduleSectionProps {
  formData: {
    startDate: string;
    startTime: string;
    duration: string;
  };
  onInputChange: (field: string, value: string) => void;
}

export default function AuctionScheduleSection({ formData, onInputChange }: AuctionScheduleSectionProps) {
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

        <div>
          <Label htmlFor="duration">Длительность (дней)</Label>
          <select
            id="duration"
            value={formData.duration}
            onChange={(e) => onInputChange('duration', e.target.value)}
            className="w-full px-3 py-2 border border-input bg-background rounded-md"
          >
            <option value="1">1 день</option>
            <option value="3">3 дня</option>
            <option value="5">5 дней</option>
            <option value="7">7 дней</option>
            <option value="14">14 дней</option>
          </select>
        </div>
      </CardContent>
    </Card>
  );
}
