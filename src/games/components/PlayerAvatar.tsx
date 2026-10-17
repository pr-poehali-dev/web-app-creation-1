import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

interface PlayerAvatarProps {
  emoji?: string | null;
  url?: string | null;
  size?: number;
  className?: string;
  zoomable?: boolean;
  online?: boolean;
}

function PlayerAvatarBase({ emoji, url, size = 32, className = '', zoomable = true }: PlayerAvatarProps) {
  const [open, setOpen] = useState(false);

  if (url) {
    const img = (
      <img
        src={url}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        className={`rounded-full object-cover shrink-0 ${className}`}
        style={{ width: size, height: size }}
      />
    );
    if (!zoomable) return img;
    return (
      <>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
          className="shrink-0 cursor-zoom-in rounded-full"
          aria-label="Открыть фото"
        >
          {img}
        </button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-[90vw] sm:max-w-md border-slate-700 bg-slate-950 p-3">
            <DialogTitle className="sr-only">Фото профиля</DialogTitle>
            <img src={url} alt="Фото профиля" className="w-full max-h-[80vh] rounded-lg object-contain" />
          </DialogContent>
        </Dialog>
      </>
    );
  }
  return (
    <span className={`shrink-0 leading-none ${className}`} style={{ fontSize: size * 0.8 }}>
      {emoji || '👤'}
    </span>
  );
}


export default function PlayerAvatar(props: PlayerAvatarProps) {
  if (props.online === undefined) return <PlayerAvatarBase {...props} />;
  return (
    <span className="relative inline-flex shrink-0">
      <PlayerAvatarBase {...props} />
      <span
        title={props.online ? 'В игре' : 'Не в игре'}
        className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-slate-900 ${props.online ? 'bg-emerald-400' : 'bg-slate-500'}`}
      />
    </span>
  );
}
