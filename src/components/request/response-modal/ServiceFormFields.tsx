import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ServiceFormFieldsProps } from './types';

export default function ServiceFormFields({
  isEditMode,
  existingParsed,
  priceValue,
  onPriceChange,
  budget,
  education,
  onEducationChange,
  uploadedDiploma,
  diplomaFile,
  onDiplomaChange,
  onRemoveUploadedDiploma,
  onRemoveDiplomaFile,
}: ServiceFormFieldsProps) {
  return (
    <>
      <div>
        <Label htmlFor="response-price" className="text-sm">
          Стоимость услуги (₽)
        </Label>
        <Input
          id="response-price"
          name="response-price"
          type="text"
          value={priceValue}
          onChange={onPriceChange}
          placeholder={budget ? `Бюджет заказчика: ${budget.toLocaleString('ru-RU')} ₽` : 'Укажите стоимость'}
          required
          className="h-9 mt-1"
        />
        <input 
          type="hidden" 
          name="response-price-value" 
          value={priceValue.replace(/\s/g, '')}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Можете указать свою стоимость выполнения работ
        </p>
      </div>

      <div>
        <Label htmlFor="response-delivery" className="text-sm">
          Срок выполнения (дней)
        </Label>
        <Input
          id="response-delivery"
          name="response-delivery"
          type="number"
          min="1"
          defaultValue={isEditMode ? existingParsed.deliveryDays : undefined}
          placeholder="Укажите срок выполнения"
          required
          className="h-9 mt-1"
        />
      </div>

      <div>
        <Label htmlFor="response-comment" className="text-sm">Опыт и комментарий</Label>
        <Textarea
          id="response-comment"
          name="response-comment"
          defaultValue={isEditMode ? existingParsed.comment : undefined}
          placeholder="Расскажите о вашем опыте, условиях работы и других деталях"
          rows={3}
          className="text-sm mt-1"
        />
      </div>

      <div>
        <Label className="text-sm">Образование</Label>
        <Select value={education} onValueChange={onEducationChange}>
          <SelectTrigger className="h-9 mt-1">
            <SelectValue placeholder="Выберите уровень образования" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="secondary_professional">Среднее профессиональное</SelectItem>
            <SelectItem value="higher">Высшее</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {education && (
        <div>
          <Label className="text-sm">Диплом (подтверждающий документ)</Label>
          <div className="mt-1">
            {uploadedDiploma ? (
              <div className="flex items-center justify-between bg-muted px-2 py-1 rounded text-xs">
                <div className="flex items-center gap-1 flex-1 min-w-0">
                  <Icon name="FileText" className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{uploadedDiploma.name}</span>
                  <span className="text-green-600 flex-shrink-0">(загружен)</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 ml-2"
                  onClick={onRemoveUploadedDiploma}
                >
                  <Icon name="X" className="h-3 w-3" />
                </Button>
              </div>
            ) : diplomaFile ? (
              <div className="flex items-center justify-between bg-muted px-2 py-1 rounded text-xs">
                <div className="flex items-center gap-1 flex-1 min-w-0">
                  <Icon name="FileText" className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{diplomaFile.name}</span>
                  <span className="text-muted-foreground flex-shrink-0">
                    ({(diplomaFile.size / 1024).toFixed(0)} КБ)
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 ml-2"
                  onClick={onRemoveDiplomaFile}
                >
                  <Icon name="X" className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('diploma-upload')?.click()}
              >
                <Icon name="Upload" className="h-4 w-4 mr-1" />
                Загрузить диплом
              </Button>
            )}
            <input
              id="diploma-upload"
              type="file"
              accept="image/*,.pdf"
              onChange={onDiplomaChange}
              className="hidden"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Одна страница формата А4 (изображение или PDF, макс. 10 МБ)
            </p>
          </div>
        </div>
      )}
    </>
  );
}
