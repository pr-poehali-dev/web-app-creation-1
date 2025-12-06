import { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
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

interface HomeProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

const ITEMS_PER_PAGE = 20;

export default function Home({ isAuthenticated, onLogout }: HomeProps) {

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />

      <main className="container mx-auto px-4 py-6 md:py-8 lg:py-10 flex-1">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-primary/15 via-primary/8 to-primary/5 p-5 md:p-8 lg:p-10 rounded-xl md:rounded-2xl border-2 border-primary/30 shadow-lg">
            <h1 className="text-xl md:text-3xl lg:text-4xl font-extrabold text-foreground mb-5 md:mb-6 leading-tight text-center">
              «Единая региональная торговая площадка» - это Ваш ключ к успешной торговле!
            </h1>
            
            <div className="space-y-4 md:space-y-5">
              <p className="text-base md:text-lg lg:text-xl font-semibold text-foreground/90 leading-relaxed text-center">
                Увеличьте продажи, оптимизируйте производство, привлекайте инвестиции – все это с Единой региональной торговой площадкой!
              </p>
              
              <div className="h-px bg-primary/20 my-4 md:my-5"></div>
              
              <p className="text-base md:text-lg font-semibold text-foreground leading-relaxed">
                ЕРТП – это ваш инструмент для процветания на местном рынке. Мы предлагаем:
              </p>
              
              <ul className="space-y-3 md:space-y-4 pl-1 md:pl-2">
                <li className="flex gap-2 md:gap-3 items-start group">
                  <div className="flex-shrink-0 w-6 h-6 md:w-7 md:h-7 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                    <Icon name="CheckCircle2" className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  </div>
                  <span className="text-sm md:text-base text-foreground leading-relaxed">
                    <strong className="font-semibold text-foreground">Гарантированный сбыт вашей продукции:</strong>{' '}
                    <span className="text-foreground/85 font-normal">забудьте о проблемах с реализацией – ЕРТП предоставит вам прямой доступ к вашей целевой аудитории.</span>
                  </span>
                </li>
                
                <li className="flex gap-2 md:gap-3 items-start group">
                  <div className="flex-shrink-0 w-6 h-6 md:w-7 md:h-7 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                    <Icon name="CheckCircle2" className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  </div>
                  <span className="text-sm md:text-base text-foreground leading-relaxed">
                    <strong className="font-semibold text-foreground">Оптимизацию производственных и логистических процессов:</strong>{' '}
                    <span className="text-foreground/85 font-normal">анализируйте рыночный спрос и планируйте свою деятельность на основе реальных данных.</span>
                  </span>
                </li>
                
                <li className="flex gap-2 md:gap-3 items-start group">
                  <div className="flex-shrink-0 w-6 h-6 md:w-7 md:h-7 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                    <Icon name="CheckCircle2" className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  </div>
                  <span className="text-sm md:text-base text-foreground leading-relaxed">
                    <strong className="font-semibold text-foreground">Новые возможности для финансирования:</strong>{' '}
                    <span className="text-foreground/85 font-normal">получите средства на развитие своего бизнеса напрямую от потребителей через инновационные механизмы предоплаты и гарантированных поставок.</span>
                  </span>
                </li>
                
                <li className="flex gap-2 md:gap-3 items-start group">
                  <div className="flex-shrink-0 w-6 h-6 md:w-7 md:h-7 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                    <Icon name="CheckCircle2" className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  </div>
                  <span className="text-sm md:text-base text-foreground leading-relaxed">
                    <strong className="font-semibold text-foreground">Выгоду потребителям:</strong>{' '}
                    <span className="text-foreground/85 font-normal">возможность выставлять заявки на покупку товаров и услуг на своих условиях, получать скидки и гарантии сроков поставки по заранее оговоренной цене и минимизировать риски изменения цен, срыва сроков поставки.</span>
                  </span>
                </li>
              </ul>
              
              <div className="h-px bg-primary/20 my-4 md:my-5"></div>
              
              <p className="text-base md:text-lg lg:text-xl font-bold text-foreground pt-2 md:pt-3 leading-relaxed text-center">
                ЕРТП – это не просто торговая площадка, это ваш партнер по развитию вашего бизнеса!
              </p>
              
              <p className="text-base md:text-lg font-semibold text-foreground/90 leading-relaxed text-center">
                Зарегистрируйтесь на ЕРТП сегодня и начните развивать местную экономику вместе с нами!
              </p>
              
              <div className="text-center pt-4 md:pt-5">
                <Link 
                  to="/register" 
                  className="inline-flex items-center gap-2 md:gap-3 bg-primary text-primary-foreground px-6 md:px-8 py-2.5 md:py-3 rounded-lg md:rounded-xl text-base md:text-lg font-semibold hover:bg-primary/90 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Присоединяйтесь!
                  <Icon name="ArrowRight" className="h-5 w-5 md:h-6 md:w-6" />
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