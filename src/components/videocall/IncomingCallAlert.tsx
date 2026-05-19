import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { type VideoCallPayload, clearIncomingCall, clearCallSignal, getJitsiUrl } from '@/services/videoCallService';
import { getAudioContext } from '@/components/order/chat-types';

export default function IncomingCallAlert() {
  const [call, setCall] = useState<VideoCallPayload | null>(null);
  const [seconds, setSeconds] = useState(30);
  const playingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ringTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callRef = useRef<VideoCallPayload | null>(null);

  // Звонок через общий AudioContext (уже разблокированный пользователем)
  const ring = useCallback(() => {
    if (!playingRef.current) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const resume = () => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.setValueAtTime(660, ctx.currentTime + 0.15);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
        if (playingRef.current) {
          ringTimerRef.current = setTimeout(ring, 1400);
        }
      };

      if (ctx.state === 'suspended') {
        ctx.resume().then(resume).catch(() => {});
      } else {
        resume();
      }
    } catch {
      // браузер заблокировал
    }
  }, []);

  const startRinging = useCallback(() => {
    playingRef.current = true;
    ring();
  }, [ring]);

  const stopRinging = useCallback(() => {
    playingRef.current = false;
    if (ringTimerRef.current) {
      clearTimeout(ringTimerRef.current);
      ringTimerRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const showCall = useCallback((payload: VideoCallPayload, remainingSeconds = 30) => {
    // Не показываем свой же звонок (инициатор)
    const myId = localStorage.getItem('userId');
    if (myId && payload.callerId === myId) return;

    callRef.current = payload;
    setCall(payload);
    setSeconds(remainingSeconds);
    stopRinging();
    startRinging();

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          handleDecline();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [startRinging, stopRinging]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDecline = useCallback(() => {
    stopRinging();
    clearIncomingCall();
    callRef.current = null;
    setCall(null);
  }, [stopRinging]);

  const handleAccept = useCallback(() => {
    const c = callRef.current;
    if (!c) return;
    stopRinging();
    clearIncomingCall();
    // Снимаем звонок из БД — инициатор увидит что принято
    clearCallSignal(c.orderId);
    callRef.current = null;
    setCall(null);
    window.open(getJitsiUrl(c.roomId, c.callMode || 'video'), '_blank');
  }, [stopRinging]);

  useEffect(() => {
    // Слушаем CustomEvent (когда страница уже открыта)
    const handleIncoming = (e: Event) => {
      const payload = (e as CustomEvent<VideoCallPayload>).detail;
      showCall(payload);
    };

    const handleCleared = () => {
      stopRinging();
      callRef.current = null;
      setCall(null);
    };

    window.addEventListener('incoming_video_call', handleIncoming);
    window.addEventListener('call_cleared', handleCleared);

    // Polling localStorage каждую секунду — надёжный fallback для push-уведомлений
    const pollId = setInterval(() => {
      if (callRef.current) return; // уже показываем звонок
      const stored = localStorage.getItem('incoming_call');
      if (!stored) return;
      try {
        const parsed = JSON.parse(stored) as VideoCallPayload & { timestamp: number };
        const elapsed = Math.floor((Date.now() - parsed.timestamp) / 1000);
        if (elapsed < 30) {
          showCall(parsed, Math.max(1, 30 - elapsed));
        } else {
          clearIncomingCall();
        }
      } catch {
        clearIncomingCall();
      }
    }, 1000);

    return () => {
      window.removeEventListener('incoming_video_call', handleIncoming);
      window.removeEventListener('call_cleared', handleCleared);
      clearInterval(pollId);
      stopRinging();
    };
  }, [showCall, stopRinging]);

  if (!call) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-sm animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-border overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-green-400 to-emerald-500" />
        <div className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-md">
                <Icon name={call.callMode === 'audio' ? 'Phone' : 'Video'} className="h-6 w-6 text-white" />
              </div>
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white">
                <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75" />
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Входящий {call.callMode === 'audio' ? 'аудио' : 'видео'}звонок
              </p>
              <p className="font-semibold text-foreground truncate">{call.callerName}</p>
              <p className="text-xs text-muted-foreground truncate">По заказу #{call.orderId}</p>
            </div>
            <span className="text-sm font-mono text-muted-foreground tabular-nums">{seconds}с</span>
          </div>

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
              <Icon name={call.callMode === 'audio' ? 'Phone' : 'Video'} className="h-4 w-4" />
              Принять
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}