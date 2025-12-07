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

      <main className="container mx-auto px-3 py-4 md:py-6 flex-1">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-br from-primary/15 via-primary/8 to-primary/5 p-4 md:p-6 rounded-lg md:rounded-xl border border-primary/30 shadow-md">
            <h1 className="text-lg md:text-2xl font-bold text-foreground mb-3 md:mb-4 leading-tight text-center">
              «Единая региональная товарно-торговая площадка» - это Ваш ключ к успешной торговле!
            </h1>
            
            <div className="space-y-3 md:space-y-4">
              <p className="text-sm md:text-base font-semibold text-foreground/90 leading-snug text-center">
                Увеличьте продажи, оптимизируйте производство, привлекайте инвестиции!
              </p>
              
              <div className="h-px bg-primary/20 my-3"></div>
              
              <p className="text-sm md:text-base font-semibold text-foreground leading-snug">
                ЕРТТП предлагает:
              </p>
              
              <ul className="space-y-2 md:space-y-3 pl-0">
                <li className="flex gap-2 items-start">
                  <Icon name="CheckCircle2" className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-xs md:text-sm text-foreground/90 leading-snug">
                    <strong className="font-semibold">Гарантированный сбыт</strong> — прямой доступ к целевой аудитории
                  </span>
                </li>
                
                <li className="flex gap-2 items-start">
                  <Icon name="CheckCircle2" className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-xs md:text-sm text-foreground/90 leading-snug">
                    <strong className="font-semibold">Оптимизация процессов</strong> — планирование на основе реальных данных
                  </span>
                </li>
                
                <li className="flex gap-2 items-start">
                  <Icon name="CheckCircle2" className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-xs md:text-sm text-foreground/90 leading-snug">
                    <strong className="font-semibold">Финансирование</strong> — предоплата от потребителей напрямую
                  </span>
                </li>
                
                <li className="flex gap-2 items-start">
                  <Icon name="CheckCircle2" className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-xs md:text-sm text-foreground/90 leading-snug">
                    <strong className="font-semibold">Выгода потребителям</strong> — фиксированные цены и гарантии поставки
                  </span>
                </li>
              </ul>
              
              <div className="h-px bg-primary/20 my-3"></div>
              
              <p className="text-sm md:text-base font-semibold text-foreground leading-snug text-center">
                Зарегистрируйтесь и начните развивать свой бизнес вместе с нами!
              </p>
              
              <div className="text-center pt-3">
                <Link 
                  to="/register" 
                  onClick={handleJoinClick}
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 md:px-6 py-2 md:py-2.5 rounded-lg text-sm md:text-base font-semibold hover:bg-primary/90 transition-all shadow-md"
                >
                  Присоединяйтесь!
                  <Icon name="ArrowRight" className="h-4 w-4" />
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