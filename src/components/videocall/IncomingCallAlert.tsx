import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { type VideoCallPayload, clearIncomingCall, getJitsiUrl } from '@/services/videoCallService';

export default function IncomingCallAlert() {
  const [call, setCall] = useState<VideoCallPayload | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [seconds, setSeconds] = useState(30);

  // Генерируем звук звонка через Web Audio API
  const startRinging = () => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      let playing = true;

      const ring = () => {
        if (!playing) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.setValueAtTime(660, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
        if (playing) setTimeout(ring, 1200);
      };

      ring();
      audioRef.current = { pause: () => { playing = false; ctx.close(); } } as unknown as HTMLAudioElement;
    } catch {
      // браузер заблокировал — ничего страшного
    }
  };

  const stopRinging = () => {
    audioRef.current?.pause();
    audioRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
  };

  useEffect(() => {
    const handleIncoming = (e: Event) => {
      const payload = (e as CustomEvent<VideoCallPayload>).detail;
      setCall(payload);
      setSeconds(30);
      startRinging();
      // Автоотбой через 30 секунд
      timerRef.current = setInterval(() => {
        setSeconds(prev => {
          if (prev <= 1) {
            handleDecline();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    };

    const handleCleared = () => {
      setCall(null);
      stopRinging();
    };

    window.addEventListener('incoming_video_call', handleIncoming);
    window.addEventListener('call_cleared', handleCleared);

    // Восстановим звонок если страница перезагрузилась пока шёл звонок
    const stored = localStorage.getItem('incoming_call');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as VideoCallPayload & { timestamp: number };
        if (Date.now() - parsed.timestamp < 30000) {
          setCall(parsed);
          setSeconds(Math.max(1, 30 - Math.floor((Date.now() - parsed.timestamp) / 1000)));
          startRinging();
        } else {
          clearIncomingCall();
        }
      } catch {
        clearIncomingCall();
      }
    }

    return () => {
      window.removeEventListener('incoming_video_call', handleIncoming);
      window.removeEventListener('call_cleared', handleCleared);
      stopRinging();
    };
  }, []);

  const handleAccept = () => {
    if (!call) return;
    stopRinging();
    clearIncomingCall();
    setCall(null);
    window.open(getJitsiUrl(call.roomId), '_blank');
  };

  const handleDecline = () => {
    stopRinging();
    clearIncomingCall();
    setCall(null);
  };

  if (!call) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-sm animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-border overflow-hidden">
        {/* Зелёная полоска сверху */}
        <div className="h-1 bg-gradient-to-r from-green-400 to-emerald-500" />

        <div className="p-4">
          {/* Аватар + имя */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-md">
                <Icon name="Video" className="h-6 w-6 text-white" />
              </div>
              {/* Пульсирующий индикатор */}
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white">
                <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75" />
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Входящий видеозвонок</p>
              <p className="font-semibold text-foreground truncate">{call.callerName}</p>
              <p className="text-xs text-muted-foreground truncate">По заказу #{call.orderId}</p>
            </div>
            <span className="text-sm font-mono text-muted-foreground tabular-nums">{seconds}с</span>
          </div>

          {/* Кнопки */}
          <div className="flex gap-3">
            <Button
              onClick={handleDecline}
              variant="outline"
              className="flex-1 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/5 hover:border-destructive gap-2"
            >
              <Icon name="PhoneOff" className="h-4 w-4" />
              Отклонить
            </Button>
            <Button
              onClick={handleAccept}
              className="flex-1 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white gap-2 shadow-md shadow-green-200"
            >
              <Icon name="Video" className="h-4 w-4" />
              Принять
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
