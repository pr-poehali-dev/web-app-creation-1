import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import type { ContractFormData } from '@/hooks/useContractData';

interface ContractPreviewProps {
  formData: ContractFormData;
  totalAmount: number;
  generatedDocx?: { base64: string; url: string; filename: string } | null;
  isSubmitting: boolean;
  isPublishing: boolean;
  onDownloadPdf?: () => void;
  onDownloadDocx?: () => void;
  onSave: () => void;
  onPublish: () => void;
  onEdit: () => void;
}

export default function ContractPreview({
  formData,
  totalAmount,
  isSubmitting,
  isPublishing,
  onSave,
  onPublish,
  onEdit,
}: ContractPreviewProps) {
  const isBarter = formData.contractType === 'barter';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="CheckCircle" size={20} className="text-green-500" />
          Документ сформирован
        </CardTitle>
        <CardDescription>
          {isBarter ? 'Договор мены (бартера)' : 'Форвардный контракт'} по ГК РФ сформирован.
          Опубликуйте контракт — скачать и распечатать договор можно после согласия обеих сторон.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Icon name="Info" size={14} />
            <span>Документ составлен по шаблону ГК РФ с вашими данными из профиля</span>
          </div>
          <div><span className="font-medium">Тип:</span> {isBarter ? 'Договор мены (бартер)' : 'Форвардный контракт'}</div>
          <div><span className="font-medium">Товар:</span> {formData.productName} — {formData.quantity} {formData.unit}</div>
          {isBarter && <div><span className="font-medium">В обмен:</span> {formData.productNameB} — {formData.quantityB} {formData.unitB}</div>}
          {!isBarter && <div><span className="font-medium">Сумма:</span> {totalAmount.toLocaleString('ru-RU')} ₽</div>}
          <div><span className="font-medium">Дата поставки:</span> {formData.deliveryDate}</div>
        </div>

        <div className="border-t pt-4 space-y-3">
          <p className="text-sm text-muted-foreground">Сохраните черновик или сразу опубликуйте контракт — он станет виден другим участникам:</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={onSave} disabled={isSubmitting || isPublishing} variant="outline" className="flex-1">
              {isSubmitting ? (
                <><Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />Сохраняю...</>
              ) : (
                <><Icon name="Save" className="mr-2 h-4 w-4" />Сохранить черновик</>
              )}
            </Button>
            <Button onClick={onPublish} disabled={isSubmitting || isPublishing} className="flex-1">
              {isPublishing ? (
                <><Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />Публикую...</>
              ) : (
                <><Icon name="Globe" className="mr-2 h-4 w-4" />Опубликовать контракт</>
              )}
            </Button>
          </div>
          <Button variant="ghost" onClick={onEdit} className="w-full text-muted-foreground">
            <Icon name="Pencil" className="mr-2 h-4 w-4" />
            Изменить данные
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}