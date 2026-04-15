import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { CATEGORIES, UNITS, CATEGORY_UNITS, detectCategory } from '@/hooks/useContractData';
import type { ContractFormData } from '@/hooks/useContractData';
import ContractPhotoUpload from './ContractPhotoUpload';
import AIAssistButton from '@/components/offer/AIAssistButton';

interface ContractProductSectionProps {
  formData: ContractFormData;
  set: (field: string, value: string) => void;
  setImages: (field: 'productImages' | 'productImagesB', urls: string[]) => void;
  handleProductNameChange: (value: string) => void;
  handleProductNameBChange: (value: string) => void;
  totalAmount: number;
  categoryManuallySet: boolean;
  categoryBManuallySet: boolean;
}

export default function ContractProductSection({
  formData,
  set,
  setImages,
  handleProductNameChange,
  handleProductNameBChange,
  totalAmount,
  categoryManuallySet,
  categoryBManuallySet,
}: ContractProductSectionProps) {
  const isBarter = formData.contractType === 'barter';
  const isForwardRequest = formData.contractType === 'forward-request';
  const categoryLabel = CATEGORIES.find(c => c.value === formData.category)?.label || '';
  const autoDetectedCategory = detectCategory(formData.productName);
  const isCategoryAutoDetected = !categoryManuallySet && !!autoDetectedCategory && autoDetectedCategory === formData.category;
  const availableUnits = CATEGORY_UNITS[formData.category] || UNITS;

  return (
    <>
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
              <div className="flex items-center justify-between">
                <Label>{isForwardRequest ? 'Название товара / услуги *' : 'Название товара *'}</Label>
                {formData.productName.length >= 3 && (
                  <AIAssistButton
                    action="improve_title"
                    title={formData.productName}
                    category={formData.category}
                    onResult={text => handleProductNameChange(text.slice(0, 200))}
                    label="Улучшить"
                  />
                )}
              </div>
              <Input
                value={formData.productName}
                onChange={e => handleProductNameChange(e.target.value)}
                placeholder={isForwardRequest ? 'Молоко цельное, монтажные работы, зерно пшеницы...' : 'Молоко цельное, пшеница 3 кл., кирпич М150...'}
              />
              {isCategoryAutoDetected && (
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
              <Select value={availableUnits.includes(formData.unit) ? formData.unit : availableUnits[0]} onValueChange={v => set('unit', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{availableUnits.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
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

          <ContractPhotoUpload
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
                <div className="flex items-center justify-between">
                  <Label>Название товара Б *</Label>
                  {formData.productNameB.length >= 3 && (
                    <AIAssistButton
                      action="improve_title"
                      title={formData.productNameB}
                      category={formData.categoryB}
                      onResult={text => handleProductNameBChange(text.slice(0, 200))}
                      label="Улучшить"
                    />
                  )}
                </div>
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

            <ContractPhotoUpload
              images={formData.productImagesB}
              onChange={urls => setImages('productImagesB', urls)}
              label="Фото образца товара Б"
            />
          </CardContent>
        </Card>
      )}
    </>
  );
}