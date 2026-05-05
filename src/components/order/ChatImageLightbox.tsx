import { useState } from 'react';
import Icon from '@/components/ui/icon';

interface ChatImageLightboxProps {
  url: string | null;
  onClose: () => void;
}

async function downloadAsPng(url: string) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = 'image.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(objectUrl);
  } catch {
    window.open(url, '_blank');
  }
}

async function downloadAsPdf(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const imgData = canvas.toDataURL('image/jpeg', 0.92);

        // Размеры A4 в pt (595 x 842)
        const a4w = 595;
        const a4h = 842;
        const ratio = Math.min(a4w / img.naturalWidth, a4h / img.naturalHeight);
        const drawW = Math.round(img.naturalWidth * ratio);
        const drawH = Math.round(img.naturalHeight * ratio);
        const offsetX = Math.round((a4w - drawW) / 2);
        const offsetY = Math.round((a4h - drawH) / 2);

        // Минимальный PDF вручную
        const nl = '\n';
        const objects: string[] = [];
        const offsets: number[] = [];
        let pos = 0;

        const addObj = (content: string) => {
          offsets.push(pos);
          objects.push(content);
          pos += content.length;
        };

        // obj 1 — каталог
        const obj1 = `1 0 obj${nl}<< /Type /Catalog /Pages 2 0 R >>${nl}endobj${nl}`;
        addObj(obj1);

        // obj 2 — дерево страниц
        const obj2 = `2 0 obj${nl}<< /Type /Pages /Kids [3 0 R] /Count 1 >>${nl}endobj${nl}`;
        addObj(obj2);

        // obj 3 — страница
        const obj3 = `3 0 obj${nl}<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${a4w} ${a4h}] /Contents 4 0 R /Resources << /XObject << /Im1 5 0 R >> >> >>${nl}endobj${nl}`;
        addObj(obj3);

        // obj 4 — поток страницы
        const stream4 = `q ${drawW} 0 0 ${drawH} ${offsetX} ${offsetY} cm /Im1 Do Q`;
        const obj4 = `4 0 obj${nl}<< /Length ${stream4.length} >>${nl}stream${nl}${stream4}${nl}endstream${nl}endobj${nl}`;
        addObj(obj4);

        // obj 5 — изображение (JPEG)
        const jpegData = imgData.split(',')[1];
        const jpegBytes = atob(jpegData);
        const jpegLen = jpegBytes.length;
        const obj5Header = `5 0 obj${nl}<< /Type /XObject /Subtype /Image /Width ${img.naturalWidth} /Height ${img.naturalHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegLen} >>${nl}stream${nl}`;
        const obj5Footer = `${nl}endstream${nl}endobj${nl}`;

        offsets.push(pos + obj5Header.length + jpegLen);
        const xrefOffset = pos + obj5Header.length + jpegLen + obj5Footer.length;

        // Собираем xref
        const xrefCount = 6;
        let xref = `xref${nl}0 ${xrefCount}${nl}0000000000 65535 f ${nl}`;
        const allOffsets = [0, ...offsets.slice(0, 5)];
        for (let i = 1; i < xrefCount; i++) {
          xref += `${String(allOffsets[i]).padStart(10, '0')} 00000 n ${nl}`;
        }
        const trailer = `trailer${nl}<< /Size ${xrefCount} /Root 1 0 R >>${nl}startxref${nl}${xrefOffset}${nl}%%EOF`;

        // Формируем итоговый Uint8Array
        const headerStr = `%PDF-1.4${nl}`;
        const beforeJpeg = headerStr + objects.join('') + obj5Header;
        const afterJpeg = obj5Footer + xref + trailer;

        const encoder = new TextEncoder();
        const beforeBytes = encoder.encode(beforeJpeg);
        const afterBytes = encoder.encode(afterJpeg);

        const jpegUint8 = new Uint8Array(jpegLen);
        for (let i = 0; i < jpegLen; i++) jpegUint8[i] = jpegBytes.charCodeAt(i);

        const total = new Uint8Array(beforeBytes.length + jpegLen + afterBytes.length);
        total.set(beforeBytes, 0);
        total.set(jpegUint8, beforeBytes.length);
        total.set(afterBytes, beforeBytes.length + jpegLen);

        const blob = new Blob([total], { type: 'application/pdf' });
        const pdfUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = pdfUrl;
        a.download = 'image.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(pdfUrl);
        resolve();
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = reject;
    img.src = url;
  });
}

export default function ChatImageLightbox({ url, onClose }: ChatImageLightboxProps) {
  const [pdfLoading, setPdfLoading] = useState(false);

  if (!url) return null;

  const handlePdf = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setPdfLoading(true);
    try {
      await downloadAsPdf(url);
    } catch {
      window.open(url, '_blank');
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div
      className="absolute inset-0 flex items-center justify-center bg-black/90 rounded-lg"
      style={{ zIndex: 50 }}
      onClick={onClose}
    >
      {/* Верхняя панель кнопок */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 py-3"
        style={{ zIndex: 9999, pointerEvents: 'none' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Кнопки действий */}
        <div className="flex gap-2" style={{ pointerEvents: 'auto' }}>
          {/* Скачать PNG */}
          <button
            type="button"
            aria-label="Скачать PNG"
            className="flex items-center gap-1.5 px-3 h-11 rounded-full shadow-lg active:opacity-70 text-white text-sm font-semibold"
            style={{
              background: 'rgba(0,0,0,0.80)',
              border: '1.5px solid rgba(255,255,255,0.25)',
              backdropFilter: 'blur(8px)',
            }}
            onClick={(e) => { e.stopPropagation(); downloadAsPng(url); }}
          >
            <Icon name="Download" size={18} className="text-white" />
            PNG
          </button>

          {/* Скачать PDF */}
          <button
            type="button"
            aria-label="Скачать PDF"
            className="flex items-center gap-1.5 px-3 h-11 rounded-full shadow-lg active:opacity-70 text-white text-sm font-semibold"
            style={{
              background: pdfLoading ? 'rgba(37,99,235,0.7)' : 'rgba(37,99,235,0.9)',
              border: '1.5px solid rgba(255,255,255,0.25)',
              backdropFilter: 'blur(8px)',
            }}
            onClick={handlePdf}
            disabled={pdfLoading}
          >
            {pdfLoading
              ? <Icon name="Loader2" size={18} className="text-white animate-spin" />
              : <Icon name="FileText" size={18} className="text-white" />
            }
            PDF
          </button>

          {/* Печать */}
          <button
            type="button"
            aria-label="Печать"
            className="flex items-center gap-1.5 px-3 h-11 rounded-full shadow-lg active:opacity-70 text-white text-sm font-semibold"
            style={{
              background: 'rgba(22,163,74,0.9)',
              border: '1.5px solid rgba(255,255,255,0.25)',
              backdropFilter: 'blur(8px)',
            }}
            onClick={(e) => {
              e.stopPropagation();
              const win = window.open('', '_blank');
              if (!win) return;
              win.document.write(`<!DOCTYPE html><html><head><title>Печать</title><style>*{margin:0;padding:0;box-sizing:border-box}body{display:flex;align-items:center;justify-content:center;min-height:100vh;background:#fff}img{max-width:100%;max-height:100vh;object-fit:contain}@media print{body{margin:0}}</style></head><body><img src="${url}" onload="window.print();window.close()"/></body></html>`);
              win.document.close();
            }}
          >
            <Icon name="Printer" size={18} className="text-white" />
            Печать
          </button>
        </div>

        {/* Крестик — красный */}
        <button
          type="button"
          aria-label="Закрыть"
          className="flex items-center justify-center w-11 h-11 rounded-full shadow-lg active:opacity-80"
          style={{
            pointerEvents: 'auto',
            background: '#e53e3e',
            border: '2px solid rgba(255,255,255,0.3)',
            backdropFilter: 'blur(8px)',
          }}
          onClick={(e) => { e.stopPropagation(); onClose(); }}
        >
          <Icon name="X" size={24} className="text-white" />
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