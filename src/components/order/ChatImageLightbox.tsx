import { createPortal } from 'react-dom';
import Icon from '@/components/ui/icon';

interface ChatImageLightboxProps {
  url: string | null;
  onClose: () => void;
}

export default function ChatImageLightbox({ url, onClose }: ChatImageLightboxProps) {
  if (!url) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={(e) => { e.stopPropagation(); onClose(); }}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } }}
      tabIndex={-1}
    >
      <button
        className="absolute top-4 left-4 text-white/80 hover:text-white transition-colors z-10"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <Icon name="X" size={28} />
      </button>
      <img
        src={url}
        alt="Полный размер"
        className="max-w-[95vw] max-h-[90vh] rounded-lg object-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>,
    document.body
  );
}