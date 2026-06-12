import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';

type ReportType = 'usn6' | 'usn15' | 'ndfl3' | 'npd' | 'zero' | 'director';

interface ReportCard {
  id: ReportType;
  label: string;
  subtitle: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  who: string;
  deadline: string;
  desc: string;
}

const REPORTS: ReportCard[] = [
  {
    id: 'usn6',
    label: 'УСН «Доходы»',
    subtitle: '6% от дохода',
    icon: 'TrendingUp',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/40',
    who: 'ИП и ООО на упрощёнке 6%',
    deadline: 'ИП — до 25 апреля, ООО — до 25 марта',
    desc: 'Годовая декларация по УСН. Налог считается с общей суммы доходов.',
  },
  {
    id: 'usn15',
    label: 'УСН «Доходы минус расходы»',
    subtitle: '15% от прибыли',
    icon: 'Calculator',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/40',
    who: 'ИП и ООО на упрощёнке 15%',
    deadline: 'ИП — до 25 апреля, ООО — до 25 марта',
    desc: 'Годовая декларация по УСН. Налог считается с разницы доходов и расходов.',
  },
  {
    id: 'ndfl3',
    label: '3-НДФЛ',
    subtitle: '13% / 15% от дохода',
    icon: 'FileText',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/40',
    who: 'Физлица: фриланс, продажа имущества, инвестиции',
    deadline: 'До 30 апреля следующего года',
    desc: 'Декларация о доходах физического лица. Также используется для налоговых вычетов.',
  },
  {
    id: 'npd',
    label: 'Самозанятый (НПД)',
    subtitle: '4% или 6% от дохода',
    icon: 'Briefcase',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/40',
    who: 'Самозанятые (плательщики НПД)',
    deadline: 'Ежемесячно до 28 числа следующего месяца',
    desc: 'Расчёт налога на профессиональный доход. Налог формируется автоматически в приложении «Мой налог».',
  },
  {
    id: 'zero',
    label: 'Нулевая декларация',
    subtitle: 'Нет деятельности — нет налога',
    icon: 'Minus',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/40',
    who: 'ИП и ООО без доходов и деятельности',
    deadline: 'По срокам своей системы налогообложения',
    desc: 'Обязательная отчётность даже при отсутствии деятельности. Нулевые показатели во всех строках.',
  },
  {
    id: 'director',
    label: 'Взносы директора ООО',
    subtitle: '30% от МРОТ · с 2026 года',
    icon: 'Building2',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/40',
    who: 'Все ООО с единоличным исполнительным органом',
    deadline: 'Ежемесячно до 28 числа',
    desc: 'Новый закон № 425-ФЗ: обязательные страховые взносы за директора ООО даже без выручки.',
  },
];

// ─── Формы ───────────────────────────────────────────────────────────────────

function Usn6Form({ onBack }: { onBack: () => void }) {
  const [inn, setInn] = useState('');
  const [year, setYear] = useState('2025');
  const [income, setIncome] = useState('');
  const [paid, setPaid] = useState('');
  const [region, setRegion] = useState('6');
  const [result, setResult] = useState<null | { tax: number; toPay: number }>(null);

  const rate = Number(region) / 100;

  const calc = () => {
    const inc = parseFloat(income.replace(/\s/g, '').replace(',', '.')) || 0;
    const p = parseFloat(paid.replace(/\s/g, '').replace(',', '.')) || 0;
    const tax = Math.round(inc * rate);
    const deduct = Math.min(p, tax);
    const toP = Math.max(0, tax - deduct);
    setResult({ tax, toPlay: toP } as unknown as { tax: number; toPlay: number });
    setResult({ tax, toPlay: toP } as never);
  };

  const fmt = (n: number) => n.toLocaleString('ru-RU');

  const generateXml = () => {
    const inc = Math.round(parseFloat(income.replace(/\s/g, '').replace(',', '.')) || 0);
    const tax = result ? result.tax : 0;
    const toP = result ? result.toPlay as never as number : 0;
    const xml = `<?xml version="1.0" encoding="windows-1251"?>
<Файл ВерсФорм="5.09" ИдФайла="NO_DEKL_${inn}_${year}001" ДатаФайла="${new Date().toISOString().slice(0, 10)}">
  <Документ КНД="1152017" Период="34" ОтчетГод="${year}" НомКорр="0">
    <СвНП ИННФЛ="${inn}" НаимОрг="ИП ${inn}"/>
    <Подписант ПрПодп="1"/>
    <УСН>
      <ОбъНал ОбъНал="1" СтавНал="${region}"/>
      <ДохРасх СумДохОбщ="${inc}"/>
      <НалВыч СумНалВыч="${Math.round(parseFloat(paid.replace(/\s/g, '').replace(',', '.')) || 0)}"/>
      <НалУпл СумНалИсч="${tax}" СумНалУпл="${toP}"/>
    </УСН>
  </Документ>
</Файл>`;
    const blob = new Blob([xml], { type: 'application/xml;charset=windows-1251' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `УСН_${year}_${inn || 'декларация'}.xml`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
        <Icon name="ArrowLeft" size={18} />
        <span>Назад к выбору</span>
      </button>

      <div className="rounded-2xl border border-green-500/40 bg-green-500/10 p-5">
        <div className="flex items-center gap-3 mb-1">
          <Icon name="TrendingUp" size={22} className="text-green-400" />
          <h2 className="text-lg font-semibold">УСН «Доходы» — 6%</h2>
        </div>
        <p className="text-sm text-muted-foreground">Годовая декларация · {year} год</p>
      </div>

      <div className="grid gap-4">
        <div>
          <label className="text-sm font-medium mb-1.5 block">ИНН</label>
          <input
            value={inn}
            onChange={e => setInn(e.target.value.replace(/\D/g, '').slice(0, 12))}
            placeholder="123456789012"
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Год отчётности</label>
            <select
              value={year}
              onChange={e => setYear(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {['2025', '2024', '2023'].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Ставка региона (%)</label>
            <input
              value={region}
              onChange={e => setRegion(e.target.value.replace(/\D/g, '').slice(0, 2))}
              placeholder="6"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Общий доход за год (₽)</label>
          <input
            value={income}
            onChange={e => setIncome(e.target.value)}
            placeholder="1 200 000"
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Уплаченные страховые взносы (₽)</label>
          <input
            value={paid}
            onChange={e => setPaid(e.target.value)}
            placeholder="49 500"
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <p className="text-xs text-muted-foreground mt-1">ИП без сотрудников может уменьшить налог на 100% взносов</p>
        </div>
      </div>

      <button
        onClick={calc}
        className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
      >
        Рассчитать налог
      </button>

      {result && (
        <div className="rounded-2xl border border-green-500/40 bg-green-500/5 p-5 space-y-3">
          <h3 className="font-semibold text-green-400">Результат расчёта</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Исчисленный налог ({region}%)</span>
              <span className="font-medium">{fmt(result.tax)} ₽</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Вычет (взносы)</span>
              <span className="font-medium text-green-400">−{fmt(Math.min(parseFloat(paid.replace(/\s/g, '').replace(',', '.')) || 0, result.tax))} ₽</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2">
              <span className="font-semibold">К уплате</span>
              <span className="font-bold text-lg">{fmt((result as never as { toPlay: number }).toPlay)} ₽</span>
            </div>
          </div>
          <button
            onClick={generateXml}
            className="w-full py-2.5 rounded-xl border border-green-500/40 text-green-400 font-medium hover:bg-green-500/10 transition-colors flex items-center justify-center gap-2"
          >
            <Icon name="Download" size={16} />
            Скачать XML для nalog.ru
          </button>
          <div className="rounded-xl bg-muted/50 p-4 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Как подать декларацию:</p>
            <p>1. Скачайте XML-файл</p>
            <p>2. Войдите в личный кабинет на <span className="text-primary">nalog.ru</span></p>
            <p>3. Раздел «Декларации» → «Загрузить файл»</p>
            <p>4. Подпишите КЭП или через Госуслуги</p>
          </div>
        </div>
      )}
    </div>
  );
}

function Usn15Form({ onBack }: { onBack: () => void }) {
  const [inn, setInn] = useState('');
  const [year, setYear] = useState('2025');
  const [income, setIncome] = useState('');
  const [expenses, setExpenses] = useState('');
  const [region, setRegion] = useState('15');
  const [result, setResult] = useState<null | { base: number; tax: number; minTax: number; final: number }>(null);

  const calc = () => {
    const inc = parseFloat(income.replace(/\s/g, '').replace(',', '.')) || 0;
    const exp = parseFloat(expenses.replace(/\s/g, '').replace(',', '.')) || 0;
    const rate = Number(region) / 100;
    const base = Math.max(0, inc - exp);
    const tax = Math.round(base * rate);
    const minTax = Math.round(inc * 0.01);
    const final = Math.max(tax, minTax);
    setResult({ base, tax, minTax, final });
  };

  const fmt = (n: number) => n.toLocaleString('ru-RU');

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
        <Icon name="ArrowLeft" size={18} />
        <span>Назад к выбору</span>
      </button>

      <div className="rounded-2xl border border-blue-500/40 bg-blue-500/10 p-5">
        <div className="flex items-center gap-3 mb-1">
          <Icon name="Calculator" size={22} className="text-blue-400" />
          <h2 className="text-lg font-semibold">УСН «Доходы минус расходы» — 15%</h2>
        </div>
        <p className="text-sm text-muted-foreground">Годовая декларация · {year} год</p>
      </div>

      <div className="grid gap-4">
        <div>
          <label className="text-sm font-medium mb-1.5 block">ИНН</label>
          <input
            value={inn}
            onChange={e => setInn(e.target.value.replace(/\D/g, '').slice(0, 12))}
            placeholder="123456789012"
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Год</label>
            <select
              value={year}
              onChange={e => setYear(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {['2025', '2024', '2023'].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Ставка (%)</label>
            <input
              value={region}
              onChange={e => setRegion(e.target.value.replace(/\D/g, '').slice(0, 2))}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Доходы за год (₽)</label>
          <input value={income} onChange={e => setIncome(e.target.value)} placeholder="3 000 000"
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Расходы за год (₽)</label>
          <input value={expenses} onChange={e => setExpenses(e.target.value)} placeholder="2 000 000"
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
          <p className="text-xs text-muted-foreground mt-1">Только документально подтверждённые расходы из ст. 346.16 НК</p>
        </div>
      </div>

      <button onClick={calc} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors">
        Рассчитать налог
      </button>

      {result && (
        <div className="rounded-2xl border border-blue-500/40 bg-blue-500/5 p-5 space-y-3">
          <h3 className="font-semibold text-blue-400">Результат расчёта</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Налоговая база</span>
              <span className="font-medium">{fmt(result.base)} ₽</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Налог {region}%</span>
              <span className="font-medium">{fmt(result.tax)} ₽</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Минимальный налог (1% от дохода)</span>
              <span className="font-medium">{fmt(result.minTax)} ₽</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2">
              <span className="font-semibold">К уплате (максимум из двух)</span>
              <span className="font-bold text-lg">{fmt(result.final)} ₽</span>
            </div>
          </div>
          {result.final === result.minTax && result.tax < result.minTax && (
            <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/30 p-3 text-xs text-yellow-400">
              Применяется минимальный налог — 1% от дохода, т.к. расчётный налог оказался меньше
            </div>
          )}
          <div className="rounded-xl bg-muted/50 p-4 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Как подать:</p>
            <p>1. Выгрузите XML через программу «Налогоплательщик ЮЛ»</p>
            <p>2. Или подайте через nalog.ru → Личный кабинет ЮЛ/ИП</p>
          </div>
        </div>
      )}
    </div>
  );
}

function Ndfl3Form({ onBack }: { onBack: () => void }) {
  const [year, setYear] = useState('2025');
  const [fio, setFio] = useState('');
  const [inn, setInn] = useState('');
  const [income, setIncome] = useState('');
  const [type, setType] = useState<'freelance' | 'sale' | 'invest'>('freelance');
  const [result, setResult] = useState<null | { tax: number; rate: number }>(null);

  const calc = () => {
    const inc = parseFloat(income.replace(/\s/g, '').replace(',', '.')) || 0;
    const rate = inc > 5_000_000 ? 0.15 : 0.13;
    setResult({ tax: Math.round(inc * rate), rate });
  };

  const fmt = (n: number) => n.toLocaleString('ru-RU');

  const TYPES = [
    { id: 'freelance', label: 'Фриланс / услуги' },
    { id: 'sale', label: 'Продажа имущества' },
    { id: 'invest', label: 'Инвестиции / дивиденды' },
  ] as const;

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
        <Icon name="ArrowLeft" size={18} />
        <span>Назад к выбору</span>
      </button>

      <div className="rounded-2xl border border-purple-500/40 bg-purple-500/10 p-5">
        <div className="flex items-center gap-3 mb-1">
          <Icon name="FileText" size={22} className="text-purple-400" />
          <h2 className="text-lg font-semibold">Декларация 3-НДФЛ</h2>
        </div>
        <p className="text-sm text-muted-foreground">13% или 15% от дохода · {year} год</p>
      </div>

      <div className="grid gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Вид дохода</label>
          <div className="grid grid-cols-3 gap-2">
            {TYPES.map(t => (
              <button
                key={t.id}
                onClick={() => setType(t.id)}
                className={`py-2 px-3 rounded-xl text-sm font-medium border transition-colors ${type === t.id ? 'border-purple-500/60 bg-purple-500/20 text-purple-300' : 'border-border bg-card text-muted-foreground hover:border-purple-500/30'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">ФИО</label>
          <input value={fio} onChange={e => setFio(e.target.value)} placeholder="Иванов Иван Иванович"
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">ИНН</label>
            <input value={inn} onChange={e => setInn(e.target.value.replace(/\D/g, '').slice(0, 12))} placeholder="123456789012"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Год дохода</label>
            <select value={year} onChange={e => setYear(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
              {['2025', '2024', '2023'].map(y => <option key={y}>{y}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Сумма дохода (₽)</label>
          <input value={income} onChange={e => setIncome(e.target.value)} placeholder="500 000"
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </div>
      </div>

      <button onClick={calc} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors">
        Рассчитать НДФЛ
      </button>

      {result && (
        <div className="rounded-2xl border border-purple-500/40 bg-purple-500/5 p-5 space-y-3">
          <h3 className="font-semibold text-purple-400">Результат</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ставка НДФЛ</span>
              <span className="font-medium">{result.rate * 100}%</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2">
              <span className="font-semibold">Налог к уплате</span>
              <span className="font-bold text-lg">{fmt(result.tax)} ₽</span>
            </div>
          </div>
          {result.rate === 0.15 && (
            <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/30 p-3 text-xs text-yellow-400">
              Применяется ставка 15% — доход превышает 5 000 000 ₽ в год
            </div>
          )}
          <div className="rounded-xl bg-muted/50 p-4 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Срок и способ подачи:</p>
            <p>• До 30 апреля {Number(year) + 1} года</p>
            <p>• Через nalog.ru → «Жизненные ситуации» → «Подать 3-НДФЛ»</p>
            <p>• Или лично в ФНС по месту прописки</p>
          </div>
        </div>
      )}
    </div>
  );
}

function NpdForm({ onBack }: { onBack: () => void }) {
  const [month, setMonth] = useState('1');
  const [year, setYear] = useState('2025');
  const [incomeFL, setIncomeFL] = useState('');
  const [incomeUL, setIncomeUL] = useState('');
  const [result, setResult] = useState<null | { taxFL: number; taxUL: number; total: number; bonus: number; toPay: number }>(null);

  const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

  const calc = () => {
    const fl = parseFloat(incomeFL.replace(/\s/g, '').replace(',', '.')) || 0;
    const ul = parseFloat(incomeUL.replace(/\s/g, '').replace(',', '.')) || 0;
    const taxFL = Math.round(fl * 0.04);
    const taxUL = Math.round(ul * 0.06);
    const total = taxFL + taxUL;
    const bonus = 0;
    setResult({ taxFL, taxUL, total, bonus, toPay: Math.max(0, total - bonus) });
  };

  const fmt = (n: number) => n.toLocaleString('ru-RU');

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
        <Icon name="ArrowLeft" size={18} />
        <span>Назад к выбору</span>
      </button>

      <div className="rounded-2xl border border-orange-500/40 bg-orange-500/10 p-5">
        <div className="flex items-center gap-3 mb-1">
          <Icon name="Briefcase" size={22} className="text-orange-400" />
          <h2 className="text-lg font-semibold">Самозанятый — НПД</h2>
        </div>
        <p className="text-sm text-muted-foreground">4% с физлиц · 6% с юрлиц и ИП</p>
      </div>

      <div className="rounded-xl bg-blue-500/10 border border-blue-500/30 p-4 text-sm text-blue-300">
        <p className="font-medium mb-1">Важно знать</p>
        <p className="text-xs">Самозанятые не подают декларации — ФНС сама считает налог по вашим чекам в приложении «Мой налог». Этот калькулятор поможет заранее понять сумму к уплате.</p>
      </div>

      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Месяц</label>
            <select value={month} onChange={e => setMonth(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
              {MONTHS.map((m, i) => <option key={i} value={String(i + 1)}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Год</label>
            <select value={year} onChange={e => setYear(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
              {['2026', '2025', '2024'].map(y => <option key={y}>{y}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Доход от физлиц (₽) · ставка 4%</label>
          <input value={incomeFL} onChange={e => setIncomeFL(e.target.value)} placeholder="50 000"
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Доход от организаций и ИП (₽) · ставка 6%</label>
          <input value={incomeUL} onChange={e => setIncomeUL(e.target.value)} placeholder="30 000"
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </div>
      </div>

      <button onClick={calc} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors">
        Рассчитать налог
      </button>

      {result && (
        <div className="rounded-2xl border border-orange-500/40 bg-orange-500/5 p-5 space-y-3">
          <h3 className="font-semibold text-orange-400">Расчёт за {MONTHS[Number(month) - 1]} {year}</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Налог с физлиц (4%)</span>
              <span>{fmt(result.taxFL)} ₽</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Налог с юрлиц (6%)</span>
              <span>{fmt(result.taxUL)} ₽</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2">
              <span className="font-semibold">Итого к уплате</span>
              <span className="font-bold text-lg">{fmt(result.toPay)} ₽</span>
            </div>
          </div>
          <div className="rounded-xl bg-muted/50 p-4 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Оплата до 28-го числа следующего месяца</p>
            <p>Через приложение «Мой налог» или nalog.ru → личный кабинет НПД</p>
          </div>
        </div>
      )}
    </div>
  );
}

function ZeroForm({ onBack }: { onBack: () => void }) {
  const [inn, setInn] = useState('');
  const [year, setYear] = useState('2025');
  const [taxSystem, setTaxSystem] = useState<'usn6' | 'usn15'>('usn6');
  const [generated, setGenerated] = useState(false);

  const generate = () => setGenerated(true);

  const downloadXml = () => {
    const xml = `<?xml version="1.0" encoding="windows-1251"?>
<Файл ВерсФорм="5.09" ИдФайла="NO_DEKL_${inn}_${year}001_ZERO" ДатаФайла="${new Date().toISOString().slice(0, 10)}">
  <Документ КНД="1152017" Период="34" ОтчетГод="${year}" НомКорр="0">
    <СвНП ИННФЛ="${inn}" НаимОрг="ИП ${inn}"/>
    <Подписант ПрПодп="1"/>
    <УСН>
      <ОбъНал ОбъНал="${taxSystem === 'usn6' ? '1' : '2'}" СтавНал="${taxSystem === 'usn6' ? '6' : '15'}"/>
      <ДохРасх СумДохОбщ="0"/>
      <НалВыч СумНалВыч="0"/>
      <НалУпл СумНалИсч="0" СумНалУпл="0"/>
    </УСН>
  </Документ>
</Файл>`;
    const blob = new Blob([xml], { type: 'application/xml;charset=windows-1251' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Нулевая_УСН_${year}_${inn || 'декларация'}.xml`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
        <Icon name="ArrowLeft" size={18} />
        <span>Назад к выбору</span>
      </button>

      <div className="rounded-2xl border border-gray-500/40 bg-gray-500/10 p-5">
        <div className="flex items-center gap-3 mb-1">
          <Icon name="Minus" size={22} className="text-gray-400" />
          <h2 className="text-lg font-semibold">Нулевая декларация</h2>
        </div>
        <p className="text-sm text-muted-foreground">Нет деятельности — но отчёт обязателен</p>
      </div>

      <div className="grid gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Система налогообложения</label>
          <div className="grid grid-cols-2 gap-2">
            {[{ id: 'usn6', label: 'УСН 6%' }, { id: 'usn15', label: 'УСН 15%' }].map(t => (
              <button key={t.id} onClick={() => setTaxSystem(t.id as 'usn6' | 'usn15')}
                className={`py-2 px-3 rounded-xl text-sm font-medium border transition-colors ${taxSystem === t.id ? 'border-gray-400 bg-gray-500/20 text-gray-200' : 'border-border bg-card text-muted-foreground hover:border-gray-500/30'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">ИНН</label>
          <input value={inn} onChange={e => setInn(e.target.value.replace(/\D/g, '').slice(0, 12))} placeholder="123456789012"
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Год отчётности</label>
          <select value={year} onChange={e => setYear(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
            {['2025', '2024', '2023'].map(y => <option key={y}>{y}</option>)}
          </select>
        </div>
      </div>

      <button onClick={generate} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors">
        Сформировать нулевую декларацию
      </button>

      {generated && (
        <div className="rounded-2xl border border-gray-500/40 bg-gray-500/5 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Icon name="CheckCircle" size={18} className="text-green-400" />
            <h3 className="font-semibold">Декларация готова</h3>
          </div>
          <p className="text-sm text-muted-foreground">Нулевая декларация по УСН за {year} год сформирована. Все показатели равны нулю.</p>
          <button onClick={downloadXml}
            className="w-full py-2.5 rounded-xl border border-gray-500/40 text-gray-300 font-medium hover:bg-gray-500/10 transition-colors flex items-center justify-center gap-2">
            <Icon name="Download" size={16} />
            Скачать XML для nalog.ru
          </button>
          <div className="rounded-xl bg-muted/50 p-4 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Штраф за непредставление — 1 000 ₽</p>
            <p>Даже при полном отсутствии деятельности декларацию необходимо подать в срок</p>
          </div>
        </div>
      )}
    </div>
  );
}

function DirectorForm({ onBack }: { onBack: () => void }) {
  const [months, setMonths] = useState('12');
  const [mrot, setMrot] = useState('27093');
  const [result, setResult] = useState<null | { monthly: number; annual: number; pf: number; oms: number; ss: number }>(null);

  const calc = () => {
    const m = parseFloat(mrot.replace(/\s/g, '')) || 27093;
    const pf = Math.round(m * 0.22);
    const oms = Math.round(m * 0.051);
    const ss = Math.round(m * 0.029);
    const monthly = pf + oms + ss;
    setResult({ monthly, annual: monthly * Number(months), pf, oms, ss });
  };

  const fmt = (n: number) => n.toLocaleString('ru-RU');

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
        <Icon name="ArrowLeft" size={18} />
        <span>Назад к выбору</span>
      </button>

      <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-5">
        <div className="flex items-center gap-3 mb-1">
          <Icon name="Building2" size={22} className="text-red-400" />
          <h2 className="text-lg font-semibold">Страховые взносы директора ООО</h2>
        </div>
        <p className="text-sm text-muted-foreground">Новый закон № 425-ФЗ · с 1 января 2026 года</p>
      </div>

      <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-sm space-y-2">
        <p className="font-medium text-red-300">Что изменилось с 2026 года</p>
        <p className="text-xs text-muted-foreground">ООО обязаны платить страховые взносы за руководителя (директора/генерального директора) <span className="text-foreground font-medium">даже при отсутствии выручки и зарплаты</span>. Минимальная база — МРОТ.</p>
      </div>

      <div className="grid gap-4">
        <div>
          <label className="text-sm font-medium mb-1.5 block">МРОТ в 2026 году (₽)</label>
          <input value={mrot} onChange={e => setMrot(e.target.value)} placeholder="27 093"
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
          <p className="text-xs text-muted-foreground mt-1">МРОТ на 2026 год — 27 093 ₽ (актуальное значение)</p>
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Количество месяцев</label>
          <select value={months} onChange={e => setMonths(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
            {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={String(i + 1)}>{i + 1} мес.</option>)}
          </select>
        </div>
      </div>

      <button onClick={calc} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors">
        Рассчитать взносы
      </button>

      {result && (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/5 p-5 space-y-3">
          <h3 className="font-semibold text-red-400">Расчёт за {months} мес.</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">ПФР / ОПС (22%)</span>
              <span>{fmt(result.pf)} ₽/мес</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">ФОМС / ОМС (5.1%)</span>
              <span>{fmt(result.oms)} ₽/мес</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">ФСС / ОСС (2.9%)</span>
              <span>{fmt(result.ss)} ₽/мес</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2">
              <span className="font-semibold">В месяц (итого 30%)</span>
              <span className="font-bold">{fmt(result.monthly)} ₽</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2">
              <span className="font-semibold">За {months} мес.</span>
              <span className="font-bold text-lg text-red-400">{fmt(result.annual)} ₽</span>
            </div>
          </div>
          <div className="rounded-xl bg-muted/50 p-4 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Срок уплаты — до 28-го числа каждого месяца</p>
            <p>Взносы уплачиваются через ЕНС (единый налоговый счёт) на nalog.ru</p>
            <p className="text-yellow-400">Исключение: директор на СВО — взносы не начисляются за период службы</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Главная страница ─────────────────────────────────────────────────────────

export default function TaxReports() {
  const navigate = useNavigate();
  const [active, setActive] = useState<ReportType | null>(null);

  const renderForm = () => {
    const back = () => setActive(null);
    switch (active) {
      case 'usn6': return <Usn6Form onBack={back} />;
      case 'usn15': return <Usn15Form onBack={back} />;
      case 'ndfl3': return <Ndfl3Form onBack={back} />;
      case 'npd': return <NpdForm onBack={back} />;
      case 'zero': return <ZeroForm onBack={back} />;
      case 'director': return <DirectorForm onBack={back} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground"
          >
            <Icon name="ArrowLeft" size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold">Отчёты в ФНС</h1>
            <p className="text-sm text-muted-foreground">Расчёт налогов и генерация XML-деклараций</p>
          </div>
        </div>

        {active ? (
          renderForm()
        ) : (
          <div className="space-y-3">
            {REPORTS.map(r => (
              <button
                key={r.id}
                onClick={() => setActive(r.id)}
                className={`w-full text-left rounded-2xl border ${r.borderColor} ${r.bgColor} p-4 hover:opacity-80 transition-opacity`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-xl bg-background/40 ${r.color} shrink-0`}>
                    <Icon name={r.icon as never} size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-foreground">{r.label}</span>
                      <Icon name="ChevronRight" size={16} className="text-muted-foreground shrink-0" />
                    </div>
                    <p className={`text-sm font-medium ${r.color} mt-0.5`}>{r.subtitle}</p>
                    <p className="text-xs text-muted-foreground mt-1">{r.who}</p>
                    <p className="text-xs text-muted-foreground/70 mt-0.5">Срок: {r.deadline}</p>
                  </div>
                </div>
              </button>
            ))}

            <div className="mt-6 rounded-2xl bg-muted/30 border border-border p-4 text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Важно</p>
              <p>Сервис формирует XML-файлы для самостоятельной загрузки на nalog.ru. Для отправки потребуется КЭП (электронная подпись) или авторизация через Госуслуги. Перед подачей проверьте данные с бухгалтером.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
