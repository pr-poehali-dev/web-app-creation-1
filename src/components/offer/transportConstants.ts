export const SERVICE_TYPES = [
  'Пассажирские перевозки',
  'Грузоперевозки',
  'Аренда транспорта',
  'Доставка',
];

export const TRANSPORT_TYPES = [
  'Легковой автомобиль',
  'Кроссовер',
  'Внедорожник (джип)',
  'Внедорожник премиум-класса',
  'Минивэн',
  'Микроавтобус',
  'Автобус',
  'Грузовик',
  'Спецтехника',
];

export const CARGO_TRANSPORT_TYPES = [
  'Грузовик',
  'Микроавтобус',
  'Спецтехника',
  'Рефрижератор',
  'Внедорожник с прицепом',
];

export const PRICE_TYPES = [
  'За рейс',
  'За час',
  'За км',
  'За тонну',
  'За место',
  'Договорная',
];

export function formatCityName(str: string): string {
  return str.trim().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

export function formatRoute(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  const parts = trimmed.split(/\s*[-–—]+\s*/);
  if (parts.length >= 2) {
    return parts.map(formatCityName).filter(Boolean).join(' - ');
  }
  const words = trimmed.split(/\s+/);
  if (words.length >= 2) {
    const mid = Math.ceil(words.length / 2);
    const from = words.slice(0, mid).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    const to = words.slice(mid).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    return `${from} - ${to}`;
  }
  return formatCityName(trimmed);
}
