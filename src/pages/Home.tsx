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

export default function Home({ isAuthenticated, onLogout }: HomeProps) {
  useScrollToTop();
  const { toast } = useToast();

  const aboutContent = useSiteContent(['about.title', 'about.intro1', 'about.intro2', 'about.description', 'about.content']);
  const aboutTitle = aboutContent['about.title'] || 'О нас';
  const aboutIntro1 = aboutContent['about.intro1'] || 'ЕРТТП — это современная онлайн‑платформа, созданная для поддержки и развития местного бизнеса. Мы объединяем производителей, поставщиков и потребителей, формируя устойчивую экосистему региональной торговли.';
  const aboutIntro2 = aboutContent['about.intro2'] || 'Наша цель — сделать локальный рынок более эффективным, прозрачным и доступным для всех участников, создавая конкурентные условия, где главным преимуществом становится качество товаров и услуг.';

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
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            {aboutTitle}
          </h1>
          <p className="text-xl md:text-2xl font-semibold text-primary mb-6">
            Единая Региональная Товарно‑Торговая Площадка (ЕРТТП)
          </p>

          <div className="space-y-8 text-foreground text-[15px] md:text-base leading-relaxed">
            <p>{aboutIntro1}</p>
            <p>{aboutIntro2}</p>

            <div>
              <h2 className="text-xl md:text-2xl font-bold mb-4 border-l-4 border-primary pl-3">
                Почему ЕРТТП — ваш надёжный партнёр?
              </h2>

              <h3 className="text-lg md:text-xl font-semibold mb-3 text-primary">Для предпринимателей:</h3>
              <ul className="space-y-3 mb-6">
                <li className="flex gap-3">
                  <span className="text-primary font-bold mt-0.5">•</span>
                  <span><strong>Гарантированные заказы</strong> — заключайте форвардные контракты с чёткими условиями: цена, объём, сроки поставки. Планируйте производство без риска излишков.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary font-bold mt-0.5">•</span>
                  <span><strong>Прямые продажи</strong> — выходите на новых клиентов без посредников, увеличивайте прибыль за счёт сокращения издержек.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary font-bold mt-0.5">•</span>
                  <span><strong>Совместные закупки</strong> — оптимизируйте расходы, объединяясь с другими участниками для выгодных оптовых заказов.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary font-bold mt-0.5">•</span>
                  <span><strong>Простые инструменты</strong> — проводите онлайн‑аукционы, оформляйте договоры в цифровом формате, управляйте процессами в одном окне.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary font-bold mt-0.5">•</span>
                  <span><strong>Репутация — ваш актив</strong> — чем выше ваша оценка и уровень доверия на платформе, тем больше заказов вы получаете. Мы поощряем добросовестных участников: надёжность и качество работы напрямую влияют на видимость вашего профиля и количество откликов.</span>
                </li>
              </ul>

              <h3 className="text-lg md:text-xl font-semibold mb-3 text-primary">Для потребителей:</h3>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <span className="text-primary font-bold mt-0.5">•</span>
                  <span><strong>Широкий ассортимент</strong> — выбирайте из проверенных предложений в ключевых категориях: от продуктов питания до строительных материалов.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary font-bold mt-0.5">•</span>
                  <span><strong>Надёжность поставок</strong> — работайте с проверенными поставщиками, которые выполняют обязательства по форвардным контрактам.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary font-bold mt-0.5">•</span>
                  <span><strong>Выгодные цены</strong> — получайте доступ к оптовым условиям через совместные закупки и прямые поставки.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary font-bold mt-0.5">•</span>
                  <span><strong>Осознанный выбор</strong> — ориентируйтесь на рейтинги и отзывы других пользователей. Чем выше репутация поставщика, тем увереннее можно доверять его предложениям.</span>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl md:text-2xl font-bold mb-4 border-l-4 border-primary pl-3">
                Что вы найдёте на ЕРТТП?
              </h2>
              <p className="mb-3">Мы охватываем важнейшие сегменты региональной экономики:</p>
              <ul className="space-y-2">
                {[
                  'сельхозпродукция местного производства;',
                  'продукты и товары первой необходимости;',
                  'строительные материалы;',
                  'энергетические и почвенно‑земельные ресурсы;',
                  'транспортные услуги.',
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="text-primary font-bold mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-xl md:text-2xl font-bold mb-4 border-l-4 border-primary pl-3">
                Наши преимущества для региональной экономики
              </h2>
              <p className="mb-3 font-semibold">ЕРТТП — это:</p>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <span className="text-primary font-bold mt-0.5">•</span>
                  <span><strong>Стабильность для бизнеса</strong> — форвардные контракты обеспечивают предсказуемость доходов и расходов, снижая влияние инфляции и рыночных колебаний.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary font-bold mt-0.5">•</span>
                  <span><strong>Развитие локального рынка</strong> — деньги остаются в регионе, поддерживая местные предприятия и создавая рабочие места.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary font-bold mt-0.5">•</span>
                  <span><strong>Прозрачность сделок</strong> — все операции фиксируются в системе, минимизируя риски и повышая доверие между участниками.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary font-bold mt-0.5">•</span>
                  <span><strong>Упрощение торговли</strong> — цифровые инструменты делают процессы заключения договоров и исполнения обязательств максимально удобными.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary font-bold mt-0.5">•</span>
                  <span><strong>Система репутации</strong> — мы стимулируем добросовестную работу: участники с высоким рейтингом получают приоритетное размещение и больше возможностей для привлечения клиентов. Ваша надёжность — это ваше конкурентное преимущество!</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary font-bold mt-0.5">•</span>
                  <span><strong>Честная конкуренция</strong> — на платформе создаются равные условия для всех, но успех приходит к тем, кто обеспечивает высокое качество товаров и услуг. Система рейтингов и отзывов естественным образом выделяет лучших поставщиков.</span>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl md:text-2xl font-bold mb-4 border-l-4 border-primary pl-3">
                Как работает система репутации на ЕРТТП?
              </h2>
              <ul className="space-y-2">
                {[
                  'Отзывы пользователей формируют честный рейтинг поставщиков.',
                  'Высокие оценки повышают видимость профиля и количество заказов.',
                  'Низкие оценки и негативные отзывы снижают видимость недобросовестных участников.',
                  'Покупатели получают инструмент для объективного сравнения предложений.',
                  'Поставщики мотивированы постоянно улучшать качество обслуживания.',
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="text-primary font-bold mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 rounded-xl border border-primary/20">
              <h2 className="text-xl md:text-2xl font-bold mb-4">
                Начните работать с ЕРТТП уже сегодня!
              </h2>
              <p className="mb-3">Зарегистрируйтесь на платформе, чтобы:</p>
              <ul className="space-y-2 mb-5">
                {[
                  'расширить клиентскую базу;',
                  'оптимизировать производственные и закупочные процессы;',
                  'укрепить позиции на региональном рынке;',
                  'повысить свою репутацию и увеличить поток заказов;',
                  'получить конкурентное преимущество за счёт качества ваших товаров и услуг;',
                  'внести вклад в устойчивое развитие местной экономики.',
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="text-primary font-bold mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mb-2">Мы сделали регистрацию максимально простой — всего несколько шагов, и вы уже в системе!</p>
              <p className="font-semibold text-primary">Важно: участие в платформе полностью бесплатно — никаких скрытых платежей или абонентских взносов.</p>
            </div>

            <div className="text-center py-2">
              <p className="text-lg md:text-xl font-bold mb-4">
                ЕРТТП — ваш ключ к успешному бизнесу в регионе. Присоединяйтесь, и давайте строить сильную экономику вместе!
              </p>
              <Link 
                to="/register" 
                onClick={handleJoinClick}
                className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 md:px-8 py-3 md:py-3.5 rounded-lg text-base md:text-lg font-semibold hover:bg-primary/90 transition-all shadow-md"
              >
                Зарегистрироваться бесплатно
                <Icon name="ArrowRight" className="h-5 w-5" />
              </Link>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 rounded-xl p-6">
              <h2 className="text-lg md:text-xl font-bold mb-3 text-amber-800 dark:text-amber-400 flex items-center gap-2">
                <Icon name="TriangleAlert" className="h-5 w-5" />
                Важное примечание: платформа в стадии тестирования и разработки
              </h2>
              <p className="mb-3">На данный момент сайт функционирует в тестовом режиме — мы активно дорабатываем функционал и совершенствуем пользовательский опыт.</p>
              <p className="font-semibold mb-2">Мы ценим ваше участие и обратную связь! Если вы:</p>
              <ul className="space-y-2 mb-3">
                {[
                  'обнаружили техническую ошибку или некорректную работу элементов сайта;',
                  'заметили неточности в информации или интерфейсе;',
                  'хотите предложить идею по улучшению платформы;',
                  'столкнулись с недобросовестным участником и хотите сообщить об этом,',
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="text-amber-600 font-bold mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mb-3">— пожалуйста, сообщите нам об этом. Ваши замечания и предложения помогут сделать ЕРТТП максимально удобной и эффективной для всех участников. Мы постоянно работаем над улучшением механизмов оценки репутации и созданием ещё более справедливых конкурентных условий на рынке.</p>
              <p>Для обратной связи все контакты доступны на странице <Link to="/support" className="text-primary font-semibold underline underline-offset-2 hover:text-primary/80">«Поддержка»</Link>.</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}