import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { useSiteContent } from '@/hooks/useSiteContent';

interface HomeProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

const FALLBACK_HTML = `<p>ЕРТТП — это интеллектуальная онлайн‑площадка, созданная для поддержки и развития местного бизнеса. Мы объединяем производителей, поставщиков и потребителей, формируя устойчивую экосистему на местном рынке.</p>
<p>Наша цель  — развитие местной экономики, сделать локальный рынок более эффективным, прозрачным и доступным для всех участников, создавая конкурентные условия, где главным преимуществом становится качество товаров и услуг и надежность поставщиков.</p>
<h2>Почему ЕРТТП — ваш надёжный партнёр?</h2>
<h3>Возможность для предпринимателей:</h3>
<p><strong>Плановое производство/поставки без излишков перепроизводства/поставки:</strong></p>
<ul>
<li><strong>Гарантированные заказы</strong> — заключайте форвардные контракты с чёткими условиями: цена, объём, сроки поставки.</li>
<li><strong>Простые инструменты</strong> — проводите онлайн‑аукционы, оформляйте договоры в цифровом формате, управляйте процессами в одном окне.</li>
</ul>
<p><strong>Анализ потребностей местного рынка в той или иной продукции и услуг:</strong></p>
<ul>
<li>Выставляйте свои предложения на свою продукцию/услуги, мониторьте запросы и предпочтения потребителей.</li>
<li><strong>Совместные закупки</strong> — оптимизируйте расходы, объединяясь с другими участниками для выгодных оптовых заказов.</li>
</ul>
<p><strong>Финансирование от конечных потребителей, уменьшение зависимость от кредитных средств:</strong></p>
<ul>
<li><strong>Прямые продажи</strong> — выходите на новых клиентов напрямую, получайте финансирование на производства и поставки напрямую от конечных потребителей, увеличивайте прибыль за счёт сокращения финансовой нагрузки.</li>
</ul>
<h3>Для потребителей:</h3>
<ul>
<li><strong>Широкий ассортимент</strong> — выбирайте из проверенных предложений в ключевых категориях: от продуктов питания до строительных материалов.</li>
<li><strong>Надёжность поставок</strong> — работайте с проверенными поставщиками.</li>
<li><strong>Выгодные цены</strong> — получайте доступ к оптовым условиям через совместные закупки и прямые поставки.</li>
<li><strong>Прозрачность сделок</strong> — все операции фиксируются в системе, минимизируя риски.</li>
<li><strong>Осознанный выбор</strong> — ориентируйтесь на рейтинги и отзывы других пользователей.</li>
<li><strong>Упрощение торговли</strong> — цифровые инструменты делают процессы максимально удобными.</li>
</ul>
<h2>Что Вы найдете на ЕРТТП:</h2>
<ul>
<li><strong>Стабильность для бизнеса</strong> — предзаказы и форвардные контракты обеспечивают предсказуемость доходов и расходов и планировать производства и поставки.</li>
<li><strong>Развитие локального рынка</strong> — деньги остаются в регионе, поддерживая местные предприятия и повышая товарооборот в регионе, создавая новые рабочие места.</li>
<li><strong>Система репутации</strong> — мы стимулируем добросовестную работу и качество товаров и услуг: участники с высоким рейтингом получают приоритет на площадке.</li>
<li><strong>Репутация — ваш актив</strong> — чем выше оценка Вашей продукции/услуг и уровень доверия надежности на площадке, тем больше заказов и откликов вы получаете.</li>
<li><strong>Честная конкуренция</strong> — на платформе создаются равные условия для всех, исключая дискриминацию ценообразования.</li>
</ul>
<h2>Начните работать с ЕРТТП уже сегодня!</h2>
<p>Зарегистрируйтесь на платформе, чтобы расширить клиентскую базу, оптимизировать процессы и укрепить позиции на местном рынке.</p>`;

export default function Home({ isAuthenticated, onLogout }: HomeProps) {
  useScrollToTop();
  const { toast } = useToast();

  const content = useSiteContent(['about.page']);
  const pageHtml = content['about.page'] || FALLBACK_HTML;

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

          <div
            className="about-rich-content text-foreground text-[15px] md:text-base leading-relaxed"
            dangerouslySetInnerHTML={{ __html: pageHtml }}
          />

          <div className="text-center py-6">
            <Link
              to="/register"
              onClick={handleJoinClick}
              className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 md:px-8 py-3 md:py-3.5 rounded-lg text-base md:text-lg font-semibold hover:bg-primary/90 transition-all shadow-md"
            >
              Зарегистрироваться
              <Icon name="ArrowRight" className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}