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

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-8 bg-gradient-to-r from-primary/10 to-primary/5 p-8 rounded-lg border border-primary/20">
          <h1 className="text-4xl font-bold text-foreground mb-6">
            «Единая региональная торговая площадка» (ЕРТП) - это Ваш ключ к успешной торговле!
          </h1>
          <div className="space-y-4">
            <p className="text-lg font-semibold text-foreground">
              Увеличьте продажи, оптимизируйте производство, привлекайте инвестиции – все это с Единой региональной торговой площадкой!
            </p>
            <p className="text-lg font-semibold text-foreground">
              ЕРТП – это ваш инструмент для процветания на местном рынке. Мы предлагаем:
            </p>
            <ul className="space-y-3 pl-5">
              <li className="flex gap-2">
                <span className="text-primary font-bold text-xl">•</span>
                <span className="text-base text-foreground/90"><strong className="text-foreground">Гарантированный сбыт вашей продукции:</strong> забудьте о проблемах с реализацией – ЕРТП предоставит вам прямой доступ к вашей целевой аудитории.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold text-xl">•</span>
                <span className="text-base text-foreground/90"><strong className="text-foreground">Оптимизацию производственных и логистических процессов:</strong> анализируйте рыночный спрос и планируйте свою деятельность на основе реальных данных.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold text-xl">•</span>
                <span className="text-base text-foreground/90"><strong className="text-foreground">Новые возможности для финансирования:</strong> получите средства на развитие своего бизнеса напрямую от потребителей через инновационные механизмы предоплаты и гарантированных поставок.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-bold text-xl">•</span>
                <span className="text-base text-foreground/90"><strong className="text-foreground">Выгоду потребителям:</strong> возможность выставлять заявки на покупку товаров и услуг на своих условиях, получать скидки и гарантии сроков поставки по заранее оговоренной цене и минимизировать риски изменения цен, срыва сроков поставки.</span>
              </li>
            </ul>
            <p className="text-lg font-bold text-foreground pt-2">
              ЕРТП – это не просто торговая площадка, это ваш партнер по развитию вашего бизнеса!
            </p>
            <p className="text-lg font-semibold text-foreground">
              Зарегистрируйтесь на ЕРТП сегодня и начните развивать местную экономику вместе с нами!
            </p>
            <div className="text-center pt-2">
              <Link to="/register" className="inline-block font-bold text-primary text-xl hover:text-primary/80 transition-colors underline">
                Присоединяйтесь!
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}