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
      onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
      tabIndex={-1}
    >
      <button
        type="button"
        className="absolute top-4 left-4 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors"
        onClick={onClose}
      >
        <Icon name="X" size={22} />
      </button>
      <img
        src={url}
        alt="Полный размер"
        className="max-w-[95vw] max-h-[90vh] rounded-lg object-contain shadow-2xl"
      />
    </div>,
    document.body
  );
}
