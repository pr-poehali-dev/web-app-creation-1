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
  {
    id: 'food',
    name: 'Пищевая продукция',
    subcategories: [
      { id: 'meat', name: 'Мясная продукция', categoryId: 'food' },
      { id: 'dairy', name: 'Молочная продукция', categoryId: 'food' },
      { id: 'fruits-vegetables', name: 'Фрукты-Овощи', categoryId: 'food' },
      { id: 'grocery', name: 'Бакалея', categoryId: 'food' },
      { id: 'fish', name: 'Рыбная продукция', categoryId: 'food' },
      { id: 'bakery', name: 'Хлебобулочные изделия', categoryId: 'food' },
      { id: 'confectionery', name: 'Кондитерские изделия', categoryId: 'food' },
      { id: 'baby-food', name: 'Детское питание', categoryId: 'food' },
      { id: 'eggs', name: 'Яйца и яичная продукция', categoryId: 'food' },
      { id: 'beverages', name: 'Безалкогольные напитки', categoryId: 'food' },
      { id: 'ready-meals', name: 'Полуфабрикаты и готовые блюда', categoryId: 'food' },
    ],
  },
];