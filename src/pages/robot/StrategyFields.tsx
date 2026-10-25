import type { StrategySettings } from './robotApi';

export interface NumField {
  key: keyof StrategySettings;
  label: string;
  hint: string;
  step?: number;
}

export interface Group {
  title: string;
  icon: string;
  note: string;
  fields: NumField[];
}

export const GROUPS: Group[] = [
  {
    title: 'Тренд: скользящие средние',
    icon: 'TrendingUp',
    note: 'Тренд вверх, когда цена и быстрая средняя выше медленной. Вниз, когда ниже.',
    fields: [
      { key: 'sma_fast', label: 'Быстрая средняя (свечей)', hint: 'Обычно 20' },
      { key: 'sma_slow', label: 'Медленная средняя (свечей)', hint: 'Обычно 50' },
    ],
  },
  {
    title: 'Входы: RSI и пробой',
    icon: 'LogIn',
    note: 'Откат ловится по RSI, пробой по максимуму или минимуму последних свечей.',
    fields: [
      { key: 'rsi_period', label: 'Период RSI', hint: 'Обычно 14' },
      { key: 'rsi_long', label: 'Лонг на откате, если RSI ниже', hint: 'Меньше — реже входы' },
      { key: 'rsi_short', label: 'Шорт на отскоке, если RSI выше', hint: 'Больше — реже входы' },
      { key: 'lookback', label: 'Окно пробоя (свечей)', hint: 'Максимум и минимум за N свечей' },
    ],
  },
  {
    title: 'Сила тренда (ADX) и боковик',
    icon: 'Gauge',
    note: 'ADX показывает, есть ли тренд. Ниже порога — боковик, новые сделки не открываются.',
    fields: [
      { key: 'adx_period', label: 'Период ADX', hint: 'Обычно 14' },
      { key: 'adx_min', label: 'Не торговать, если ADX ниже', hint: '0 — фильтр выключен' },
      { key: 'adx_max', label: 'Не торговать, если ADX выше', hint: '0 — фильтр выключен' },
      { key: 'short_adx', label: 'Шорт только если ADX не ниже', hint: '0 — без условия' },
    ],
  },
  {
    title: 'Дополнительные фильтры',
    icon: 'Filter',
    note: 'По умолчанию выключены, на истории Brent они результат не улучшили.',
    fields: [
      { key: 'htf', label: 'Старший тренд: средняя за N свечей', hint: '0 — выключено', step: 10 },
      { key: 'ext_max', label: 'Макс. удаление от средней (в ATR)', hint: '0 — выключено', step: 0.5 },
      { key: 'fresh', label: 'Тренд не старше N свечей', hint: '0 — выключено', step: 10 },
    ],
  },
  {
    title: 'Стоп и цели',
    icon: 'Target',
    note: 'Всё измеряется в ATR (средний размах свечи). Цель 1 закрывает часть позиции, стоп переносится на вход.',
    fields: [
      { key: 'atr_period', label: 'Период ATR', hint: 'Обычно 14' },
      { key: 'stop_atr', label: 'Стоп (в ATR)', hint: 'Дальше — реже выбивает', step: 0.1 },
      { key: 't1_atr', label: 'Цель 1 (в ATR)', hint: 'Ближняя цель', step: 0.1 },
      { key: 't2_atr', label: 'Цель 2 (в ATR)', hint: 'Дальняя цель', step: 0.1 },
      { key: 't1_frac', label: 'Доля позиции на цели 1 (0–1)', hint: '0,5 — половина', step: 0.1 },
    ],
  },
  {
    title: 'Время',
    icon: 'Clock',
    note: 'Паузы между сделками и срок жизни сигнала.',
    fields: [
      { key: 'cooldown_hours', label: 'Пауза после сделки (часов)', hint: 'Повторный сигнал в ту же сторону' },
      { key: 'max_days', label: 'Закрывать сделку через (дней)', hint: 'Если цель и стоп не сработали' },
    ],
  },
];

export interface FlagField {
  key: keyof StrategySettings;
  label: string;
  hint: string;
}

export const FLAGS: FlagField[] = [
  { key: 'use_breakout', label: 'Входить на пробое', hint: 'Цена вышла за максимум или минимум окна' },
  { key: 'use_pullback', label: 'Входить на откате', hint: 'Откат внутри тренда по RSI' },
  { key: 'allow_short', label: 'Разрешить шорты', hint: 'Сделки на падение' },
  { key: 'short_bounce', label: 'Шорт на отскоке', hint: 'Шорт после отскока вверх в нисходящем тренде' },
  { key: 'trend_exit', label: 'Выходить при развороте тренда', hint: 'Средние пересеклись против сделки' },
];
