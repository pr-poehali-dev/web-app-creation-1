import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import { useScrollToTop } from '@/hooks/useScrollToTop';

interface AboutProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function About({ isAuthenticated, onLogout }: AboutProps) {
  useScrollToTop();
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />

      <main className="container mx-auto px-4 py-4 md:py-6 flex-1">
        <BackButton />
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4 md:mb-6">
            Единая Региональная Товарно-Торговая Площадка (ЕРТТП)
          </h1>

          <div className="space-y-4 md:space-y-5 text-foreground">
            <p className="text-sm md:text-base">
              ЕРТТП – это онлайн-платформа, разработанная для поддержки и развития местных производителей и поставщиков товаров и услуг. Проект нацелен на создание эффективной и инновационной системы онлайн-торговли, способствующей увеличению производства местной продукции, стимулированию товарооборота и диверсификации экономики региона.
            </p>

            <div>
              <h2 className="text-lg md:text-xl font-bold mb-2 md:mb-3">Актуальность проекта:</h2>
              <p className="text-sm md:text-base">
                В условиях цифровизации экономики и развития интернет-технологий создание ЕРТТП является стратегически важным шагом для поддержки малого и среднего предпринимательства и оптимизации экономической деятельности в регионах.
              </p>
            </div>

            <div>
              <h2 className="text-lg md:text-xl font-bold mb-2 md:mb-3">Цели и задачи:</h2>
              <ul className="space-y-2 md:space-y-2.5 pl-4">
                <li className="flex gap-2">
                  <span className="text-primary font-bold text-sm">•</span>
                  <span className="text-sm md:text-base">Создание условий для роста и развития местных производителей и поставщиков.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold text-sm">•</span>
                  <span className="text-sm md:text-base">Увеличение объема производства и потребления местной продукции.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold text-sm">•</span>
                  <span className="text-sm md:text-base">Снижение финансовой нагрузки на субъекты малого и среднего предпринимательства.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold text-sm">•</span>
                  <span className="text-sm md:text-base">Диверсификация и устойчивое развитие местной экономики.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold text-sm">•</span>
                  <span className="text-sm md:text-base">Обеспечение доступа к финансовым ресурсам через механизмы совместных закупок и фьючерсных/форвардных контрактов.</span>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg md:text-xl font-bold mb-2 md:mb-3">Функциональность ЕРТТП:</h2>
              <p className="mb-2 text-sm md:text-base">
                Платформа предоставляет широкий спектр инструментов для онлайн-торговли, включая:
              </p>
              <ul className="space-y-2 md:space-y-2.5 pl-4">
                <li className="flex gap-2">
                  <span className="text-primary font-bold text-sm">•</span>
                  <span className="text-sm md:text-base">Онлайн-аукционы.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold text-sm">•</span>
                  <span className="text-sm md:text-base">Заключение договоров с применением фьючерсных и форвардных контрактов.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold text-sm">•</span>
                  <span className="text-sm md:text-base">Организацию совместных закупок.</span>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg md:text-xl font-bold mb-2 md:mb-3">Специализация ЕРТТП:</h2>
              <p className="mb-2 text-sm md:text-base">
                Платформа специализируется на торговле следующими категориями товаров и услуг:
              </p>
              <ul className="space-y-2 md:space-y-2.5 pl-4">
                <li className="flex gap-2">
                  <span className="text-primary font-bold text-sm">•</span>
                  <span className="text-sm md:text-base">Сельхозпродукция местного производства.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>Продукты и товары первой необходимости.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>Строительные материалы.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>Энергетические ресурсы.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>Почвенно-земельные ресурсы.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span>Транспортные услуги.</span>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4">Почему ЕРТТП важна:</h2>
              <ul className="space-y-3 pl-5">
                <li className="flex gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span><strong>Преодоление экономической нестабильности:</strong> Мы помогаем снизить зависимость от кредитов и инфляции, предоставляя инструменты для прямого финансирования.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span><strong>Плановое производство и поставки:</strong> ЕРТТП помогает адаптировать ваше производство к реальным потребностям местного рынка, сокращая излишки и убытки, получая заказы по заранее оговоренной цене, сроков поставки и объема.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary font-bold">•</span>
                  <span><strong>Инвестиции в местную экономику:</strong> Мы создаем условия для того, чтобы деньги оставались в регионе, поддерживая местный бизнес и создание рабочих мест.</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 rounded-lg border border-primary/20 mt-8">
              <p className="text-lg font-semibold">
                ЕРТТП – это инструмент для развития местного бизнеса и экономики, обеспечивающий эффективное взаимодействие между производителями, поставщиками и потребителями для увеличения местного производства товарооборота и экономического суверенитета регионов.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}