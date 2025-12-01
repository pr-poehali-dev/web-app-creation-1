import type { Category } from '@/types/offer';

export const CATEGORIES: Category[] = [
  {
    id: 'construction',
    name: 'Строительство',
    subcategories: [
      { id: 'materials', name: 'Стройматериалы', categoryId: 'construction' },
      { id: 'tools', name: 'Инструменты', categoryId: 'construction' },
      { id: 'services', name: 'Строительные услуги', categoryId: 'construction' },
    ],
  },
  {
    id: 'furniture',
    name: 'Мебель',
    subcategories: [
      { id: 'office', name: 'Офисная мебель', categoryId: 'furniture' },
      { id: 'home', name: 'Домашняя мебель', categoryId: 'furniture' },
      { id: 'outdoor', name: 'Уличная мебель', categoryId: 'furniture' },
    ],
  },
  {
    id: 'electronics',
    name: 'Электроника',
    subcategories: [
      { id: 'computers', name: 'Компьютеры', categoryId: 'electronics' },
      { id: 'phones', name: 'Телефоны', categoryId: 'electronics' },
      { id: 'accessories', name: 'Аксессуары', categoryId: 'electronics' },
    ],
  },
  {
    id: 'office',
    name: 'Офис',
    subcategories: [
      { id: 'stationery', name: 'Канцтовары', categoryId: 'office' },
      { id: 'equipment', name: 'Оборудование', categoryId: 'office' },
      { id: 'supplies', name: 'Расходники', categoryId: 'office' },
    ],
  },
  {
    id: 'transport',
    name: 'Транспорт',
    subcategories: [
      { id: 'delivery', name: 'Грузоперевозки', categoryId: 'transport' },
      { id: 'logistics', name: 'Логистика', categoryId: 'transport' },
      { id: 'vehicles', name: 'Транспортные средства', categoryId: 'transport' },
    ],
  },
  {
    id: 'services',
    name: 'Услуги',
    subcategories: [
      { id: 'cleaning', name: 'Клининг', categoryId: 'services' },
      { id: 'security', name: 'Охрана', categoryId: 'services' },
      { id: 'consulting', name: 'Консалтинг', categoryId: 'services' },
      { id: 'taxi-intercity', name: 'Такси межгород', categoryId: 'services' },
    ],
  },
];