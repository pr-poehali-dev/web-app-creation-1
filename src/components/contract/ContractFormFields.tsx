import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import type { ContractFormData } from '@/hooks/useContractData';
import ContractProductSection from './ContractProductSection';
import ContractDeliverySection from './ContractDeliverySection';
import ContractCounterpartySection from './ContractCounterpartySection';

interface ContractFormFieldsProps {
  formData: ContractFormData;
  set: (field: string, value: string) => void;
  setArray: (field: 'deliveryTypes' | 'deliveryDistricts', values: string[]) => void;
  setImages: (field: 'productImages' | 'productImagesB', urls: string[]) => void;
  handleProductNameChange: (value: string) => void;
  handleProductNameBChange: (value: string) => void;
  totalAmount: number;
  prepaymentAmount: number;
  isGenerating: boolean;
  isSubmitting: boolean;
  isPublishing: boolean;
  onSave: () => void;
  onPublish: () => void;
}

export default function ContractFormFields({
  formData,
  set,
  setArray,
  setImages,
  handleProductNameChange,
  handleProductNameBChange,
  totalAmount,
  prepaymentAmount,
  isGenerating,
  isSubmitting,
  isPublishing,
  onSave,
  onPublish,
}: ContractFormFieldsProps) {
  const isForwardRequest = formData.contractType === 'forward-request';

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

      <ContractProductSection
        formData={formData}
        set={set}
        setImages={setImages}
        handleProductNameChange={handleProductNameChange}
        handleProductNameBChange={handleProductNameBChange}
        totalAmount={totalAmount}
      />

      <ContractDeliverySection
        formData={formData}
        set={set}
        setArray={setArray}
        prepaymentAmount={prepaymentAmount}
      />

      <ContractCounterpartySection
        formData={formData}
        set={set}
        isGenerating={isGenerating}
        isSubmitting={isSubmitting}
        isPublishing={isPublishing}
        onSave={onSave}
        onPublish={onPublish}
      />
    </div>
  );
}