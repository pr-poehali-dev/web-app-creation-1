import Icon from '@/components/ui/icon';

interface ChatImageLightboxProps {
  url: string | null;
  onClose: () => void;
}

export default function ChatImageLightbox({ url, onClose }: ChatImageLightboxProps) {
  if (!url) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      style={{ zIndex: 99999 }}
    >
      <button
        type="button"
        aria-label="Закрыть"
        className="absolute top-4 left-4 flex items-center justify-center w-14 h-14 rounded-full bg-white/30 text-white"
        style={{ touchAction: 'manipulation' }}
        onClick={onClose}
      >
        <Icon name="X" size={26} />
      </button>
      <img
        src={url}
        alt="Полный размер"
        className="max-w-[95vw] max-h-[90vh] rounded-lg object-contain shadow-2xl"
      />
    </div>
  );
}