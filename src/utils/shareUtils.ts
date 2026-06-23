import { toast } from 'sonner';
import func2url from '../../backend/func2url.json';

interface ShareOptions {
  title: string;
  text: string;
  url: string;        // прямая ссылка на страницу (erttp.ru/offer/UUID)
  imageUrl?: string;  // URL первого фото предложения
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

  const v = '8';

  const offerMatch = prodUrl.match(/\/offer\/([0-9a-f-]{36})/);
  if (offerMatch) return `${ogProxyBase}?type=offer&id=${offerMatch[1]}&v=${v}`;

  const requestMatch = prodUrl.match(/\/request\/([0-9a-f-]{36})/);
  if (requestMatch) return `${ogProxyBase}?type=request&id=${requestMatch[1]}&v=${v}`;

  const auctionMatch = prodUrl.match(/\/auction\/([0-9a-f-]{36})/);
  if (auctionMatch) return `${ogProxyBase}?type=auction&id=${auctionMatch[1]}&v=${v}`;

  if (prodUrl.includes('/mosquito-repellent')) return `${ogProxyBase}?type=page&id=mosquito-repellent&v=8`;
  if (prodUrl.includes('/brain-booster')) return `${ogProxyBase}?type=page&id=brain-booster&v=1`;

  return null;
}

/** Создаёт короткую ссылку через short-url бэкенд. Возвращает erttp.ru/s/XXXXX */
async function createShortUrl(prodUrl: string): Promise<string | null> {
  try {
    const shortUrlBase = (func2url as Record<string, string>)['short-url'];
    if (!shortUrlBase) return null;
    const resp = await fetch(shortUrlBase, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: prodUrl }),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    return data.short_url ?? null;
  } catch {
    return null;
  }
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
async function fetchImageAsFile(imageUrl: string, title: string): Promise<File | null> {
  try {
    // CDN блокирует прямой fetch (CORS) — используем backend-прокси
    const proxyBase = (func2url as Record<string, string>)['image-proxy'];
    if (!proxyBase) return null;
    const proxyUrl = `${proxyBase}?url=${encodeURIComponent(imageUrl)}`;
    const resp = await fetch(proxyUrl);
    if (!resp.ok) return null;
    const blob = await resp.blob();
    if (!blob.type.startsWith('image/') && !blob.type.includes('octet-stream')) return null;
    const ext = imageUrl.toLowerCase().includes('.png') ? 'png' : 'jpg';
    const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
    return new File([blob], `${title}.${ext}`, { type: mimeType });
  } catch {
    return null;
  }
}

export async function shareContent({ title, text, url, imageUrl }: ShareOptions): Promise<void> {
  const prodUrl = toProdUrl(url);
  const ogUrl = buildOgProxyUrl(prodUrl);
  // Сокращаем og-proxy URL (длинный) → erttp.ru/s/XXXXX, либо оставляем prodUrl
  const shortUrl = ogUrl ? await createShortUrl(ogUrl) : null;
  const shareUrl = shortUrl ?? ogUrl ?? prodUrl;

  if (navigator.share) {
    try {
      // Пробуем Web Share API Level 2 — передаём файл напрямую (Android Chrome)
      if (imageUrl && navigator.canShare) {
        const file = await fetchImageAsFile(imageUrl, title);
        if (file && navigator.canShare({ files: [file] })) {
          await navigator.share({ title, text: `${text}\n${prodUrl}`, files: [file] });
          toast.success('Ссылка отправлена!');
          return;
        }
      }
      // Fallback: без файла — только url (text убран чтобы не дублировать описание из og:description)
      await navigator.share({ title, url: shareUrl });
      toast.success('Ссылка отправлена!');
      return;
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
    }
  }

  await copyToClipboard(shareUrl);
  toast.success('Ссылка скопирована', {
    description: 'Вставьте в мессенджер — получатель увидит превью с фото',
  });
}