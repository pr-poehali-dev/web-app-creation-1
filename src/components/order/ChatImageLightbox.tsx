import Icon from '@/components/ui/icon';

interface ChatImageLightboxProps {
  url: string | null;
  onClose: () => void;
}

function getFileExtension(url: string): string {
  return (url.split('?')[0].split('.').pop() || 'file').toLowerCase();
}

function getMimeType(ext: string): string {
  const map: Record<string, string> = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
  };
  return map[ext] || 'application/octet-stream';
}

async function downloadFile(url: string) {
  const ext = getFileExtension(url);
  const mime = getMimeType(ext);
  try {
    const res = await fetch(url);
    const blob = new Blob([await res.arrayBuffer()], { type: mime });
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = `file.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(objectUrl);
  } catch {
    window.open(url, '_blank');
  }
}

export default function ChatImageLightbox({ url, onClose }: ChatImageLightboxProps) {
  if (!url) return null;

  const ext = getFileExtension(url).toUpperCase();

  return (
    <div
      className="absolute inset-0 flex items-center justify-center bg-black/90 rounded-lg"
      style={{ zIndex: 50 }}
      onClick={onClose}
    >
      {/* Верхняя панель кнопок — всегда поверх изображения */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 py-3"
        style={{ zIndex: 9999, pointerEvents: 'none' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Кнопка скачать с типом файла */}
        <button
          type="button"
          aria-label="Скачать"
          className="flex items-center gap-2 px-4 py-2 rounded-full text-white font-semibold text-sm shadow-lg active:opacity-80"
          style={{
            pointerEvents: 'auto',
            background: 'rgba(0,0,0,0.75)',
            border: '1.5px solid rgba(255,255,255,0.25)',
            backdropFilter: 'blur(8px)',
          }}
          onClick={(e) => { e.stopPropagation(); downloadFile(url); }}
        >
          <Icon name="Download" size={20} className="text-white" />
          <span>{ext}</span>
        </button>

        {/* Крестик — красный, заметный */}
        <button
          type="button"
          aria-label="Закрыть"
          className="flex items-center justify-center w-12 h-12 rounded-full shadow-lg active:opacity-80"
          style={{
            pointerEvents: 'auto',
            background: '#e53e3e',
            border: '2px solid rgba(255,255,255,0.3)',
            backdropFilter: 'blur(8px)',
          }}
          onClick={(e) => { e.stopPropagation(); onClose(); }}
        >
          <Icon name="X" size={26} className="text-white" />
        </button>
      </div>

      <img
        src={url}
        alt="Полный размер"
        className="max-w-full max-h-full rounded-lg object-contain"
        style={{ paddingTop: '4rem' }}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
