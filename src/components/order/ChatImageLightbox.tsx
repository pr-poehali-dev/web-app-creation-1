import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import Icon from '@/components/ui/icon';

interface ChatImageLightboxProps {
  url: string | null;
  onClose: () => void;
}

export default function ChatImageLightbox({ url, onClose }: ChatImageLightboxProps) {
  useEffect(() => {
    if (!url) return;
    const stop = (e: Event) => e.stopPropagation();
    document.addEventListener('pointerdown', stop, { capture: true });
    document.addEventListener('mousedown', stop, { capture: true });
    document.addEventListener('click', stop, { capture: true });
    return () => {
      document.removeEventListener('pointerdown', stop, { capture: true });
      document.removeEventListener('mousedown', stop, { capture: true });
      document.removeEventListener('click', stop, { capture: true });
    };
  }, [url]);

  if (!url) return null;

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      style={{ zIndex: 99999, pointerEvents: 'all' }}
    >
      <button
        type="button"
        style={{ pointerEvents: 'all', zIndex: 100000 }}
        className="absolute top-4 left-4 flex items-center justify-center w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors"
        onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
        onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
        onClick={(e) => { e.stopPropagation(); onClose(); }}
      >
        <Icon name="X" size={22} />
      </button>
      <img
        src={url}
        alt="Полный размер"
        className="max-w-[95vw] max-h-[90vh] rounded-lg object-contain shadow-2xl"
        style={{ pointerEvents: 'none' }}
      />
    </div>,
    document.body
  );
}
