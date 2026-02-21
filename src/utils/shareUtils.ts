import { toast } from 'sonner';

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

export async function shareContent({ title, text, url, imageUrl }: ShareOptions): Promise<void> {
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

      await navigator.share({ title, text: fullText, url });
      return;
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
      // Fallback to clipboard
    }
  }

  await copyToClipboard(fullText);
  toast.success('Скопировано в буфер обмена', {
    description: 'Вставьте в мессенджер — получатель увидит полную информацию',
  });
}
