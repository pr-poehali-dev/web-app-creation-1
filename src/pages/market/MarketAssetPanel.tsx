import { useEffect, useState } from 'react';
import { useMarketSearch, useMarketAsset, useMarketReview, useMarketReviewPrice, SearchResult } from './useMarketData';
import MarketSearchBox from './MarketSearchBox';
import MarketQuoteCard from './MarketQuoteCard';
import MarketNewsList from './MarketNewsList';
import MarketReviewBlock from './MarketReviewBlock';
import MarketBlueChips, { MarketFuturesList, MarketMyAssets } from './MarketBlueChips';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import func2url from '../../../backend/func2url.json';

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

  const { toast } = useToast();

  const handleShareAsset = async () => {
    if (!selected) return;
    const base = (func2url as Record<string, string>)['og-proxy'];
    const url = `${base}?type=market&id=${encodeURIComponent(selected.ticker)}&m=${marketHint}&name=${encodeURIComponent(selected.name)}&v=1`;
    const title = `${selected.name} (${selected.ticker}) — котировка и ИИ-обзор`;
    const text = `${title}. График, новости и ИИ-обзор компании на ЕРТТП`;
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (e) {
        if ((e as Error).name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: 'Ссылка скопирована', description: 'Отправьте её в любой мессенджер' });
    } catch {
      toast({ title: 'Не удалось скопировать ссылку', description: url, variant: 'destructive' });
    }
  };

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
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={handleShareAsset} className="gap-1.5">
                <Icon name="Share2" size={14} />
                Поделиться бумагой
              </Button>
            </div>
            <MarketQuoteCard quote={quote} isLoading={isLoadingQuote} />
            <MarketReviewBlock
              ticker={selected.ticker}
              name={selected.name}
              status={review.status}
              generating={review.generating}
              reviewText={review.reviewText}
              error={review.error}
              paymentUrl={review.paymentUrl}
              sbpUrl={review.sbpUrl}
              history={review.history}
              onStartWaiting={review.startWaiting}
              priceKopeks={priceKopeks}
              onBuy={() => (review.status === 'error' && review.purchaseId ? review.resume(review.purchaseId) : review.buy(selected.ticker, selected.name, marketHint))}
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