import { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import SearchBlock from '@/components/SearchBlock';
import OfferCard from '@/components/OfferCard';
import OfferCardSkeleton from '@/components/OfferCardSkeleton';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import type { SearchFilters } from '@/types/offer';
import { MOCK_OFFERS } from '@/data/mockOffers';
import { searchOffers } from '@/utils/searchUtils';
import { addToSearchHistory } from '@/utils/searchHistory';
import { useDistrict } from '@/contexts/DistrictContext';
import { useToast } from '@/hooks/use-toast';

interface HomeProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

const ITEMS_PER_PAGE = 20;

export default function Home({ isAuthenticated, onLogout }: HomeProps) {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleJoinClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isAuthenticated) {
      e.preventDefault();
      toast({
        title: "Вы уже с нами!",
        description: "Вы авторизованы и можете пользоваться возможностями платформы",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />

      <main className="container mx-auto px-3 py-6 md:py-8 flex-1">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-primary/15 via-primary/8 to-primary/5 p-6 md:p-10 rounded-lg md:rounded-xl border border-primary/30 shadow-md">
            <h1 className="text-[21px] md:text-[27px] font-bold text-foreground mb-4 md:mb-5 leading-tight text-center">
              «Единая региональная товарно-торговая площадка» - это Ваш ключ к успешной торговле!
            </h1>
            
            <div className="space-y-4 md:space-y-5">
              <p className="text-[17px] md:text-xl font-semibold text-foreground leading-snug">
                ЕРТТП предлагает:
              </p>
              
              <ul className="space-y-2.5 md:space-y-3 pl-0">
                <li className="flex gap-3 items-start">
                  <span className="text-2xl md:text-3xl flex-shrink-0 leading-none text-primary">✓</span>
                  <span className="text-xl md:text-[22px] text-foreground/90 leading-snug">
                    <strong className="font-semibold">Сбыт:</strong> Прямой доступ к клиентам + новые рынки в регионе.
                  </span>
                </li>
                
                <li className="flex gap-3 items-start">
                  <span className="text-2xl md:text-3xl flex-shrink-0 leading-none text-primary">✓</span>
                  <span className="text-xl md:text-[22px] text-foreground/90 leading-snug">
                    <strong className="font-semibold">Оптимизация:</strong> Точное планирование + анализ спроса и предложения в реальном времени.
                  </span>
                </li>
                
                <li className="flex gap-3 items-start">
                  <span className="text-2xl md:text-3xl flex-shrink-0 leading-none text-primary">✓</span>
                  <span className="text-xl md:text-[22px] text-foreground/90 leading-snug">
                    <strong className="font-semibold">Финансирование:</strong> Предоплата от потребителей напрямую по контрактам.
                  </span>
                </li>
                
                <li className="flex gap-3 items-start">
                  <span className="text-2xl md:text-3xl flex-shrink-0 leading-none text-primary">✓</span>
                  <span className="text-xl md:text-[22px] text-foreground/90 leading-snug">
                    <strong className="font-semibold">Клиентам:</strong> Фиксированные цены, гарантии сроков поставки.
                  </span>
                </li>
              </ul>
              
              <div className="h-px bg-primary/20 my-4"></div>
              
              <div className="text-center pt-2">
                <Link 
                  to="/register" 
                  onClick={handleJoinClick}
                  className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 md:px-8 py-3 md:py-3.5 rounded-lg text-base md:text-lg font-semibold hover:bg-primary/90 transition-all shadow-md"
                >
                  Зарегистрируйтесь и начните развивать свой бизнес вместе с нами!
                  <Icon name="ArrowRight" className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}