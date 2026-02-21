import { toast } from 'sonner';

const OG_PROXY_URL = 'https://functions.poehali.dev/2a7d2949-7159-4c2e-aeda-5cd18c67e0e7';

interface ShareOptions {
  title: string;
  text: string;
  url: string;
  imageUrl?: string;
  itemType?: 'offer' | 'request' | 'auction';
  itemId?: string;
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

export async function shareContent({ title, text, url, imageUrl, itemType, itemId }: ShareOptions): Promise<void> {
  const shareUrl = (itemType && itemId)
    ? `${OG_PROXY_URL}?type=${itemType}&id=${itemId}`
    : url;

  const fullText = `${text}\n\n🔗 ${url}`;

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
            return;
          }
        } catch {
          // Фото не удалось — шарим без него
        }
      }

      await navigator.share({ title, text: fullText, url: shareUrl });
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