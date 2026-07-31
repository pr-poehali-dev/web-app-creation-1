import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { SearchResult } from './useMarketData';

interface MarketSearchBoxProps {
  query: string;
  onQueryChange: (v: string) => void;
  results: SearchResult[];
  isSearching: boolean;
  onSelect: (r: SearchResult) => void;
  placeholder?: string;
}

export default function MarketSearchBox({ query, onQueryChange, results, isSearching, onSelect, placeholder }: MarketSearchBoxProps) {
  return (
    <div className="relative">
      <div className="relative">
        <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={placeholder || 'Введите тикер или название, например SBER или Газпром'}
          className="pl-10 h-12 text-base"
        />
        {isSearching && (
          <Icon name="Loader2" size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin" />
        )}
      </div>

      {results.length > 0 && (
        <div className="absolute z-20 mt-1 w-full bg-card border rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {results.map((r) => (
            <button
              key={r.ticker}
              onClick={() => onSelect(r)}
              className="w-full text-left px-4 py-2.5 hover:bg-muted transition-colors flex items-center justify-between gap-3 border-b last:border-b-0"
            >
              <div className="min-w-0">
                <div className="font-medium text-sm truncate">{r.name}</div>
                {r.shortname && <div className="text-xs text-muted-foreground truncate">{r.shortname}</div>}
              </div>
              <span className="shrink-0 text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">
                {r.ticker}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
