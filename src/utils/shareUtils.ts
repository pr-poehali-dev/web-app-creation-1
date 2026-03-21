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

/** Строим URL og-proxy для оффера — он отдаёт HTML с OG-тегами для мессенджеров */
function buildOgProxyUrl(pageUrl: string): string | null {
  const ogProxyBase = (func2url as Record<string, string>)['og-proxy'];
  if (!ogProxyBase) return null;

  const offerMatch = pageUrl.match(/\/offer\/([0-9a-f-]{36})/);
  if (offerMatch) return `${ogProxyBase}?type=offer&id=${offerMatch[1]}`;

  const requestMatch = pageUrl.match(/\/request\/([0-9a-f-]{36})/);
  if (requestMatch) return `${ogProxyBase}?type=request&id=${requestMatch[1]}`;

  const auctionMatch = pageUrl.match(/\/auction\/([0-9a-f-]{36})/);
  if (auctionMatch) return `${ogProxyBase}?type=auction&id=${auctionMatch[1]}`;

  return null;
}

export async function shareContent({ title, text, url, imageUrl }: ShareOptions): Promise<void> {
  // og-proxy ссылка — отдаёт HTML с og:image, Telegram читает превью из неё
  const ogUrl = buildOgProxyUrl(url);

  // Для копирования в буфер укорачиваем og-proxy (или прямую ссылку)
  const shortUrl = ogUrl ? await shortenUrl(ogUrl) : await shortenUrl(url);

  // В navigator.share передаём og-proxy напрямую — Telegram читает og-теги и показывает фото
  // В тексте показываем короткую ссылку для удобства
  const directShareUrl = ogUrl || url;
  const fullText = `${text}\n\n🔗 ${shortUrl}`;

  if (navigator.share) {
    try {
      await navigator.share({ title, text: fullText, url: directShareUrl });
      toast.success('Ссылка отправлена!');
      return;
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
    }
  }

  await copyToClipboard(fullText);
  toast.success('Скопировано в буфер обмена', {
    description: 'Вставьте в мессенджер — получатель увидит превью с фото',
  });
}