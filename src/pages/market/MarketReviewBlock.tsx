import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { ReviewStatus, ReviewHistoryItem } from './useMarketData';

interface MarketReviewBlockProps {
  ticker: string;
  name: string;
  status: ReviewStatus;
  reviewText: string | null;
  error: string | null;
  priceKopeks: number | null;
  paymentUrl: string | null;
  sbpUrl: string | null;
  history: ReviewHistoryItem[];
  onStartWaiting: () => void;
  onBuy: () => void;
  onCheckPending: () => void;
}

export default function MarketReviewBlock({ ticker, name, status, reviewText, error, priceKopeks, paymentUrl, sbpUrl, history, onStartWaiting, onBuy, onCheckPending }: MarketReviewBlockProps) {
  const priceLabel = priceKopeks ? (priceKopeks / 100).toLocaleString('ru-RU', { minimumFractionDigits: priceKopeks % 100 === 0 ? 0 : 2 }) : null;
  useEffect(() => {
    if (status === 'pending') onCheckPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, ticker]);

  const historyBlock = history.length > 0 && (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center gap-2 font-semibold text-sm">
          <Icon name="History" size={16} />
          История обзоров
        </div>
        {history.map((h) => (
          <details key={h.id} className="border rounded-lg px-3 py-2">
            <summary className="text-sm cursor-pointer">{h.createdAt.split(' ')[0].split('-').reverse().join('.')} {h.createdAt.split(' ')[1]}</summary>
            <p className="text-sm whitespace-pre-wrap leading-relaxed mt-2">{h.text}</p>
          </details>
        ))}
      </CardContent>
    </Card>
  );

  if (status === 'paid' && reviewText) {
    return (
      <div className="space-y-4">
      <Card className="border-primary/30 bg-primary/[0.03]">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2 text-primary font-semibold">
            <Icon name="Sparkles" size={18} />
            ИИ-обзор: {name}
          </div>
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{reviewText}</p>
          <p className="text-[11px] text-muted-foreground pt-2 border-t">
            Обзор сгенерирован ИИ на основе новостей и котировок. Не является индивидуальной инвестиционной рекомендацией.
          </p>
        </CardContent>
      </Card>
      {historyBlock}
      </div>
    );
  }

  if (status === 'awaiting' && paymentUrl) {
    return (
      <Card className="border-primary/30">
        <CardContent className="p-5 space-y-3">
          <h3 className="font-semibold text-sm text-center">Выберите способ оплаты</h3>
          {sbpUrl && (
            <Button asChild className="w-full gap-2 h-12" onClick={onStartWaiting}>
              <a href={sbpUrl} target="_blank" rel="noopener noreferrer">
                <Icon name="QrCode" size={18} />
                Оплатить через СБП{priceLabel ? ` · ${priceLabel} ₽` : ''}
              </a>
            </Button>
          )}
          <Button
            variant={sbpUrl ? 'outline' : 'default'}
            className="w-full gap-2 h-12"
            onClick={() => { window.location.href = paymentUrl; }}
          >
            <Icon name="CreditCard" size={18} />
            {sbpUrl ? 'Картой или другим способом' : `Перейти к оплате${priceLabel ? ` · ${priceLabel} ₽` : ''}`}
          </Button>
          <p className="text-[11px] text-muted-foreground text-center">
            После оплаты вы вернётесь на сайт, обзор появится сам, как только банк подтвердит платёж.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
    <Card className="border-dashed">
      <CardContent className="p-5 text-center space-y-3">
        <Icon name="Sparkles" size={28} className="mx-auto text-primary/60" />
        <div>
          <h3 className="font-semibold text-sm">Получить ИИ-обзор: фундаментальный и технический анализ</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Краткий текстовый разбор динамики и новостного фона по активу «{name}»
          </p>
        </div>

        {status === 'pending' && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-2">
            <Icon name="Loader2" size={16} className="animate-spin" />
            Ожидаем подтверждение оплаты…
          </div>
        )}

        {status === 'error' && error && (
          <div className="text-sm text-destructive">{error}</div>
        )}

        {status !== 'pending' && (
          <Button onClick={onBuy} disabled={status === 'creating'} className="gap-2">
            {status === 'creating' ? (
              <Icon name="Loader2" size={16} className="animate-spin" />
            ) : (
              <Icon name="CreditCard" size={16} />
            )}
            Получить обзор{priceLabel ? ` за ${priceLabel} ₽` : ''}
          </Button>
        )}

        <p className="text-[11px] text-muted-foreground">
          Оплата через СБП или картой, Т-Банк. Обзор появится автоматически после подтверждения платежа и будет доступен весь торговый день.
        </p>
      </CardContent>
    </Card>
    {historyBlock}
    </div>
  );
}