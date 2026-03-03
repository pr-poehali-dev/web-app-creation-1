import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { useScrollToTop } from '@/hooks/useScrollToTop';

interface HomeProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function Home({ isAuthenticated, onLogout }: HomeProps) {
  useScrollToTop();
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

      <main className="container mx-auto px-4 py-4 md:py-6 flex-1">
        <div className="max-w-4xl mx-auto">
          <div className="md:hidden mb-3">
            <BackButton />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 md:mb-6">
            О нас
          </h1>

          <div className="space-y-4 md:space-y-5 text-foreground">
            <p className="text-base md:text-lg leading-relaxed">
              Единая Региональная Товарно‑Торговая Площадка (ЕРТТП) — это современная онлайн‑платформа, созданная для поддержки и развития местного бизнеса. Мы объединяем производителей, поставщиков и потребителей, формируя устойчивую экосистему региональной торговли.
            </p>
            <p className="text-base md:text-lg leading-relaxed">
              Наша цель — сделать локальный рынок более эффективным, прозрачным и доступным для всех участников.
            </p>

            <div>
              <h2 className="text-xl md:text-2xl font-bold mb-2 md:mb-3">Почему ЕРТТП — ваш надёжный партнёр?</h2>
              <p className="font-semibold mb-2 text-base md:text-lg">Для предпринимателей:</p>
              <ul className="space-y-2 md:space-y-2.5 pl-4 mb-4">
                <li className="flex gap-2">
                  <span className="text-primary font-bold text-sm">•</span>
                  <span className="text-base md:text-lg leading-relaxed"><strong>Гарантированные заказы</strong> — заключайте форвардные контракты с чёткими условиями: цена, объём, сроки поставки. Планируйте производство без риска излишков.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold text-sm">•</span>
                  <span className="text-base md:text-lg leading-relaxed"><strong>Прямые продажи</strong> — выходите на новых клиентов без посредников, увеличивайте прибыль за счёт сокращения издержек.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold text-sm">•</span>
                  <span className="text-base md:text-lg leading-relaxed"><strong>Совместные закупки</strong> — оптимизируйте расходы, объединяясь с другими участниками для выгодных оптовых заказов.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold text-sm">•</span>
                  <span className="text-base md:text-lg leading-relaxed"><strong>Простые инструменты</strong> — проводите онлайн‑аукционы, оформляйте договоры в цифровом формате, управляйте процессами в одном окне.</span>
                </li>
              </ul>
              <p className="font-semibold mb-2 text-base md:text-lg">Для потребителей:</p>
              <ul className="space-y-2 md:space-y-2.5 pl-4">
                <li className="flex gap-2">
                  <span className="text-primary font-bold text-sm">•</span>
                  <span className="text-base md:text-lg leading-relaxed"><strong>Широкий ассортимент</strong> — выбирайте из проверенных предложений в ключевых категориях: от продуктов питания до строительных материалов.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold text-sm">•</span>
                  <span className="text-base md:text-lg leading-relaxed"><strong>Надёжность поставок</strong> — работайте с проверенными поставщиками, которые выполняют обязательства по форвардным контрактам.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold text-sm">•</span>
                  <span className="text-base md:text-lg leading-relaxed"><strong>Выгодные цены</strong> — получайте доступ к оптовым условиям через совместные закупки и прямые поставки.</span>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl md:text-2xl font-bold mb-2 md:mb-3">Что вы найдёте на ЕРТТП?</h2>
              <p className="mb-2 text-base md:text-lg">Мы охватываем важнейшие сегменты региональной экономики:</p>
              <ul className="space-y-2 md:space-y-2.5 pl-4">
                <li className="flex gap-2">
                  <span className="text-primary font-bold text-sm">•</span>
                  <span className="text-base md:text-lg">сельхозпродукция местного производства;</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold text-sm">•</span>
                  <span className="text-base md:text-lg">продукты и товары первой необходимости;</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold text-sm">•</span>
                  <span className="text-base md:text-lg">строительные материалы;</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold text-sm">•</span>
                  <span className="text-base md:text-lg">энергетические и почвенно‑земельные ресурсы;</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold text-sm">•</span>
                  <span className="text-base md:text-lg">транспортные услуги.</span>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl md:text-2xl font-bold mb-2 md:mb-3">Наши преимущества для региональной экономики</h2>
              <p className="mb-2 text-base md:text-lg">ЕРТТП — это:</p>
              <ul className="space-y-2 md:space-y-2.5 pl-4">
                <li className="flex gap-2">
                  <span className="text-primary font-bold text-sm">•</span>
                  <span className="text-base md:text-lg leading-relaxed"><strong>Стабильность для бизнеса</strong> — форвардные контракты обеспечивают предсказуемость доходов и расходов, снижая влияние инфляции и рыночных колебаний.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold text-sm">•</span>
                  <span className="text-base md:text-lg leading-relaxed"><strong>Развитие локального рынка</strong> — деньги остаются в регионе, поддерживая местные предприятия и создавая рабочие места.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold text-sm">•</span>
                  <span className="text-base md:text-lg leading-relaxed"><strong>Прозрачность сделок</strong> — все операции фиксируются в системе, минимизируя риски и повышая доверие между участниками.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold text-sm">•</span>
                  <span className="text-base md:text-lg leading-relaxed"><strong>Упрощение торговли</strong> — цифровые инструменты делают процессы заключения договоров и исполнения обязательств максимально удобными.</span>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl md:text-2xl font-bold mb-2 md:mb-3">Начните работать с ЕРТТП уже сегодня!</h2>
              <p className="mb-2 text-base md:text-lg">Зарегистрируйтесь на платформе, чтобы:</p>
              <ul className="space-y-2 md:space-y-2.5 pl-4">
                <li className="flex gap-2">
                  <span className="text-primary font-bold text-sm">•</span>
                  <span className="text-base md:text-lg">расширить клиентскую базу;</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold text-sm">•</span>
                  <span className="text-base md:text-lg">оптимизировать производственные и закупочные процессы;</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold text-sm">•</span>
                  <span className="text-base md:text-lg">укрепить позиции на региональном рынке;</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold text-sm">•</span>
                  <span className="text-base md:text-lg">внести вклад в устойчивое развитие местной экономики.</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 rounded-lg border border-primary/20 mt-8">
              <p className="text-lg font-semibold">
                ЕРТТП — ваш ключ к успешному бизнесу в регионе. Присоединяйтесь, и давайте строить сильную экономику вместе!
              </p>
            </div>
            
            <div className="text-center pt-6">
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
      </main>

      <Footer />
    </div>
  );
}