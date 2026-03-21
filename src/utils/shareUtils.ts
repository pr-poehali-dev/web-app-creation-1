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

export async function shareContent({ title, text, url }: ShareOptions): Promise<void> {
  const ogUrl = buildOgProxyUrl(url) || url;
  const shortUrl = await shortenUrl(url);

  // В тексте — короткая ссылка erttp.ru/s/CODE
  // В поле url — og-proxy напрямую, Telegram читает из него og:image и показывает фото
  const shareText = `${text}\n\n🔗 ${shortUrl}`;

  if (navigator.share) {
    try {
      await navigator.share({ title, text: shareText, url: ogUrl });
      toast.success('Ссылка отправлена!');
      return;
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
    }
  }

  await copyToClipboard(shareText);
  toast.success('Скопировано в буфер обмена', {
    description: 'Вставьте в мессенджер — получатель увидит превью с фото',
  });
}