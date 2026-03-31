import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ResponseStatus, formatDate, formatAmount, buildContractHtml } from './NegotiationTypes';
import func2url from '../../../backend/func2url.json';

const CHAT_API = (func2url as Record<string, string>)['contract-chat'];

interface NegotiationContractTabProps {
  status: ResponseStatus | null;
  userId: string;
  onStatusChange?: () => void;
}

function openContractPreview(status: ResponseStatus) {
  const c = status.contract;
  const html = buildContractHtml(status, c);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

export default function NegotiationContractTab({ status, userId, onStatusChange }: NegotiationContractTabProps) {
  const { toast } = useToast();
  const [price, setPrice] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryConditions, setDeliveryConditions] = useState('');
  const [specialTerms, setSpecialTerms] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isRequestingAmend, setIsRequestingAmend] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (!status) return;
    const nt = status.negotiatedTerms;
    const c = status.contract;
    setPrice(nt?.pricePerUnit != null ? String(nt.pricePerUnit) : String(c.pricePerUnit || ''));
    setDeliveryDate(nt?.deliveryDate || c.deliveryDate?.split('T')[0] || '');
    setDeliveryConditions(nt?.deliveryConditions || c.deliveryConditions || '');
    setSpecialTerms(nt?.specialTerms || c.specialTerms || '');
    setIsDirty(false);
  }, [status?.id]);

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

  const c = status.contract;
  const isConfirmed = status.status === 'confirmed';
  const isLocked = isConfirmed;
  const quantity = c.quantity || 0;
  const priceNum = parseFloat(price) || 0;
  const totalPreview = priceNum * quantity;
  const isSeller = status.isSeller;

  const myWantsAmend = isSeller ? status.sellerWantsAmend : status.buyerWantsAmend;
  const otherWantsAmend = isSeller ? status.buyerWantsAmend : status.sellerWantsAmend;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`${CHAT_API}?action=save_terms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
        body: JSON.stringify({
          responseId: status.id,
          pricePerUnit: parseFloat(price) || null,
          deliveryDate: deliveryDate || null,
          deliveryConditions: deliveryConditions || null,
          specialTerms: specialTerms || null,
        }),
      });
      if (res.ok) {
        toast({ title: 'Условия сохранены', description: 'Подтверждения сторон сброшены, требуется повторное согласование' });
        setIsDirty(false);
        onStatusChange?.();
      } else {
        const d = await res.json();
        toast({ title: 'Ошибка', description: d.error, variant: 'destructive' });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestAmend = async () => {
    setIsRequestingAmend(true);
    try {
      const res = await fetch(`${CHAT_API}?action=request_amend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
        body: JSON.stringify({ responseId: status.id }),
      });
      const d = await res.json();
      if (res.ok) {
        if (d.bothWantAmend) {
          toast({ title: 'Договор разблокирован', description: 'Обе стороны согласились на поправки. Вносите изменения.' });
        } else {
          toast({ title: 'Запрос отправлен', description: 'Ожидаем согласия второй стороны на внесение поправок' });
        }
        onStatusChange?.();
      } else {
        toast({ title: 'Ошибка', description: d.error, variant: 'destructive' });
      }
    } finally {
      setIsRequestingAmend(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* Стороны */}
      <div className="border rounded-lg p-3 space-y-2">
        <h4 className="font-medium flex items-center gap-2 text-sm">
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

      {/* Товар (только чтение) */}
      <div className="bg-muted/50 rounded-lg p-3 space-y-1.5 text-sm">
        <h4 className="font-medium">{c.title || c.productName}</h4>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <div><span className="text-muted-foreground">Товар: </span><span>{c.productName}</span></div>
          <div><span className="text-muted-foreground">Кол-во: </span><span>{c.quantity} {c.unit}</span></div>
          <div><span className="text-muted-foreground">Срок контракта: </span><span>{formatDate(c.contractStartDate)} — {formatDate(c.contractEndDate)}</span></div>
          {c.deliveryAddress && (
            <div className="col-span-2"><span className="text-muted-foreground">Адрес: </span><span>{c.deliveryAddress}</span></div>
          )}
        </div>
      </div>

      {/* Редактируемые условия */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm flex items-center gap-1.5">
            <Icon name="FilePen" size={14} />
            Условия договора
          </h4>
          {isLocked && (
            <span className="text-xs text-green-600 flex items-center gap-1">
              <Icon name="Lock" size={12} />
              Договор подписан
            </span>
          )}
        </div>

        {/* Цена */}
        <div className="space-y-1">
          <Label className="text-xs">Цена за единицу ({c.unit}), ₽</Label>
          <div className="flex gap-2 items-center">
            <Input
              type="number"
              value={price}
              onChange={e => { setPrice(e.target.value); setIsDirty(true); }}
              disabled={isLocked}
              className="h-8 text-sm"
              placeholder="0"
            />
            {quantity > 0 && priceNum > 0 && (
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                Итого: {formatAmount(totalPreview, c.currency)}
              </span>
            )}
          </div>
        </div>

        {/* Срок поставки */}
        <div className="space-y-1">
          <Label className="text-xs">Срок поставки</Label>
          <Input
            type="date"
            value={deliveryDate}
            onChange={e => { setDeliveryDate(e.target.value); setIsDirty(true); }}
            disabled={isLocked}
            className="h-8 text-sm"
          />
        </div>

        {/* Условия доставки */}
        <div className="space-y-1">
          <Label className="text-xs">Условия доставки</Label>
          <Input
            value={deliveryConditions}
            onChange={e => { setDeliveryConditions(e.target.value); setIsDirty(true); }}
            disabled={isLocked}
            className="h-8 text-sm"
            placeholder="Самовывоз / Доставка продавцом / DDP и т.д."
          />
        </div>

        {/* Дополнительные оговорки */}
        <div className="space-y-1">
          <Label className="text-xs">Дополнительные оговорки</Label>
          <Textarea
            value={specialTerms}
            onChange={e => { setSpecialTerms(e.target.value); setIsDirty(true); }}
            disabled={isLocked}
            className="text-sm min-h-[80px] resize-none"
            placeholder="Условия оплаты, предоплата, гарантии, штрафы..."
          />
        </div>

        {/* Кнопка сохранить */}
        {!isLocked && isDirty && (
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="gap-1.5 w-full"
          >
            {isSaving && <Icon name="Loader2" size={14} className="animate-spin" />}
            <Icon name="Save" size={14} />
            Сохранить условия
          </Button>
        )}
      </div>

      {/* Статус согласования */}
      {isConfirmed ? (
        <div className="border-2 border-green-500 rounded-lg p-3 bg-green-50 text-green-800 flex items-start gap-2">
          <Icon name="ShieldCheck" size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-sm">Контракт согласован обеими сторонами</p>
            {status.confirmedAt && (
              <p className="text-xs mt-0.5">Дата: {new Date(status.confirmedAt).toLocaleDateString('ru-RU')}</p>
            )}
            <p className="text-xs mt-1 opacity-80">Не подлежит изменению без взаимного согласия</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 text-xs text-muted-foreground border rounded-lg p-2.5">
          <Icon name="Info" size={14} className="flex-shrink-0" />
          <span>После сохранения условий подтвердите договор кнопкой «Принять контракт»</span>
        </div>
      )}

      {/* Кнопка внести поправки (только если подтверждён) */}
      {isConfirmed && (
        <div className="border rounded-lg p-3 space-y-2 bg-amber-50/50">
          <p className="text-xs text-muted-foreground">
            {myWantsAmend
              ? otherWantsAmend
                ? 'Обе стороны запросили поправки — договор будет разблокирован.'
                : 'Вы запросили поправки. Ожидаем согласия второй стороны.'
              : 'Для внесения поправок необходимо согласие обеих сторон.'}
          </p>
          {!myWantsAmend && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRequestAmend}
              disabled={isRequestingAmend}
              className="gap-1.5 w-full border-amber-400 text-amber-700 hover:bg-amber-50"
            >
              {isRequestingAmend && <Icon name="Loader2" size={14} className="animate-spin" />}
              <Icon name="Pencil" size={14} />
              Запросить поправки к договору
            </Button>
          )}
        </div>
      )}

      {/* Ссылка на шаблон договора */}
      {c.productName && (
        <button
          onClick={() => openContractPreview(status)}
          className="w-full flex items-center justify-center gap-2 text-xs text-primary hover:text-primary/80 underline underline-offset-2 py-1"
        >
          <Icon name="FileText" size={13} />
          Просмотреть текстовый шаблон договора
        </button>
      )}
    </div>
  );
}
