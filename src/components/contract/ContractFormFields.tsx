import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { CATEGORIES, UNITS } from '@/hooks/useContractData';
import type { ContractFormData } from '@/hooks/useContractData';
import { uploadMultipleFiles } from '@/utils/fileUpload';

interface PhotoUploadProps {
  images: string[];
  onChange: (urls: string[]) => void;
  label: string;
  maxImages?: number;
}

function PhotoUpload({ images, onChange, label, maxImages = 5 }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (images.length + files.length > maxImages) {
      setError(`Максимум ${maxImages} фотографий`);
      return;
    }
    const userId = localStorage.getItem('userId');
    if (!userId) { setError('Необходима авторизация'); return; }
    setError('');
    setUploading(true);
    setProgress(0);
    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) { setError(`${file.name} — не изображение`); continue; }
        if (file.size > 10 * 1024 * 1024) { setError(`${file.name} превышает 10 МБ`); continue; }
        const res = await uploadMultipleFiles([{ file, type: `product_img_${i}` }], userId);
        const url = Object.values(res)[0];
        if (url) newUrls.push(url);
        setProgress(Math.round(((i + 1) / files.length) * 100));
      }
      onChange([...images, ...newUrls]);
    } catch {
      setError('Ошибка загрузки');
    } finally {
      setUploading(false);
      setProgress(0);
      e.target.value = '';
    }
  };

  const remove = (idx: number) => onChange(images.filter((_, i) => i !== idx));

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5">
        <Icon name="Camera" size={14} />
        {label} ({images.length}/{maxImages})
      </Label>
      <p className="text-xs text-muted-foreground">JPG, PNG, WebP — до 10 МБ на фото</p>
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {images.map((url, idx) => (
            <div key={idx} className="relative group aspect-square">
              <img src={url} alt={`Фото ${idx + 1}`} className="w-full h-full object-cover rounded-lg border" />
              <button
                type="button"
                onClick={() => remove(idx)}
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Icon name="X" size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
      {images.length < maxImages && (
        <>
          <input
            id={`photo-upload-${label}`}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            disabled={uploading}
            onClick={() => document.getElementById(`photo-upload-${label}`)?.click()}
          >
            {uploading ? (
              <><Icon name="Loader2" size={14} className="mr-2 animate-spin" />Загрузка {progress}%...</>
            ) : (
              <><Icon name="ImagePlus" size={14} className="mr-2" />Добавить фото</>
            )}
          </Button>
        </>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

interface ContractFormFieldsProps {
  formData: ContractFormData;
  set: (field: string, value: string) => void;
  setImages: (field: 'productImages' | 'productImagesB', urls: string[]) => void;
  handleProductNameChange: (value: string) => void;
  handleProductNameBChange: (value: string) => void;
  totalAmount: number;
  prepaymentAmount: number;
  isGenerating: boolean;
  onGenerate: () => void;
}

export default function ContractFormFields({
  formData,
  set,
  setImages,
  handleProductNameChange,
  handleProductNameBChange,
  totalAmount,
  prepaymentAmount,
  isGenerating,
  onGenerate,
}: ContractFormFieldsProps) {
  const navigate = useNavigate();
  const isBarter = formData.contractType === 'barter';
  const isForwardRequest = formData.contractType === 'forward-request';
  const categoryLabel = CATEGORIES.find(c => c.value === formData.category)?.label || '';

  return (
    <div className="space-y-6">
      {/* Тип контракта */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Icon name="FileText" size={18} />
            Тип договора
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { value: 'forward', label: 'Форвардный контракт', desc: 'Поставка товара в будущем по фиксированной цене (ГК РФ ст. 454–524)', icon: 'TrendingUp' },
              { value: 'barter', label: 'Договор на бартер (мену)', desc: 'Обмен товарами без денежного расчёта (ГК РФ ст. 567–571)', icon: 'ArrowLeftRight' },
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => set('contractType', opt.value === 'forward' ? (isForwardRequest ? 'forward-request' : 'forward') : opt.value)}
                className={`text-left p-4 rounded-lg border-2 transition-all ${(opt.value === 'forward' ? (formData.contractType === 'forward' || formData.contractType === 'forward-request') : formData.contractType === opt.value) ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon name={opt.icon as 'TrendingUp'} size={16} className={(opt.value === 'forward' ? (formData.contractType === 'forward' || formData.contractType === 'forward-request') : formData.contractType === opt.value) ? 'text-primary' : 'text-muted-foreground'} />
                  <span className="font-semibold text-sm">{opt.label}</span>
                  {(opt.value === 'forward' ? (formData.contractType === 'forward' || formData.contractType === 'forward-request') : formData.contractType === opt.value) && <Badge variant="default" className="ml-auto text-xs">Выбран</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">{opt.desc}</p>
              </button>
            ))}
          </div>

          {/* Переключатель на предложение / запрос — только для форварда */}
          {(formData.contractType === 'forward' || formData.contractType === 'forward-request') && (
            <div className="mt-4 flex items-center gap-2 p-1 bg-muted rounded-lg w-fit">
              <button
                type="button"
                onClick={() => set('contractType', 'forward')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${formData.contractType === 'forward' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <span className="flex items-center gap-1.5">
                  <Icon name="TrendingUp" size={14} />
                  На предложение
                </span>
              </button>
              <button
                type="button"
                onClick={() => set('contractType', 'forward-request')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${formData.contractType === 'forward-request' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <span className="flex items-center gap-1.5">
                  <Icon name="ShoppingCart" size={14} />
                  На запрос
                </span>
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Товар А */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Icon name={isForwardRequest ? 'ShoppingBag' : 'Package'} size={18} />
            {isBarter ? 'Товар А (ваш товар)' : isForwardRequest ? 'Запрашиваемый товар / услуга' : 'Товар и условия поставки'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>{isForwardRequest ? 'Название товара / услуги *' : 'Название товара *'}</Label>
              <Input
                value={formData.productName}
                onChange={e => handleProductNameChange(e.target.value)}
                placeholder={isForwardRequest ? 'Молоко цельное, монтажные работы, зерно пшеницы...' : 'Молоко цельное, пшеница 3 кл., кирпич М150...'}
              />
              {formData.category && (
                <p className="text-xs text-primary flex items-center gap-1">
                  <Icon name="Sparkles" size={12} />
                  Категория определена автоматически: {categoryLabel}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Категория товара *</Label>
              <Select value={formData.category} onValueChange={v => set('category', v)}>
                <SelectTrigger><SelectValue placeholder="Выберите категорию" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <Label>Количество *</Label>
              <Input type="number" step="0.001" min="0" value={formData.quantity} onChange={e => set('quantity', e.target.value)} placeholder="100" />
            </div>
            <div className="space-y-1">
              <Label>Единица</Label>
              <Select value={formData.unit} onValueChange={v => set('unit', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {!isBarter && (
              <>
                <div className="space-y-1">
                  <Label>{isForwardRequest ? `Макс. цена за ${formData.unit} (₽)` : `Цена за ${formData.unit} (₽) *`}</Label>
                  <Input type="number" step="0.01" min="0" value={formData.pricePerUnit} onChange={e => set('pricePerUnit', e.target.value)} placeholder={isForwardRequest ? 'Не указывать или макс. бюджет' : '15000'} />
                </div>
                <div className="space-y-1">
                  <Label>{isForwardRequest ? 'Макс. бюджет (₽)' : 'Итого (₽)'}</Label>
                  <Input value={totalAmount ? totalAmount.toLocaleString('ru-RU', { maximumFractionDigits: 2 }) : (isForwardRequest ? 'Договорная' : '0')} disabled />
                </div>
              </>
            )}
          </div>

          <PhotoUpload
            images={formData.productImages}
            onChange={urls => setImages('productImages', urls)}
            label="Фото образца товара А"
          />
        </CardContent>
      </Card>

      {/* Товар Б (только бартер) */}
      {isBarter && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Icon name="PackageOpen" size={18} />
              Товар Б (товар контрагента)
            </CardTitle>
            <CardDescription>Что вы получаете в обмен</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Название товара Б *</Label>
                <Input
                  value={formData.productNameB}
                  onChange={e => handleProductNameBChange(e.target.value)}
                  placeholder="Название товара для обмена..."
                />
              </div>
              <div className="space-y-1">
                <Label>Категория товара Б</Label>
                <Select value={formData.categoryB} onValueChange={v => set('categoryB', v)}>
                  <SelectTrigger><SelectValue placeholder="Выберите категорию" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Количество Б *</Label>
                <Input type="number" step="0.001" min="0" value={formData.quantityB} onChange={e => set('quantityB', e.target.value)} placeholder="100" />
              </div>
              <div className="space-y-1">
                <Label>Единица Б</Label>
                <Select value={formData.unitB} onValueChange={v => set('unitB', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Оценочная стоимость товара А (₽) — для раздела доплаты</Label>
              <Input type="number" step="0.01" min="0" value={formData.pricePerUnit} onChange={e => set('pricePerUnit', e.target.value)} placeholder="500000" />
            </div>

            <PhotoUpload
              images={formData.productImagesB}
              onChange={urls => setImages('productImagesB', urls)}
              label="Фото образца товара Б"
            />
          </CardContent>
        </Card>
      )}

      {/* Сроки */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Icon name="Calendar" size={18} />
            Сроки
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Дата начала контракта</Label>
              <Input type="date" value={formData.contractStartDate} onChange={e => set('contractStartDate', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                {isForwardRequest ? 'Период исполнения (поставки / оказания услуги) *' : 'Период поставки *'}
                <span className="text-xs text-muted-foreground font-normal">(конечная дата = дата окончания контракта)</span>
              </Label>
              <div className="flex items-center gap-2">
                <div className="flex-1 space-y-1">
                  <span className="text-xs text-muted-foreground">Начало</span>
                  <Input type="date" value={formData.deliveryDate} onChange={e => set('deliveryDate', e.target.value)} />
                </div>
                <Icon name="ArrowRight" size={16} className="text-muted-foreground mt-5 shrink-0" />
                <div className="flex-1 space-y-1">
                  <span className="text-xs text-muted-foreground">Конец (дата окончания контракта)</span>
                  <Input
                    type="date"
                    value={formData.contractEndDate}
                    min={formData.deliveryDate || undefined}
                    onChange={e => set('contractEndDate', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Доставка и оплата */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Icon name="Truck" size={18} />
            Доставка и оплата
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>{isForwardRequest ? 'Адрес получения / место исполнения' : 'Адрес доставки'}</Label>
              <Input value={formData.deliveryAddress} onChange={e => set('deliveryAddress', e.target.value)} placeholder="г. Москва, ул. Промышленная, 1" />
            </div>
            <div className="space-y-1">
              <Label>Способ доставки</Label>
              <Select value={formData.deliveryMethod} onValueChange={v => set('deliveryMethod', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="автомобильный транспорт">Автомобильный транспорт</SelectItem>
                  <SelectItem value="железнодорожный транспорт">Железнодорожный транспорт</SelectItem>
                  <SelectItem value="самовывоз">Самовывоз</SelectItem>
                  <SelectItem value="авиатранспорт">Авиатранспорт</SelectItem>
                  <SelectItem value="морской/речной транспорт">Морской / речной транспорт</SelectItem>
                  <SelectItem value="смешанная перевозка">Смешанная перевозка</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {!isBarter && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Предоплата (%)</Label>
                <Input type="number" step="1" min="0" max="100" value={formData.prepaymentPercent} onChange={e => set('prepaymentPercent', e.target.value)} placeholder="30" />
              </div>
              <div className="space-y-1">
                <Label>Сумма предоплаты (₽)</Label>
                <Input value={prepaymentAmount ? prepaymentAmount.toLocaleString('ru-RU', { maximumFractionDigits: 2 }) : '0'} disabled />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Контрагент */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Icon name="Users" size={18} />
            Контрагент ({isBarter ? 'Сторона 2' : isForwardRequest ? 'Поставщик' : 'Покупатель'})
          </CardTitle>
          <CardDescription>Заполните, если контрагент уже известен. Можно оставить пустым — поля будут для ручного заполнения.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>ФИО / Наименование</Label>
              <Input value={formData.counterpartyName} onChange={e => set('counterpartyName', e.target.value)} placeholder="Иванов Иван Иванович / ООО «Ромашка»" />
            </div>
            <div className="space-y-1">
              <Label>ИНН</Label>
              <Input value={formData.counterpartyInn} onChange={e => set('counterpartyInn', e.target.value)} placeholder="123456789012" maxLength={12} />
            </div>
            <div className="space-y-1">
              <Label>Организация</Label>
              <Input value={formData.counterpartyCompany} onChange={e => set('counterpartyCompany', e.target.value)} placeholder="ООО «Компания»" />
            </div>
            <div className="space-y-1">
              <Label>Город</Label>
              <Input value={formData.counterpartyCity} onChange={e => set('counterpartyCity', e.target.value)} placeholder="Москва" />
            </div>
            <div className="space-y-1">
              <Label>Телефон</Label>
              <Input value={formData.counterpartyPhone} onChange={e => set('counterpartyPhone', e.target.value)} placeholder="+7 (900) 123-45-67" />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" value={formData.counterpartyEmail} onChange={e => set('counterpartyEmail', e.target.value)} placeholder="partner@example.com" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Доп. условия */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Icon name="ClipboardList" size={18} />
            Название и дополнительные условия
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>Название контракта (для «Моих контрактов»)</Label>
            <Input value={formData.title} onChange={e => set('title', e.target.value)} placeholder="Например: Поставка молока, октябрь 2026" />
          </div>
          <div className="space-y-1">
            <Label>Дополнительные условия (будут добавлены в контракт)</Label>
            <Textarea value={formData.termsConditions} onChange={e => set('termsConditions', e.target.value)} rows={3} placeholder="Особые требования к качеству, упаковке, документации..." />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 pb-4">
        <Button onClick={onGenerate} disabled={isGenerating} className="flex-1">
          {isGenerating ? (
            <><Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />Формирую документ...</>
          ) : (
            <><Icon name="FileDown" className="mr-2 h-4 w-4" />Сформировать контракт</>
          )}
        </Button>
        <Button type="button" variant="outline" onClick={() => navigate('/trading')}>Отмена</Button>
      </div>
    </div>
  );
}