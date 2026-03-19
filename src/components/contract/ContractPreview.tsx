import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import type { ContractFormData } from '@/hooks/useContractData';

interface ContractPreviewProps {
  formData: ContractFormData;
  totalAmount: number;
  generatedDocx: { base64: string; url: string; filename: string } | null;
  isSubmitting: boolean;
  onDownloadPdf: () => void;
  onDownloadDocx: () => void;
  onSave: () => void;
  onEdit: () => void;
}

export default function ContractPreview({
  formData,
  totalAmount,
  generatedDocx,
  isSubmitting,
  onDownloadPdf,
  onDownloadDocx,
  onSave,
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
          {isBarter ? 'Договор мены (бартера)' : 'Форвардный контракт'} по ГК РФ готов.
          Распечатайте/скачайте, подпишите и сохраните в «Мои контракты».
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button onClick={onDownloadPdf} className="w-full">
            <Icon name="Printer" className="mr-2 h-4 w-4" />
            Скачать / Распечатать PDF
          </Button>
          <Button onClick={onDownloadDocx} variant="outline" className="w-full" disabled={!generatedDocx}>
            <Icon name="FileDown" className="mr-2 h-4 w-4" />
            {generatedDocx ? 'Скачать DOCX (Word)' : 'DOCX формируется...'}
          </Button>
        </div>

        <div className="border-t pt-4 space-y-3">
          <p className="text-sm text-muted-foreground">После подписания сохраните контракт в систему для обмена с контрагентом:</p>
          <div className="flex gap-3">
            <Button onClick={onSave} disabled={isSubmitting} className="flex-1">
              {isSubmitting ? (
                <><Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />Сохраняю...</>
              ) : (
                <><Icon name="Save" className="mr-2 h-4 w-4" />Сохранить в Мои контракты</>
              )}
            </Button>
            <Button variant="outline" onClick={onEdit}>
              <Icon name="Pencil" className="mr-2 h-4 w-4" />
              Изменить данные
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
