import { toast } from 'sonner';
import func2url from '../../backend/func2url.json';

interface ShareOptions {
  title: string;
  text: string;
  url: string;        // прямая ссылка на страницу (erttp.ru/offer/UUID)
  imageUrl?: string;
  ogProxyUrl?: string; // URL og-proxy для превью в мессенджерах (необязательно)
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

async function shortenUrl(url: string): Promise<string> {
  try {
    const baseUrl = (func2url as Record<string, string>)['short-url'];
    if (!baseUrl) return url;
    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) return url;
    const data = await res.json();
    return data.short_url || url;
  } catch {
    return url;
  }
}

async function tinyUrl(url: string): Promise<string> {
  try {
    const res = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
    if (!res.ok) return url;
    const short = await res.text();
    return short.startsWith('https://tinyurl.com') ? short : url;
  } catch {
    return url;
  }
}

const PROD_DOMAIN = 'https://erttp.ru';

/** Строим URL og-proxy для оффера — он отдаёт HTML с OG-тегами для мессенджеров */
function buildOgProxyUrl(pageUrl: string): string | null {
  const ogProxyBase = (func2url as Record<string, string>)['og-proxy'];
  if (!ogProxyBase) return null;

  // v=4 — сброс кэша WhatsApp/Telegram
  const v = '4';

  const offerMatch = pageUrl.match(/\/offer\/([0-9a-f-]{36})/);
  if (offerMatch) return `${ogProxyBase}?type=offer&id=${offerMatch[1]}&v=${v}`;

  const requestMatch = pageUrl.match(/\/request\/([0-9a-f-]{36})/);
  if (requestMatch) return `${ogProxyBase}?type=request&id=${requestMatch[1]}&v=${v}`;

  const auctionMatch = pageUrl.match(/\/auction\/([0-9a-f-]{36})/);
  if (auctionMatch) return `${ogProxyBase}?type=auction&id=${auctionMatch[1]}&v=${v}`;

  return null;
}

/** Возвращает боевой URL страницы (на erttp.ru) вне зависимости от текущего домена */
function toProdUrl(pageUrl: string): string {
  try {
    const u = new URL(pageUrl);
    return `${PROD_DOMAIN}${u.pathname}${u.search}`;
  } catch {
    return pageUrl;
  }
}

export async function shareContent({ title, text, url }: ShareOptions): Promise<void> {
  // Нормализуем URL к боевому домену erttp.ru
  const prodUrl = toProdUrl(url);

  if (navigator.share) {
    try {
      // Передаём боевой URL напрямую — мессенджеры сами парсят OG-теги с erttp.ru
      await navigator.share({ title, text, url: prodUrl });
      toast.success('Ссылка отправлена!');
      return;
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
    }
  }

  // Десктоп — копируем чистый боевой URL, Telegram/WhatsApp сделают превью с фото
  await copyToClipboard(prodUrl);
  toast.success('Ссылка скопирована', {
    description: 'Вставьте в мессенджер — получатель увидит превью с фото',
  });
}
