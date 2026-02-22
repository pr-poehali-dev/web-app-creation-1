import Icon from '@/components/ui/icon';

interface ChatImageLightboxProps {
  url: string | null;
  onClose: () => void;
}

export default function ChatImageLightbox({ url, onClose }: ChatImageLightboxProps) {
  if (!url) return null;

  return (
    <div
      className="absolute inset-0 flex items-center justify-center bg-black/90 rounded-lg"
      style={{ zIndex: 50 }}
    >
      <button
        type="button"
        aria-label="Закрыть"
        className="absolute top-3 left-3 flex items-center justify-center w-12 h-12 rounded-full bg-white/30 text-white active:bg-white/60"
        style={{ touchAction: 'manipulation', zIndex: 51 }}
        onClick={onClose}
      >
        <Icon name="X" size={24} />
      </button>
      <img
        src={url}
        alt="Полный размер"
        className="max-w-full max-h-full rounded-lg object-contain"
      />
    </div>
  );
}