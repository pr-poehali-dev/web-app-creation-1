import { useState, useEffect } from 'react';
import type { Request } from '@/types/offer';
import { requestsAPI, ordersAPI } from '@/services/api';
import { SmartCache, checkForUpdates } from '@/utils/smartCache';
import { showLoading, hideLoading } from '@/components/TopLoadingBar';
import { dataSync } from '@/utils/dataSync';
import { filterActiveRequests } from '@/utils/expirationFilter';
import { useOffers } from '@/contexts/OffersContext';
import { useToast } from '@/hooks/use-toast';

export function useRequestsData() {
  const { deleteRequest, setRequests: setGlobalRequests } = useOffers();
  const { toast } = useToast();
  const [requests, setRequests] = useState<Request[]>([]);
  const [orders, setOrders] = useState<Record<string, unknown>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    let isLoadingFlag = false;

    const loadFreshRequests = async (showSpinner = true) => {
      showLoading();
      if (showSpinner) {
        setIsLoading(true);
      } else {
        setIsSyncing(true);
      }

      try {
        const [requestsData, ordersResponse] = await Promise.all([
          requestsAPI.getAll(),
          ordersAPI.getAll('all'),
        ]);

        const loadedRequests = filterActiveRequests(requestsData.requests || []);
        setRequests(loadedRequests);
        setGlobalRequests(loadedRequests);
        setOrders(ordersResponse.orders || []);

        SmartCache.set('requests_list', loadedRequests);
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      } finally {
        hideLoading();
        if (showSpinner) {
          setIsLoading(false);
        } else {
          setIsSyncing(false);
        }
      }
    };

    const loadRequests = async () => {
      if (isLoadingFlag) return;
      isLoadingFlag = true;
      const hasUpdates = checkForUpdates('requests');

      // Сначала пробуем показать свежий кэш
      if (!hasUpdates) {
        const cached = SmartCache.get<Request[]>('requests_list');
        if (cached && cached.length > 0) {
          setRequests(cached);
          setIsLoading(false);
          if (SmartCache.shouldRefresh('requests_list')) {
            loadFreshRequests(false);
          }
          return;
        }
      }

      // Если нет свежего — показываем stale мгновенно, грузим в фоне
      const stale = SmartCache.getStale<Request[]>('requests_list');
      if (stale && stale.length > 0) {
        setRequests(stale);
        setIsLoading(false);
        loadFreshRequests(false);
        return;
      }

      await loadFreshRequests(true);
    };

    loadRequests();

    const unsubscribeRequests = dataSync.subscribe('request_updated', () => {
      SmartCache.invalidate('requests_list');
      loadFreshRequests(false);
    });

    const unsubscribeOrders = dataSync.subscribe('order_updated', () => {
      SmartCache.invalidate('requests_list');
      loadFreshRequests(false);
    });

    const handleStorageChange = (e: StorageEvent | Event) => {
      if ('key' in e && e.key === 'force_requests_reload') {
        console.log('🔄 Force reload requests triggered by publication');
        loadFreshRequests(true);
      } else if (!('key' in e)) {
        const forceReload = localStorage.getItem('force_requests_reload');
        if (forceReload) {
          console.log('🔄 Force reload requests triggered by publication (manual)');
          localStorage.removeItem('force_requests_reload');
          loadFreshRequests(true);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    const handleGlobalRefresh = () => loadFreshRequests(false);
    window.addEventListener('globalRefresh', handleGlobalRefresh);

    return () => {
      isLoadingFlag = false;
      unsubscribeRequests();
      unsubscribeOrders();
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('globalRefresh', handleGlobalRefresh);
    };
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await requestsAPI.deleteRequest(id);
      SmartCache.invalidate('requests_list');
      deleteRequest(id);
      setRequests(prev => prev.filter(r => r.id !== id));
      toast({ title: 'Успешно', description: 'Запрос удалён' });
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось удалить запрос', variant: 'destructive' });
    }
  };

  return { requests, orders, isLoading, isSyncing, handleDelete };
}