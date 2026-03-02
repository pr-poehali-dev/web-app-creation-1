import { toast } from 'sonner';
import func2url from '../../backend/func2url.json';

interface ShareOptions {
  title: string;
  text: string;
  url: string;
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

export async function shareContent({ title, text, url, imageUrl }: ShareOptions): Promise<void> {
  const shortUrl = await shortenUrl(url);
  const fullText = `${text}\n\n🔗 ${shortUrl}`;

  if (navigator.share) {
    try {
      if (imageUrl && navigator.canShare) {
        try {
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          const ext = blob.type.includes('png') ? 'png' : 'jpg';
          const file = new File([blob], `${title}.${ext}`, { type: blob.type });

          if (navigator.canShare({ files: [file] })) {
            await navigator.share({ title, text: fullText, files: [file] });
            toast.success('Ссылка отправлена!');
            return;
          }
        } catch {
          // Фото не удалось — шарим без него
        }
      }

      await navigator.share({ title, text: fullText });
      toast.success('Ссылка отправлена!');
      return;
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
    }
  }

  await copyToClipboard(fullText);
  toast.success('Скопировано в буфер обмена', {
    description: 'Вставьте в мессенджер — получатель увидит полную информацию',
  });
}