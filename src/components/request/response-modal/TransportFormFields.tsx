import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ExistingResponse } from '@/pages/RequestDetail/useRequestResponse';

const CAR_TYPES = [
  'Седан',
  'Минивэн',
  'Микроавтобус',
  'Автобус',
  'Внедорожник',
  'Хэтчбек',
  'Универсал',
];

interface TransportFormFieldsProps {
  isEditMode: boolean;
  existingResponse?: ExistingResponse | null;
  priceValue: string;
  onPriceChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  carType: string;
  onCarTypeChange: (value: string) => void;
  departureTime: string;
  onDepartureTimeChange: (value: string) => void;
}

export default function TransportFormFields({
  isEditMode,
  existingResponse,
  priceValue,
  onPriceChange,
  carType,
  onCarTypeChange,
  departureTime,
  onDepartureTimeChange,
}: TransportFormFieldsProps) {
  const parseExisting = () => {
    if (!existingResponse?.buyerComment) return { carType: '', departureTime: '', comment: '' };
    const carMatch = existingResponse.buyerComment.match(/Тип авто: ([^\n.]+)/);
    const timeMatch = existingResponse.buyerComment.match(/Время выезда: ([^\n.]+)/);
    const commentMatch = existingResponse.buyerComment.match(/Комментарий: ([\s\S]+)/);
    return {
      carType: carMatch?.[1]?.trim() || '',
      departureTime: timeMatch?.[1]?.trim() || '',
      comment: commentMatch?.[1]?.trim() || '',
    };
  };

  const existing = isEditMode ? parseExisting() : { carType: '', departureTime: '', comment: '' };

  return (
    <>
      <div>
        <Label htmlFor="transport-price" className="text-sm">Ваша цена за поездку (₽) *</Label>
        <Input
          id="transport-price"
          name="response-price"
          type="text"
          inputMode="numeric"
          value={priceValue}
          onChange={onPriceChange}
          placeholder="Введите цену"
          required
          className="mt-1"
        />
        <input type="hidden" name="response-price-value" value={priceValue} />
      </div>

      <div>
        <Label htmlFor="transport-car-type" className="text-sm">Тип автомобиля *</Label>
        <Select
          value={carType || (isEditMode ? existing.carType : '')}
          onValueChange={onCarTypeChange}
          required
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Выберите тип авто" />
          </SelectTrigger>
          <SelectContent>
            {CAR_TYPES.map((type) => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input type="hidden" name="response-car-type" value={carType || existing.carType} />
      </div>

      <div>
        <Label htmlFor="transport-departure" className="text-sm">Время выезда *</Label>
        <Input
          id="transport-departure"
          name="response-departure-time"
          type="datetime-local"
          value={departureTime || (isEditMode ? existing.departureTime : '')}
          onChange={(e) => onDepartureTimeChange(e.target.value)}
          required
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="transport-comment" className="text-sm">Комментарий</Label>
        <Textarea
          id="transport-comment"
          name="response-comment"
          defaultValue={isEditMode ? existing.comment : undefined}
          placeholder="Укажите дополнительную информацию: марка авто, вместимость, условия"
          rows={2}
          className="text-sm mt-1"
        />
      </div>
    </>
  );
}
