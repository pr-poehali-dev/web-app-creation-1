import { createPortal } from 'react-dom';
import Icon from '@/components/ui/icon';

interface ChatImageLightboxProps {
  url: string | null;
  onClose: () => void;
}

const stopAll = (e: React.SyntheticEvent) => {
  e.stopPropagation();
  e.nativeEvent?.stopImmediatePropagation();
};

export default function ChatImageLightbox({ url, onClose }: ChatImageLightboxProps) {
  if (!url) return null;

  const handleClose = (e: React.SyntheticEvent) => {
    stopAll(e);
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      style={{ zIndex: 99999 }}
      onClick={stopAll}
      onMouseDown={stopAll}
      onPointerDown={stopAll}
      onTouchStart={stopAll}
      onTouchEnd={stopAll}
    >
      <button
        type="button"
        aria-label="Закрыть"
        className="absolute top-4 left-4 flex items-center justify-center w-12 h-12 rounded-full bg-white/25 hover:bg-white/45 active:bg-white/60 text-white transition-colors"
        style={{ zIndex: 100000, touchAction: 'manipulation' }}
        onClick={handleClose}
        onTouchEnd={handleClose}
        onPointerDown={stopAll}
        onMouseDown={stopAll}
      >
        <Icon name="X" size={24} />
      </button>
      <img
        src={url}
        alt="Полный размер"
        className="max-w-[95vw] max-h-[90vh] rounded-lg object-contain shadow-2xl"
        onClick={stopAll}
        onTouchEnd={stopAll}
      />
    </div>,
    document.body
  );
}
