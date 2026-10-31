import { CATEGORIES } from '@/data/categories';
import { DISTRICTS } from '@/data/districts';
import { stripFormatting } from '@/components/ui/FormattedText';

export const categoryName = (id?: string) => (id ? CATEGORIES.find((c) => c.id === id)?.name || id : '');

export const districtName = (id?: string) => (id ? DISTRICTS.find((d) => d.id === id)?.name || id : '');

export const rub = (value?: number | null) =>
  value != null && Number(value) > 0 ? `${Number(value).toLocaleString('ru-RU')} ₽` : '';

export const shortText = (text?: string, max = 110) => {
  const clean = text ? stripFormatting(text).replace(/\s+/g, ' ').trim() : '';
  return clean.length > max ? `${clean.slice(0, max).replace(/\s+\S*$/, '')}…` : clean;
};

export const joinParts = (...parts: Array<string | undefined | false>) =>
  parts.filter(Boolean).join('. ').replace(/\.\./g, '.');
