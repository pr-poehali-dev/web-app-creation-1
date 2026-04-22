import { toast } from 'sonner';
import func2url from '../../backend/func2url.json';

interface ShareOptions {
  title: string;
  text: string;
  url: string;        // прямая ссылка на страницу (erttp.ru/offer/UUID)
  imageUrl?: string;
}

async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
}

const PROD_DOMAIN = 'https://erttp.ru';

/** Нормализует URL к боевому домену erttp.ru */
function toProdUrl(pageUrl: string): string {
  try {
    const u = new URL(pageUrl);
    return `${PROD_DOMAIN}${u.pathname}${u.search}`;
  } catch {
    return pageUrl;
  }
}

/**
 * Строим URL og-proxy — статическая HTML-страница с og:image для ботов мессенджеров.
 * Боты (Telegram, WhatsApp, VK) не выполняют JS, поэтому нельзя отдавать SPA-URL.
 * og-proxy возвращает статический HTML с нужными og-тегами и редиректит на erttp.ru.
 */
function buildOgProxyUrl(prodUrl: string): string | null {
  const ogProxyBase = (func2url as Record<string, string>)['og-proxy'];
  if (!ogProxyBase) return null;

  const v = '5';

  const offerMatch = prodUrl.match(/\/offer\/([0-9a-f-]{36})/);
  if (offerMatch) return `${ogProxyBase}?type=offer&id=${offerMatch[1]}&v=${v}`;

  const requestMatch = prodUrl.match(/\/request\/([0-9a-f-]{36})/);
  if (requestMatch) return `${ogProxyBase}?type=request&id=${requestMatch[1]}&v=${v}`;

  const auctionMatch = prodUrl.match(/\/auction\/([0-9a-f-]{36})/);
  if (auctionMatch) return `${ogProxyBase}?type=auction&id=${auctionMatch[1]}&v=${v}`;

  return null;
}

/**
 * Шарим контент в мессенджер.
 *
 * Стратегия:
 * - Мессенджеры (Telegram, WhatsApp) — боты, они не выполняют JS.
 *   Поэтому для превью (og:image) нужен статический HTML → og-proxy URL.
 * - При клике пользователь переходит на erttp.ru (og-proxy делает JS-редирект).
 * - Поэтому передаём og-proxy URL, если он доступен.
 */
export async function shareContent({ title, text, url }: ShareOptions): Promise<void> {
  const prodUrl = toProdUrl(url);
  const ogUrl = buildOgProxyUrl(prodUrl);

  // Передаём og-proxy URL мессенджеру — бот парсит статический HTML с og:image
  // Если og-proxy не найден (например для обычных страниц) — отдаём прямой URL
  const shareUrl = ogUrl ?? prodUrl;

  if (navigator.share) {
    try {
      await navigator.share({ title, text, url: shareUrl });
      toast.success('Ссылка отправлена!');
      return;
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
    }
  }

  // Десктоп: копируем og-proxy URL — при вставке в Telegram/WhatsApp Desktop
  // бот загрузит og-proxy и покажет превью с фото
  await copyToClipboard(shareUrl);
  toast.success('Ссылка скопирована', {
    description: 'Вставьте в мессенджер — получатель увидит превью с фото',
  });
}
