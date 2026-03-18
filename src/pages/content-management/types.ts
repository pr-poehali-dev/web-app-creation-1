export interface ContentItem {
  id: number;
  key: string;
  value: string;
  description?: string;
  category?: string;
}

export interface BannerItem {
  id: number;
  title: string;
  message: string;
  type: string;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  background_color?: string;
  text_color?: string;
  icon?: string;
  show_on_pages?: string[];
}

export interface BannerFormState {
  title: string;
  message: string;
  type: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  backgroundColor: string;
  textColor: string;
  icon: string;
  showOnPages: string[];
}

export const CONTENT_LABELS: Record<string, { label: string; hint: string }> = {
  'home.hero.title': { label: 'Заголовок главной страницы', hint: 'Крупный заголовок баннера на главной странице' },
  'home.hero.subtitle': { label: 'Подзаголовок главной страницы', hint: 'Описание под главным заголовком' },
  'home.cta.button': { label: 'Текст кнопки призыва к действию', hint: 'Кнопка под главным баннером' },
  'offers.empty.title': { label: 'Заголовок пустого списка предложений', hint: 'Показывается когда нет предложений' },
  'offers.empty.description': { label: 'Описание пустого списка предложений', hint: 'Пояснение когда нет предложений' },
  'about.page': { label: 'Страница «О нас» (полный текст)', hint: 'Весь контент страницы — редактируется в визуальном редакторе' },
  'about.title': { label: 'Заголовок страницы «О нас»', hint: 'Крупный заголовок вверху страницы' },
  'about.intro1': { label: 'Первый вводный абзац «О нас»', hint: 'Первый абзац под заголовком' },
  'about.intro2': { label: 'Второй вводный абзац «О нас»', hint: 'Второй вводный абзац' },
  'about.content': { label: 'Основной текст «О нас»', hint: 'Дополнительный текст раздела (если используется)' },
  'about.description': { label: 'Краткое описание компании', hint: 'Используется в мета-тегах и карточках' },
  'footer.description': { label: 'Описание в подвале сайта', hint: 'Текст под логотипом в нижней части сайта' },
  'footer.notice.title': { label: 'Заголовок блока «Внимание!»', hint: 'Заголовок жёлтого информационного блока в подвале' },
  'footer.notice.text1': { label: 'Блок «Внимание!» — первый абзац', hint: 'Основной текст предупреждения (о разработке, статусе и т.д.)' },
  'footer.notice.text2': { label: 'Блок «Внимание!» — второй абзац', hint: 'Дополнительный текст (инвестиции, спонсорство и т.д.) — можно оставить пустым' },
  'footer.notice.visible': { label: 'Показывать блок «Внимание!»', hint: 'Включите, чтобы жёлтый блок был виден посетителям сайта' },
};

export const EMPTY_BANNER: BannerFormState = {
  title: '',
  message: '',
  type: 'info',
  startDate: '',
  endDate: '',
  isActive: true,
  backgroundColor: '#4F46E5',
  textColor: '#FFFFFF',
  icon: '',
  showOnPages: ['home'],
};

export const PAGE_OPTIONS = [
  { value: 'home', label: 'Главная' },
  { value: 'offers', label: 'Предложения' },
  { value: 'requests', label: 'Запросы' },
  { value: 'auctions', label: 'Аукционы' },
];

export const CATEGORY_LABELS: Record<string, string> = {
  home: 'Главная страница',
  about: 'О нас',
  offers: 'Предложения',
  footer: 'Подвал сайта',
  other: 'Прочее',
};

export function getContentLabel(key: string): { label: string; hint: string } {
  return CONTENT_LABELS[key] || { label: key, hint: '' };
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function isBannerActive(banner: BannerItem): boolean {
  if (!banner.is_active) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (banner.start_date) {
    const start = new Date(banner.start_date);
    if (start > today) return false;
  }
  if (banner.end_date) {
    const end = new Date(banner.end_date);
    if (end < today) return false;
  }
  return true;
}