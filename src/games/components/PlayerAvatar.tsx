interface PlayerAvatarProps {
  emoji?: string | null;
  url?: string | null;
  size?: number;
  className?: string;
}

export default function PlayerAvatar({ emoji, url, size = 32, className = '' }: PlayerAvatarProps) {
  if (url) {
    return (
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
  }
  return (
    <span className={`shrink-0 leading-none ${className}`} style={{ fontSize: size * 0.8 }}>
      {emoji || '👤'}
    </span>
  );
}
