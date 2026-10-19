import Icon from '@/components/ui/icon';
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
