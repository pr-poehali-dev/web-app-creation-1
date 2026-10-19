import { useEffect, useState } from 'react';
import { useMarketSearch, useMarketAsset, useMarketReview, useMarketReviewPrice, SearchResult } from './useMarketData';
import MarketSearchBox from './MarketSearchBox';
import MarketQuoteCard from './MarketQuoteCard';
import MarketNewsList from './MarketNewsList';
import MarketReviewBlock from './MarketReviewBlock';
import MarketBlueChips, { MarketFuturesList, MarketMyAssets } from './MarketBlueChips';
import Icon from '@/components/ui/icon';

interface MarketAssetPanelProps {
  marketHint: 'shares' | 'futures';
  placeholder: string;
  emptyHint: string;
  initialAsset?: SearchResult | null;
  initialPurchaseId?: number | null;
}

export default function MarketAssetPanel({ marketHint, placeholder, initialAsset, initialPurchaseId }: MarketAssetPanelProps) {
  const { query, setQuery, results, isSearching } = useMarketSearch();
  const [selected, setSelected] = useState<SearchResult | null>(initialAsset || null);

  const { quote, news, isLoadingQuote, isLoadingNews } = useMarketAsset(
    selected?.ticker || null,
    selected?.name || '',
    marketHint,
  );

  const review = useMarketReview();
  const priceKopeks = useMarketReviewPrice();

  const { loadToday, resume } = review;

  useEffect(() => {
    if (!selected) return;
    (async () => {
      const data = await loadToday(selected.ticker);
      if (data?.todayText) return;
      if (data?.todayPurchaseId) {
        resume(data.todayPurchaseId);
      } else if (initialPurchaseId && initialAsset?.ticker === selected.ticker) {
        resume(initialPurchaseId);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.ticker]);

  const handleSelect = (r: SearchResult) => {
    review.reset();
    setSelected(r);
    setQuery('');
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

      {!selected && <MarketMyAssets market={marketHint} onSelect={handleSelect} />}

      {!selected ? (
        marketHint === 'shares' ? (
          <MarketBlueChips onSelect={handleSelect} />
        ) : (
          <MarketFuturesList onSelect={handleSelect} />
        )
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
              paymentUrl={review.paymentUrl}
              sbpUrl={review.sbpUrl}
              history={review.history}
              onStartWaiting={review.startWaiting}
              priceKopeks={priceKopeks}
              onBuy={() => review.buy(selected.ticker, selected.name, marketHint)}
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