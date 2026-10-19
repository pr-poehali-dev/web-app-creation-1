import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { getSession } from '@/utils/auth';
import func2url from '../../../backend/func2url.json';
import { SearchResult } from './useMarketData';

const BLUE_CHIPS: SearchResult[] = [
  { ticker: 'SBER', name: 'Сбербанк' },
  { ticker: 'GAZP', name: 'Газпром' },
  { ticker: 'LKOH', name: 'ЛУКОЙЛ' },
  { ticker: 'GMKN', name: 'Норильский никель' },
  { ticker: 'YDEX', name: 'Яндекс' },
  { ticker: 'ROSN', name: 'Роснефть' },
  { ticker: 'NVTK', name: 'НОВАТЭК' },
  { ticker: 'TATN', name: 'Татнефть' },
  { ticker: 'SNGS', name: 'Сургутнефтегаз' },
  { ticker: 'PLZL', name: 'Полюс' },
  { ticker: 'CHMF', name: 'Северсталь' },
  { ticker: 'NLMK', name: 'НЛМК' },
  { ticker: 'MAGN', name: 'ММК' },
  { ticker: 'ALRS', name: 'АЛРОСА' },
  { ticker: 'MTSS', name: 'МТС' },
  { ticker: 'MOEX', name: 'Московская биржа' },
  { ticker: 'VTBR', name: 'Банк ВТБ' },
  { ticker: 'PHOR', name: 'ФосАгро' },
  { ticker: 'OZON', name: 'Ozon' },
  { ticker: 'T', name: 'Т-Технологии' },
];

interface MarketBlueChipsProps {
  onSelect: (r: SearchResult) => void;
}

export function MarketMyAssets({ market, onSelect }: MarketBlueChipsProps & { market: 'shares' | 'futures' }) {
  const [items, setItems] = useState<(SearchResult & { reviewToday?: boolean })[]>([]);

  useEffect(() => {
    const session = getSession();
    if (!session?.id) return;
    fetch(`${func2url['ai-assist']}?action=market_my_assets&market=${market}`, {
      headers: { 'X-User-Id': String(session.id) },
    })
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .catch(() => setItems([]));
  }, [market]);

  if (items.length === 0) return null;

  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
        <Icon name="Sparkles" size={16} />
        Мои бумаги с ИИ-обзором
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {items.map((r) => (
          <button
            key={r.ticker}
            onClick={() => onSelect(r)}
            className="text-left bg-primary/5 border border-primary/30 rounded-lg px-3 py-2.5 hover:bg-primary/10 transition-colors"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium truncate">{r.name}</span>
              <span className="shrink-0 text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">{r.ticker}</span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              {r.reviewToday ? 'Обзор на сегодня готов' : 'Есть история обзоров'}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function MarketBlueChips({ onSelect }: MarketBlueChipsProps) {
  return (
    <div>
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
        <Icon name="Star" size={16} />
        Голубые фишки Мосбиржи
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {BLUE_CHIPS.map((r) => (
          <button
            key={r.ticker}
            onClick={() => onSelect(r)}
            className="text-left bg-card border rounded-lg px-3 py-2.5 hover:bg-muted transition-colors flex items-center justify-between gap-2"
          >
            <span className="text-sm font-medium truncate">{r.name}</span>
            <span className="shrink-0 text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">{r.ticker}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

interface FutureItem extends SearchResult {
  expiry?: string;
}

const fmtExpiry = (d?: string) => (d ? d.split('-').reverse().join('.') : '');

export function MarketFuturesList({ onSelect }: MarketBlueChipsProps) {
  const [items, setItems] = useState<FutureItem[] | null>(null);

  useEffect(() => {
    fetch(`${func2url['ai-assist']}?action=market_futures_list`)
      .then((r) => r.json())
      .then((d) => setItems(d.items || []))
      .catch(() => setItems([]));
  }, []);

  if (items === null) {
    return (
      <div className="flex justify-center py-12 text-muted-foreground">
        <Icon name="Loader2" size={24} className="animate-spin" />
      </div>
    );
  }
  if (items.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
        <Icon name="Star" size={16} />
        Активные фьючерсы на голубые фишки и ключевые активы
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {items.map((r) => (
          <button
            key={r.ticker}
            onClick={() => onSelect(r)}
            className="text-left bg-card border rounded-lg px-3 py-2.5 hover:bg-muted transition-colors"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium truncate">{r.name}</span>
              <span className="shrink-0 text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">{r.ticker}</span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">до {fmtExpiry(r.expiry)}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
