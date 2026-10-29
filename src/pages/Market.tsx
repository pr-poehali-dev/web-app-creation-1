import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Icon from '@/components/ui/icon';
import MarketAssetPanel from './market/MarketAssetPanel';

interface MarketProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function Market({ isAuthenticated, onLogout }: MarketProps) {
  useScrollToTop();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const retTicker = searchParams.get('ticker');
  const retPurchase = parseInt(searchParams.get('purchaseId') || '', 10);
  const retMarket = (searchParams.get('market') || searchParams.get('tab')) === 'futures' ? 'futures' : 'shares';
  const returned = retTicker
    ? { ticker: retTicker, name: searchParams.get('name') || retTicker }
    : null;
  const purchaseId = isNaN(retPurchase) ? null : retPurchase;
  const { toast } = useToast();
  const [tab, setTab] = useState<string>(
    retMarket,
  );

  const handleShare = async () => {
    const url = `${window.location.origin}/market${tab === 'futures' ? '?tab=futures' : ''}`;
    const data = { title: 'Рынок — ЕРТТП', text: 'Котировки, графики и ИИ-обзоры по акциям и фьючерсам', url };
    if (navigator.share) {
      try {
        await navigator.share(data);
        return;
      } catch (e) {
        if ((e as Error).name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: 'Ссылка скопирована', description: 'Теперь можно отправить её в любой мессенджер' });
    } catch {
      toast({ title: 'Не удалось скопировать ссылку', description: url, variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-5xl">
        <div className="flex items-center gap-3 mb-2">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="p-2">
            <Icon name="ArrowLeft" className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Icon name="LineChart" className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold">Торги на ММВБ</h1>
          </div>
          <Button variant="outline" size="sm" onClick={handleShare} className="ml-auto gap-1.5">
            <Icon name="Share2" size={14} />
            Поделиться
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mb-6 ml-12">
          Котировки, графики и новости по фондовому и фьючерсному рынку
        </p>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="shares" className="gap-1.5">
              <Icon name="Building2" size={14} />
              Фондовый рынок
            </TabsTrigger>
            <TabsTrigger value="futures" className="gap-1.5">
              <Icon name="TrendingUpDown" size={14} fallback="TrendingUp" />
              Фьючерсы
            </TabsTrigger>
          </TabsList>

          <TabsContent value="shares">
            <MarketAssetPanel
              marketHint="shares"
              initialAsset={returned && retMarket === 'shares' ? returned : null}
              initialPurchaseId={returned && retMarket === 'shares' ? purchaseId : null}
              placeholder="Введите тикер или название акции, например SBER или Газпром"
              emptyHint="Найдите акцию или индекс, чтобы увидеть котировку, график и новости"
            />
          </TabsContent>

          <TabsContent value="futures">
            <MarketAssetPanel
              marketHint="futures"
              initialAsset={returned && retMarket === 'futures' ? returned : null}
              initialPurchaseId={returned && retMarket === 'futures' ? purchaseId : null}
              placeholder="Введите тикер фьючерса, например BRU6 (нефть Brent)"
              emptyHint="Найдите фьючерс, чтобы увидеть котировку, график и новости"
            />
          </TabsContent>
        </Tabs>

        <p className="text-[11px] text-muted-foreground text-center mt-8 pb-2">
          Данные предоставлены Московской биржей и открытыми новостными источниками.
          Материалы носят информационный характер и не являются индивидуальной инвестиционной рекомендацией.
        </p>
      </main>
      <Footer />
    </div>
  );
}
