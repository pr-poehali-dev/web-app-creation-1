interface PinDotsProps {
  length: number;
  filled: number;
  error?: boolean;
}

export default function PinDots({ length, filled, error }: PinDotsProps) {
  return (
    <div className={`flex items-center justify-center gap-4 ${error ? 'animate-shake' : ''}`}>
      {Array.from({ length }).map((_, i) => (
        <div
          key={i}
          className={`h-4 w-4 rounded-full border-2 transition-colors ${
            error
              ? 'border-destructive bg-destructive'
              : i < filled
              ? 'border-primary bg-primary'
              : 'border-muted-foreground/30 bg-transparent'
          }`}
        />
      ))}
    </div>
  );
}
