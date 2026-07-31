import { useState } from 'react';
import { useMarketSearch, useMarketAsset, useMarketReview, useMarketReviewPrice, SearchResult } from './useMarketData';
import MarketSearchBox from './MarketSearchBox';
import MarketQuoteCard from './MarketQuoteCard';
import MarketNewsList from './MarketNewsList';
import MarketReviewBlock from './MarketReviewBlock';
import Icon from '@/components/ui/icon';

interface MarketAssetPanelProps {
  marketHint: 'shares' | 'futures';
  placeholder: string;
  emptyHint: string;
}

export default function MarketAssetPanel({ marketHint, placeholder, emptyHint }: MarketAssetPanelProps) {
  const { query, setQuery, results, isSearching } = useMarketSearch();
  const [selected, setSelected] = useState<SearchResult | null>(null);

  const { quote, news, isLoadingQuote, isLoadingNews } = useMarketAsset(
    selected?.ticker || null,
    selected?.name || '',
    marketHint,
  );

  const review = useMarketReview();
  const priceKopeks = useMarketReviewPrice();

  const handleSelect = (r: SearchResult) => {
    setSelected(r);
    setQuery('');
    review.reset();
  };

  return (
    <div className="space-y-4">
      <MarketSearchBox
        query={query}
        onQueryChange={setQuery}
        results={results}
        isSearching={isSearching}
        onSelect={handleSelect}
        placeholder={placeholder}
      />

      {!selected ? (
        <div className="text-center py-16 text-muted-foreground">
          <Icon name="LineChart" size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">{emptyHint}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <MarketQuoteCard quote={quote} isLoading={isLoadingQuote} />
            <MarketReviewBlock
              ticker={selected.ticker}
              name={selected.name}
              status={review.status}
              reviewText={review.reviewText}
              error={review.error}
              priceKopeks={priceKopeks}
              onBuy={() => review.buy(selected.ticker, selected.name)}
              onCheckPending={() => review.checkPending(selected.ticker, selected.name)}
            />
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <Icon name="Newspaper" size={16} />
              Свежие новости
            </h3>
            <MarketNewsList news={news} isLoading={isLoadingNews} />
          </div>
        </div>
      )}
    </div>
  );
}