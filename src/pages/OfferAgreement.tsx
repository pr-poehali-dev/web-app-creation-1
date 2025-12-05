import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';

interface OfferAgreementProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function OfferAgreement({ isAuthenticated, onLogout }: OfferAgreementProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Icon name="Building2" className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-xl text-primary">ЕРТТ</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Link 
            to="/" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <Icon name="ArrowLeft" className="h-4 w-4 mr-1" />
            Вернуться на главную
          </Link>
        </div>

        <article className="prose prose-slate max-w-none">
          <h1 className="text-3xl font-bold mb-6">Публичная оферта</h1>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Общие положения</h2>
            
            <p className="mb-3">
              <strong>1.1.</strong> Настоящая Публичная оферта (далее – Оферта) является официальным предложением ООО "Дойдум-Инвест" (далее – Оператор) заключить договор об оказании информационных услуг на условиях, изложенных ниже.
            </p>

            <p className="mb-3">
              <strong>1.2.</strong> Оферта адресована неограниченному кругу лиц и является публичной в соответствии со статьей 437 Гражданского кодекса Российской Федерации.
            </p>

            <p className="mb-3">
              <strong>1.3.</strong> Акцептом настоящей Оферты является регистрация пользователя на веб-сайте «Единая региональная торговая площадка», расположенном по адресу ертп.рф (далее – Сайт), и начало использования его функционала.
            </p>

            <p className="mb-3">
              <strong>1.4.</strong> Договор считается заключенным с момента акцепта Оферты пользователем.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Предмет договора</h2>
            
            <p className="mb-3">
              <strong>2.1.</strong> Оператор обязуется предоставить пользователю (далее – Пользователь) доступ к информационным услугам Сайта, а Пользователь обязуется использовать эти услуги в соответствии с условиями настоящей Оферты и Пользовательского соглашения.
            </p>

            <p className="font-semibold mb-2">2.2. Информационные услуги включают:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Предоставление доступа к платформе для размещения информации о товарах и услугах</li>
              <li>Обеспечение возможности поиска и просмотра предложений других пользователей</li>
              <li>Предоставление инструментов для создания и управления объявлениями</li>
              <li>Обеспечение связи между покупателями и продавцами</li>
              <li>Предоставление аналитических данных и статистики</li>
              <li>Техническая поддержка пользователей</li>
            </ul>

            <p className="mb-3">
              <strong>2.3.</strong> Оператор не является стороной сделок между пользователями и не несет ответственности за качество товаров и услуг, предлагаемых на Сайте.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Стоимость услуг и порядок расчетов</h2>
            
            <p className="mb-3">
              <strong>3.1.</strong> Базовые услуги Сайта предоставляются Пользователям бесплатно.
            </p>

            <p className="font-semibold mb-2">3.2. Дополнительные платные услуги могут включать:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Размещение премиум-объявлений</li>
              <li>Продвижение объявлений в поисковой выдаче</li>
              <li>Доступ к расширенной аналитике</li>
              <li>Дополнительные рекламные возможности</li>
            </ul>

            <p className="mb-3">
              <strong>3.3.</strong> Стоимость платных услуг указывается на соответствующих страницах Сайта и может быть изменена Оператором в одностороннем порядке.
            </p>

            <p className="mb-3">
              <strong>3.4.</strong> Оплата платных услуг осуществляется путем безналичного перевода денежных средств через платежные системы, доступные на Сайте.
            </p>

            <p className="mb-3">
              <strong>3.5.</strong> Все расчеты производятся в российских рублях.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Права и обязанности Оператора</h2>
            
            <p className="font-semibold mb-2">4.1. Оператор обязуется:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Обеспечивать функционирование Сайта и предоставление заявленных услуг</li>
              <li>Обеспечивать конфиденциальность персональных данных Пользователя</li>
              <li>Рассматривать обращения Пользователей в разумные сроки</li>
              <li>Уведомлять Пользователей об изменениях условий предоставления услуг</li>
            </ul>

            <p className="font-semibold mb-2">4.2. Оператор имеет право:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Изменять функционал Сайта и условия предоставления услуг</li>
              <li>Приостанавливать или прекращать предоставление услуг Пользователю в случае нарушения им условий Оферты</li>
              <li>Удалять объявления и информацию, нарушающие законодательство или условия использования Сайта</li>
              <li>Использовать информацию о Пользователе в статистических и маркетинговых целях</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Права и обязанности Пользователя</h2>
            
            <p className="font-semibold mb-2">5.1. Пользователь обязуется:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Предоставлять достоверную информацию при регистрации и использовании Сайта</li>
              <li>Соблюдать условия настоящей Оферты и Пользовательского соглашения</li>
              <li>Не размещать информацию, нарушающую законодательство Российской Федерации</li>
              <li>Своевременно оплачивать заказанные платные услуги</li>
              <li>Самостоятельно обеспечивать безопасность своей учетной записи</li>
            </ul>

            <p className="font-semibold mb-2">5.2. Пользователь имеет право:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Использовать услуги Сайта в соответствии с их назначением</li>
              <li>Размещать объявления о товарах и услугах</li>
              <li>Получать техническую поддержку от Оператора</li>
              <li>Отказаться от использования услуг Сайта в любое время</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Ответственность сторон</h2>
            
            <p className="mb-3">
              <strong>6.1.</strong> Оператор не несет ответственности за:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Содержание информации, размещаемой Пользователями на Сайте</li>
              <li>Качество товаров и услуг, предлагаемых пользователями</li>
              <li>Исполнение обязательств по сделкам между пользователями</li>
              <li>Временные технические сбои и перерывы в работе Сайта</li>
              <li>Действия третьих лиц, направленные на нарушение безопасности Сайта</li>
            </ul>

            <p className="mb-3">
              <strong>6.2.</strong> Пользователь несет полную ответственность за:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Достоверность предоставленной информации</li>
              <li>Содержание размещаемых объявлений</li>
              <li>Соблюдение законодательства при использовании Сайта</li>
              <li>Сохранность данных своей учетной записи</li>
            </ul>

            <p className="mb-3">
              <strong>6.3.</strong> Максимальная ответственность Оператора перед Пользователем ограничена суммой, уплаченной Пользователем за платные услуги в течение последних 30 дней.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Возврат денежных средств</h2>
            
            <p className="mb-3">
              <strong>7.1.</strong> Возврат денежных средств за неиспользованные платные услуги производится по письменному заявлению Пользователя в течение 10 рабочих дней с момента получения заявления.
            </p>

            <p className="mb-3">
              <strong>7.2.</strong> Возврат не производится в случаях:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Частичного или полного использования оплаченных услуг</li>
              <li>Блокировки учетной записи Пользователя по причине нарушения условий Оферты</li>
              <li>Истечения срока действия оплаченных услуг</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Срок действия договора и порядок его расторжения</h2>
            
            <p className="mb-3">
              <strong>8.1.</strong> Договор вступает в силу с момента акцепта Оферты и действует до момента удаления учетной записи Пользователя или расторжения договора по инициативе одной из сторон.
            </p>

            <p className="mb-3">
              <strong>8.2.</strong> Пользователь вправе расторгнуть договор в одностороннем порядке, удалив свою учетную запись или прекратив использование Сайта.
            </p>

            <p className="mb-3">
              <strong>8.3.</strong> Оператор вправе расторгнуть договор в одностороннем порядке в случае нарушения Пользователем условий настоящей Оферты или Пользовательского соглашения.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Изменение условий Оферты</h2>
            
            <p className="mb-3">
              <strong>9.1.</strong> Оператор вправе вносить изменения в настоящую Оферту в одностороннем порядке.
            </p>

            <p className="mb-3">
              <strong>9.2.</strong> Новая редакция Оферты вступает в силу с момента ее размещения на Сайте, если иное не предусмотрено новой редакцией.
            </p>

            <p className="mb-3">
              <strong>9.3.</strong> Продолжение использования Сайта после внесения изменений означает согласие Пользователя с новой редакцией Оферты.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Разрешение споров</h2>
            
            <p className="mb-3">
              <strong>10.1.</strong> Все споры и разногласия, возникающие из настоящей Оферты, разрешаются путем переговоров.
            </p>

            <p className="mb-3">
              <strong>10.2.</strong> При недостижении согласия споры подлежат рассмотрению в суде по месту нахождения Оператора в соответствии с законодательством Российской Федерации.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Реквизиты Оператора</h2>
            
            <div className="bg-muted/50 p-6 rounded-lg space-y-2">
              <p><strong>Наименование:</strong> ООО "Дойдум-Инвест"</p>
              <p><strong>ИНН:</strong> 1400022716</p>
              <p><strong>ОГРН:</strong> 1231400005682</p>
              <p><strong>Юридический адрес:</strong> г. Нюрба, ул. Степана Васильева, д. 15</p>
              <p><strong>Email:</strong> doydum-invest@mail.ru</p>
              <p><strong>Телефон:</strong> +7 (984) 101-73-55</p>
            </div>
          </section>

          <div className="mt-8 pt-6 border-t">
            <p className="text-sm text-muted-foreground mb-2">
              <strong>Дата публикации:</strong> 5 декабря 2025
            </p>
            <p className="text-sm font-semibold">
              Администрация ЕРТП
            </p>
          </div>
        </article>
      </main>
    </div>
  );
}