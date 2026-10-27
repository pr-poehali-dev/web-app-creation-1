import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import RobotConfigurator from '@/components/robot/RobotConfigurator';

const FILE_URL = '/ElliottWaveC_EA.mq5';

const STEPS: { title: string; items: string[] }[] = [
  {
    title: 'Шаг 1. Откройте счёт MT5 на Bybit',
    items: [
      'Войдите в Bybit и пройдите верификацию (KYC), если ещё не проходили.',
      'Откройте вкладку TradFi, затем CFD и нажмите «Apply», чтобы создать MT5 CFD-счёт.',
      'Переведите на этот счёт USDT с основного счёта. Деньги на CFD-счёте лежат отдельно от основного.',
      'Запомните логин, пароль и название сервера MT5. Их Bybit показывает после создания счёта.',
    ],
  },
  {
    title: 'Шаг 2. Установите MetaTrader 5',
    items: [
      'Скачайте MT5 на компьютер (Windows) по ссылке из личного кабинета Bybit или с её страницы TradFi.',
      'Запустите программу, выберите «Файл → Открыть счёт» и найдите сервер Bybit из шага 1.',
      'Выберите «Существующий счёт», введите логин и пароль, нажмите «Готово».',
      'В правом нижнем углу должна появиться зелёная шкала связи. Если там красный крестик, проверьте сервер и пароль.',
    ],
  },
  {
    title: 'Шаг 3. Установите файл робота',
    items: [
      'Скачайте файл робота кнопкой выше.',
      'В MT5 выберите «Файл → Открыть папку данных».',
      'Откройте папку MQL5, затем Experts, и скопируйте туда скачанный файл ElliottWaveC_EA.mq5.',
      'Вернитесь в MT5, откройте панель «Навигатор» (Ctrl+N), правой кнопкой нажмите «Советники» и выберите «Обновить».',
    ],
  },
  {
    title: 'Шаг 4. Скомпилируйте робота',
    items: [
      'В Навигаторе дважды нажмите на ElliottWaveC_EA. Откроется редактор MetaEditor.',
      'Нажмите F7 или кнопку «Компилировать».',
      'Внизу в журнале должно быть «0 errors». Предупреждения (warnings) можно игнорировать.',
      'Если появились ошибки, сделайте скриншот журнала и пришлите мне, я исправлю.',
    ],
  },
  {
    title: 'Шаг 5. Разрешите автоторговлю',
    items: [
      'В MT5 выберите «Сервис → Настройки → Советники».',
      'Включите «Разрешить алгоритмическую торговлю» и нажмите OK.',
      'На верхней панели нажмите кнопку «Алготорговля», чтобы она стала зелёной.',
    ],
  },
  {
    title: 'Шаг 6. Проверьте робота на истории',
    items: [
      'Выберите «Вид → Тестер стратегий» (Ctrl+R).',
      'Укажите советника ElliottWaveC_EA, инструмент (например XAUUSD), таймфрейм (например M15 или H1) и период хотя бы за год.',
      'Режим моделирования: «Каждый тик на основе реальных тиков». Нажмите «Старт».',
      'Смотрите вкладки «Результаты» и «График»: важны итоговая прибыль, просадка и число сделок.',
      'Не запускайте робота на реальные деньги, пока на истории он не показывает стабильный результат.',
    ],
  },
  {
    title: 'Шаг 7. Запустите на счёте',
    items: [
      'Откройте график нужного инструмента и таймфрейма: «Файл → Новый график».',
      'Перетащите ElliottWaveC_EA из Навигатора на график.',
      'На вкладке «Общие» поставьте галочку «Разрешить алгоритмическую торговлю» и нажмите OK.',
      'В правом верхнем углу графика должна появиться улыбающаяся рожица. Грустная рожица означает, что автоторговля выключена.',
      'Для первых дней поставьте минимальный лот или риск 0,5% и следите за сделками.',
    ],
  },
  {
    title: 'Шаг 8. Чтобы робот работал круглосуточно',
    items: [
      'Робот торгует, только пока MT5 запущен и есть интернет. Если компьютер выключить, торговля остановится.',
      'Для круглосуточной работы арендуйте виртуальный сервер (VPS) с Windows и установите MT5 на нём.',
      'Либо в MT5 нажмите на значок VPS в левом нижнем углу, чтобы подключить встроенную услугу MetaQuotes.',
    ],
  },
];

const SETTINGS: [string, string][] = [
  ['InpPivotBars', 'Насколько заметным должен быть экстремум, чтобы считаться вершиной или впадиной волны. Больше значение: меньше сигналов, но надёжнее. По умолчанию 5.'],
  ['InpMinBRetrace / InpMaxBRetrace', 'Допустимая глубина волны B относительно волны A (30–95%).'],
  ['InpMinCExt / InpMaxCExt', 'Допустимая длина волны C относительно волны A (90–190%).'],
  ['InpMaxEntryPos', 'Насколько далеко от конца волны C можно входить. 0,5 означает, что цена прошла не больше половины волны C.'],
  ['InpSLAtrBuffer', 'Запас стоп-лосса за экстремум в долях ATR. По умолчанию 0,5.'],
  ['InpTPRetrace', 'Тейк-профит как доля отката от волны C. По умолчанию 61,8%.'],
  ['InpMinRR', 'Минимальное отношение прибыли к риску. Сделки хуже этого значения робот пропускает.'],
  ['InpLotMode', 'Режим лота: фиксированный или процент от депозита.'],
  ['InpFixedLot', 'Размер лота при фиксированном режиме.'],
  ['InpRiskPercent', 'Сколько процентов депозита рискуете в одной сделке при расчёте от депозита. Рекомендуется 0,5–1%.'],
  ['InpDailyLossPct', 'Дневной лимит убытка в процентах. При его достижении робот закрывает позиции и до конца дня не торгует.'],
  ['InpMaxSpreadPts', 'Максимальный спред в пунктах. 0 означает без ограничения.'],
  ['InpMagic', 'Уникальный номер робота. Если запускаете несколько копий, у каждой должен быть свой.'],
];

const PROBLEMS: [string, string][] = [
  ['Робот не открывает сделки', 'Это нормально. Он ждёт полную картину волн A-B-C, поэтому сделки бывают не каждый день. Проверьте, что кнопка «Алготорговля» зелёная и на графике улыбающаяся рожица.'],
  ['Ошибка «Invalid stops» или «Invalid volume»', 'У инструмента свои минимальные лот и дистанция стопа. Попробуйте другой лот или таймфрейм побольше.'],
  ['Ошибка «Trade disabled» или «Market closed»', 'Рынок на этом инструменте закрыт. Подождите открытия торговой сессии.'],
  ['Не хватает средств (No money)', 'Уменьшите лот или процент риска либо пополните CFD-счёт.'],
  ['Робота нет в Навигаторе', 'Проверьте, что файл лежит именно в MQL5/Experts, и обновите Навигатор.'],
];

export default function RobotMT5() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <Icon name="ArrowLeft" size={16} />
          Назад
        </button>

        <header className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-bold">Робот Elliott Wave C для MetaTrader 5</h1>
          <p className="text-muted-foreground">
            Автоматически ищет волны A, B и C и входит в сделку на отбое от конца волны C. Работает на любых инструментах и таймфреймах. Есть стоп-лосс, тейк-профит и дневной лимит убытка.
          </p>
          <Button asChild size="lg" variant="outline">
            <a href={FILE_URL} download="ElliottWaveC_EA.mq5">
              <Icon name="Download" size={18} className="mr-2" />
              Скачать старую версию (.mq5)
            </a>
          </Button>
        </header>

        <RobotConfigurator />

        <section className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          <div className="flex items-start gap-2">
            <Icon name="TriangleAlert" size={18} className="mt-0.5 shrink-0" />
            <p>
              Торговля CFD связана с риском потери средств. Робот не гарантирует прибыль. Сначала проверьте его на истории и на демо-счёте, а на реальном счёте начните с минимального риска.
            </p>
          </div>
        </section>

        <section className="space-y-5">
          <h2 className="text-xl font-semibold">Установка пошагово</h2>
          {STEPS.map((step) => (
            <div key={step.title} className="rounded-lg border bg-card p-4 space-y-2">
              <h3 className="font-semibold">{step.title}</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                {step.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Что значат настройки</h2>
          <p className="text-sm text-muted-foreground">
            Открываются при запуске робота на вкладке «Входные параметры». Для начала можно оставить всё по умолчанию и поменять только лот или процент риска.
          </p>
          <div className="rounded-lg border divide-y">
            {SETTINGS.map(([name, desc]) => (
              <div key={name} className="p-3 text-sm">
                <div className="font-mono font-medium">{name}</div>
                <div className="text-muted-foreground">{desc}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Если что-то не работает</h2>
          <div className="rounded-lg border divide-y">
            {PROBLEMS.map(([q, a]) => (
              <div key={q} className="p-3 text-sm">
                <div className="font-medium">{q}</div>
                <div className="text-muted-foreground">{a}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}