import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Icon from '@/components/ui/icon';

interface ChatImageLightboxProps {
  url: string | null;
  onClose: () => void;
}

export default function ChatImageLightbox({ url, onClose }: ChatImageLightboxProps) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!url || !btnRef.current) return;
    const btn = btnRef.current;

    const handler = (e: Event) => {
      e.stopPropagation();
      e.stopImmediatePropagation();
      e.preventDefault();
      onCloseRef.current();
    };

    btn.addEventListener('pointerup', handler, { capture: true });
    return () => btn.removeEventListener('pointerup', handler, { capture: true });
  }, [url]);

  if (!url) return null;

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      style={{ zIndex: 99999 }}
      onPointerDown={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); }}
      onTouchStart={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); }}
    >
      <button
        ref={btnRef}
        type="button"
        aria-label="Закрыть"
        className="absolute top-4 left-4 flex items-center justify-center w-14 h-14 rounded-full bg-white/25 hover:bg-white/45 active:bg-white/60 text-white transition-colors"
        style={{ zIndex: 100000, touchAction: 'manipulation' }}
      >
        <Icon name="X" size={26} />
      </button>
      <img
        src={url}
        alt="Полный размер"
        className="max-w-[95vw] max-h-[90vh] rounded-lg object-contain shadow-2xl"
        onPointerDown={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation(); }}
      />
    </div>,
    document.body
  );
}
