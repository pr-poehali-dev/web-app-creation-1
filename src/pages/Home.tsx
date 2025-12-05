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

      <main className="container mx-auto px-4 py-12 lg:py-16 flex-1">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-br from-primary/15 via-primary/8 to-primary/5 p-10 md:p-14 lg:p-16 rounded-2xl border-2 border-primary/30 shadow-xl">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground mb-8 leading-[1.2] text-center">
              «Единая региональная торговая площадка» - это Ваш ключ к успешной торговле!
            </h1>
            
            <div className="space-y-7">
              <p className="text-lg md:text-xl lg:text-2xl font-semibold text-foreground/90 leading-relaxed text-center">
                Увеличьте продажи, оптимизируйте производство, привлекайте инвестиции – все это с Единой региональной торговой площадкой!
              </p>
              
              <div className="h-px bg-primary/20 my-6"></div>
              
              <p className="text-lg md:text-xl font-semibold text-foreground leading-relaxed">
                ЕРТП – это ваш инструмент для процветания на местном рынке. Мы предлагаем:
              </p>
              
              <ul className="space-y-5 pl-2">
                <li className="flex gap-4 items-start group">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                    <Icon name="CheckCircle2" className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-base md:text-lg text-foreground leading-relaxed">
                    <strong className="font-semibold text-foreground">Гарантированный сбыт вашей продукции:</strong>{' '}
                    <span className="text-foreground/85 font-normal">забудьте о проблемах с реализацией – ЕРТП предоставит вам прямой доступ к вашей целевой аудитории.</span>
                  </span>
                </li>
                
                <li className="flex gap-4 items-start group">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                    <Icon name="CheckCircle2" className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-base md:text-lg text-foreground leading-relaxed">
                    <strong className="font-semibold text-foreground">Оптимизацию производственных и логистических процессов:</strong>{' '}
                    <span className="text-foreground/85 font-normal">анализируйте рыночный спрос и планируйте свою деятельность на основе реальных данных.</span>
                  </span>
                </li>
                
                <li className="flex gap-4 items-start group">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                    <Icon name="CheckCircle2" className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-base md:text-lg text-foreground leading-relaxed">
                    <strong className="font-semibold text-foreground">Новые возможности для финансирования:</strong>{' '}
                    <span className="text-foreground/85 font-normal">получите средства на развитие своего бизнеса напрямую от потребителей через инновационные механизмы предоплаты и гарантированных поставок.</span>
                  </span>
                </li>
                
                <li className="flex gap-4 items-start group">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                    <Icon name="CheckCircle2" className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-base md:text-lg text-foreground leading-relaxed">
                    <strong className="font-semibold text-foreground">Выгоду потребителям:</strong>{' '}
                    <span className="text-foreground/85 font-normal">возможность выставлять заявки на покупку товаров и услуг на своих условиях, получать скидки и гарантии сроков поставки по заранее оговоренной цене и минимизировать риски изменения цен, срыва сроков поставки.</span>
                  </span>
                </li>
              </ul>
              
              <div className="h-px bg-primary/20 my-6"></div>
              
              <p className="text-lg md:text-xl lg:text-2xl font-bold text-foreground pt-3 leading-relaxed text-center">
                ЕРТП – это не просто торговая площадка, это ваш партнер по развитию вашего бизнеса!
              </p>
              
              <p className="text-lg md:text-xl font-semibold text-foreground/90 leading-relaxed text-center">
                Зарегистрируйтесь на ЕРТП сегодня и начните развивать местную экономику вместе с нами!
              </p>
              
              <div className="text-center pt-6">
                <Link 
                  to="/register" 
                  className="inline-flex items-center gap-3 bg-primary text-primary-foreground px-8 py-3.5 rounded-xl text-lg md:text-xl font-semibold hover:bg-primary/90 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Присоединяйтесь!
                  <Icon name="ArrowRight" className="h-6 w-6" />
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