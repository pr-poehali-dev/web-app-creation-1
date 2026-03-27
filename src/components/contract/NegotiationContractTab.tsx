import Icon from '@/components/ui/icon';
import { ResponseStatus, formatDate, formatAmount } from './NegotiationTypes';

interface NegotiationContractTabProps {
  status: ResponseStatus | null;
}

function ContractPreviewContent({ status }: { status: ResponseStatus }) {
  const c = status.contract;
  if (!c) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
        <Icon name="FileText" className="h-10 w-10 mb-2 opacity-30" />
        <p className="text-sm">Данные договора недоступны</p>
      </div>
    );
  }
  const formatMoney = (n: number) => formatAmount(n, c.currency || 'RUB');

  return (
    <div className="space-y-4 text-sm">
      <div className="bg-muted/50 rounded-lg p-4 space-y-2">
        <h3 className="font-semibold text-base">{c.title || c.productName || 'Договор'}</h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
          <div>
            <span className="text-muted-foreground">Товар: </span>
            <span>{c.productName}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Кол-во: </span>
            <span>{c.quantity} {c.unit}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Цена за ед.: </span>
            <span>{formatMoney(c.pricePerUnit)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Сумма: </span>
            <span className="font-medium">{formatMoney(c.totalAmount)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Поставка: </span>
            <span>{formatDate(c.deliveryDate)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Срок: </span>
            <span>{formatDate(c.contractStartDate)} — {formatDate(c.contractEndDate)}</span>
          </div>
          {c.deliveryAddress && (
            <div className="col-span-2">
              <span className="text-muted-foreground">Адрес: </span>
              <span>{c.deliveryAddress}</span>
            </div>
          )}
        </div>
      </div>

      <div className="border rounded-lg p-3 space-y-2">
        <h4 className="font-medium flex items-center gap-2">
          <Icon name="Users" size={14} />
          Стороны
        </h4>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="space-y-0.5">
            <p className="font-medium text-muted-foreground uppercase tracking-wide text-[10px]">Продавец</p>
            <p>{status.sellerFirstName} {status.sellerLastName}</p>
          </div>
          <div className="space-y-0.5">
            <p className="font-medium text-muted-foreground uppercase tracking-wide text-[10px]">Покупатель</p>
            <p>{status.respondentFirstName} {status.respondentLastName}</p>
          </div>
        </div>
      </div>

      {status.status === 'confirmed' && (
        <div className="border-2 border-green-500 rounded-lg p-3 bg-green-50 text-green-800 flex items-start gap-2">
          <Icon name="ShieldCheck" size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-sm">Контракт согласован обеими сторонами</p>
            {status.confirmedAt && (
              <p className="text-xs mt-0.5">Дата согласования: {new Date(status.confirmedAt).toLocaleDateString('ru-RU')}</p>
            )}
            <p className="text-xs mt-1 opacity-80">Договор не подлежит изменению без взаимного согласия сторон</p>
          </div>
        </div>
      )}

      {c.termsConditions && (
        <div className="space-y-1.5">
          <p className="font-medium text-xs text-muted-foreground uppercase tracking-wide">Условия</p>
          <p className="text-sm whitespace-pre-wrap">{c.termsConditions}</p>
        </div>
      )}
    </div>
  );
}

export default function NegotiationContractTab({ status }: NegotiationContractTabProps) {
  if (!status) {
    return (
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
          <Icon name="FileText" className="h-10 w-10 mb-2 opacity-30" />
          <p className="text-sm">Загрузка данных договора...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <ContractPreviewContent status={status} />
    </div>
  );
}
