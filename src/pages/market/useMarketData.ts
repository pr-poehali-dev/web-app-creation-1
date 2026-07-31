import { useState, useCallback, useRef, useEffect } from 'react';
import func2url from '../../../backend/func2url.json';
import { getSession, getJwtToken } from '@/utils/auth';

const AI_ASSIST_API = func2url['ai-assist'];
const TBANK_PAYMENT_API = func2url['tbank-payment'];
const SITE_SETTINGS_API = func2url['site-settings'];

export interface SearchResult {
  ticker: string;
  name: string;
  shortname?: string;
  type?: string;
}

export interface Candle {
  date: string;
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
}

export interface Quote {
  ticker: string;
  name: string;
  last: number | null;
  change: number | null;
  changePercent: number | null;
  open: number | null;
  high: number | null;
  low: number | null;
  updateTime: string | null;
  candles: Candle[];
  market: string;
  engine: string;
  error?: string;
}

export interface NewsItem {
  title: string;
  link: string;
  date: string;
  description: string;
}

export function useMarketSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      return;
    }
    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${AI_ASSIST_API}?action=market_search&q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
        }
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  return { query, setQuery, results, isSearching };
}

export function useMarketAsset(ticker: string | null, name: string, marketHint: string) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [isLoadingNews, setIsLoadingNews] = useState(false);

  const loadQuote = useCallback(async () => {
    if (!ticker) return;
    setIsLoadingQuote(true);
    try {
      const res = await fetch(`${AI_ASSIST_API}?action=market_quote&ticker=${encodeURIComponent(ticker)}&market=${encodeURIComponent(marketHint)}`);
      const data = await res.json();
      setQuote(data);
    } catch {
      setQuote({ ticker, name, last: null, change: null, changePercent: null, open: null, high: null, low: null, updateTime: null, candles: [], market: '', engine: '', error: 'Не удалось загрузить котировку' });
    } finally {
      setIsLoadingQuote(false);
    }
  }, [ticker, name, marketHint]);

  const loadNews = useCallback(async () => {
    if (!ticker) return;
    setIsLoadingNews(true);
    try {
      const res = await fetch(`${AI_ASSIST_API}?action=market_news&ticker=${encodeURIComponent(ticker)}&name=${encodeURIComponent(name)}`);
      const data = await res.json();
      setNews(data.news || []);
    } catch {
      setNews([]);
    } finally {
      setIsLoadingNews(false);
    }
  }, [ticker, name]);

  useEffect(() => {
    if (!ticker) { setQuote(null); setNews([]); return; }
    loadQuote();
    loadNews();
  }, [ticker, loadQuote, loadNews]);

  return { quote, news, isLoadingQuote, isLoadingNews, reload: () => { loadQuote(); loadNews(); } };
}

export function useMarketReviewPrice() {
  const [priceKopeks, setPriceKopeks] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${SITE_SETTINGS_API}?key=market_review_price_kopeks`);
        if (res.ok) {
          const data = await res.json();
          const value = parseInt(data?.setting_value, 10);
          if (!cancelled && !isNaN(value)) setPriceKopeks(value);
        }
      } catch {
        // тихо игнорируем — компонент покажет цену по умолчанию
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return priceKopeks;
}

export type ReviewStatus = 'idle' | 'creating' | 'pending' | 'paid' | 'error';

export function useMarketReview() {
  const [status, setStatus] = useState<ReviewStatus>('idle');
  const [reviewText, setReviewText] = useState<string | null>(null);
  const [purchaseId, setPurchaseId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const buy = useCallback(async (ticker: string, name: string) => {
    const token = getJwtToken();
    const session = getSession();
    if (!token || !session) {
      setError('Войдите в аккаунт, чтобы купить обзор');
      setStatus('error');
      return;
    }
    setStatus('creating');
    setError(null);
    try {
      const res = await fetch(`${TBANK_PAYMENT_API}?action=pay-market-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ticker, name }),
      });
      const data = await res.json();
      if (data.ok && data.payment_url) {
        setPurchaseId(data.purchaseId);
        window.open(data.payment_url, '_blank');
        setStatus('pending');
      } else {
        setError(data.error || 'Не удалось создать платёж');
        setStatus('error');
      }
    } catch {
      setError('Ошибка соединения');
      setStatus('error');
    }
  }, []);

  const fetchReview = useCallback(async (id: number, ticker: string, name: string) => {
    const token = getJwtToken();
    const session = getSession();
    if (!token || !session?.id) return;
    try {
      const res = await fetch(AI_ASSIST_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': String(session.id) },
        body: JSON.stringify({ action: 'market_review', purchaseId: id, ticker, name }),
      });
      const data = await res.json();
      if (res.ok && data.result) {
        setReviewText(data.result);
        setStatus('paid');
        if (pollRef.current) clearInterval(pollRef.current);
      }
    } catch {
      // тихо игнорируем, попробуем на следующем тике поллинга
    }
  }, []);

  const checkPending = useCallback((ticker: string, name: string) => {
    if (!purchaseId) return;
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      fetchReview(purchaseId, ticker, name);
    }, 4000);
  }, [purchaseId, fetchReview]);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setReviewText(null);
    setPurchaseId(null);
    setError(null);
    if (pollRef.current) clearInterval(pollRef.current);
  }, []);

  return { status, reviewText, error, buy, checkPending, reset };
}