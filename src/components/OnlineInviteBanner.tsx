import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { getSession } from '@/utils/auth';
import {
  pollIncoming,
  pollSentStatus,
  respondToInvitation,
  type Invitation,
} from '@/services/onlineInvite';

interface SentState {
  invitationId: number;
  orderId: string;
  recipientName: string;
  status: 'waiting' | 'accepted' | 'declined';
}

interface Props {
  onOpenOrderChat: (orderId: string) => void;
}

function vibrate(pattern: number | number[]) {
  try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (_e) { /* ignore */ }
}

// Звук через Web Audio API — работает без предварительного жеста на мобиле
// при условии что AudioContext создаётся прямо в ответ на событие
async function playRingSound() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    if (ctx.state === 'suspended') await ctx.resume();

    const pulses = [
      { freq: 880, time: 0 },    { freq: 1100, time: 0.15 },
      { freq: 880, time: 0.45 }, { freq: 1100, time: 0.60 },
      { freq: 880, time: 0.90 }, { freq: 1100, time: 1.05 },
    ];
    const now = ctx.currentTime;
    pulses.forEach(({ freq, time }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + time);
      gain.gain.linearRampToValueAtTime(0.4, now + time + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + time + 0.18);
      osc.start(now + time);
      osc.stop(now + time + 0.22);
    });
  } catch (_e) { /* audio unavailable */ }
}

async function showSystemNotification(title: string, body: string) {
  try {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico', tag: 'online-invite', renotify: true });
    }
  } catch (_e) { /* ignore */ }
}

export default function OnlineInviteBanner({ onOpenOrderChat }: Props) {
  const [incoming, setIncoming] = useState<Invitation | null>(null);
  const [sent, setSent] = useState<SentState | null>(null);
  const [responding, setResponding] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  const seenInvites = useRef<Set<number>>(new Set());
  const sentPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const incomingPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const sync = () => {
      const session = getSession();
      setUserId(session?.id ? Number(session.id) : null);
    };
    sync();
    window.addEventListener('userSessionChanged', sync);
    window.addEventListener('userLoggedOut', () => setUserId(null));
    return () => { window.removeEventListener('userSessionChanged', sync); };
  }, []);

  const handleNewInvitation = useCallback((inv: Invitation) => {
    if (seenInvites.current.has(inv.id)) return;
    seenInvites.current.add(inv.id);
    setIncoming(inv);

    // Звук — создаём AudioContext прямо здесь, в потоке события
    playRingSound();

    // Вибрация — длинная на мобиле
    vibrate([400, 200, 400, 200, 400, 200, 400]);

    // Системное уведомление — запрашиваем разрешение если нет
    showSystemNotification(
      '📞 Приглашение к онлайн-общению',
      `${inv.senderName} приглашает обсудить условия сделки`
    );
  }, []);

  const pollIncomingFn = useCallback(async () => {
    if (!userId) return;
    try {
      const inv = await pollIncoming(userId);
      if (inv) handleNewInvitation(inv);
    } catch (_e) { /* ignore */ }
  }, [userId, handleNewInvitation]);

  // Основной polling каждые 3 сек
  useEffect(() => {
    if (!userId) return;
    pollIncomingFn();
    incomingPollRef.current = setInterval(pollIncomingFn, 3000);

    // При пробуждении экрана — сразу несколько быстрых запросов
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      pollIncomingFn();
      setTimeout(pollIncomingFn, 300);
      setTimeout(pollIncomingFn, 800);
      setTimeout(pollIncomingFn, 1500);
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      if (incomingPollRef.current) clearInterval(incomingPollRef.current);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [userId, pollIncomingFn]);

  // Heartbeat — отдельный запрос каждые 20 сек чтобы поддерживать online_presence
  // Это отдельно от pollIncoming, чтобы пользователь оставался онлайн даже если
  // мобильный браузер замедляет polling
  useEffect(() => {
    if (!userId) return;
    const sendHeartbeat = () => {
      // pollIncoming заодно обновляет last_seen_at на бэкенде
      pollIncoming(userId).catch(() => {});
    };
    heartbeatRef.current = setInterval(sendHeartbeat, 20000);
    return () => { if (heartbeatRef.current) clearInterval(heartbeatRef.current); };
  }, [userId]);

  useEffect(() => {
    const handler = (e: Event) => {
      const { invitationId, orderId, recipientName } = (e as CustomEvent).detail;
      setSent({ invitationId, orderId, recipientName, status: 'waiting' });
    };
    window.addEventListener('onlineInviteSent', handler);
    return () => window.removeEventListener('onlineInviteSent', handler);
  }, []);

  // Автоскрытие когда чат уже открыт
  useEffect(() => {
    const handler = (e: Event) => {
      const { orderId } = (e as CustomEvent).detail;
      setIncoming(prev => (prev && prev.orderId === orderId ? null : prev));
      setSent(prev => (prev && prev.orderId === orderId && prev.status === 'waiting' ? null : prev));
    };
    window.addEventListener('orderChatOpened', handler);
    return () => window.removeEventListener('orderChatOpened', handler);
  }, []);

  // Polling статуса отправленного приглашения
  useEffect(() => {
    if (!sent || sent.status !== 'waiting' || !userId) return;
    const poll = async () => {
      try {
        const result = await pollSentStatus(sent.invitationId, userId);
        if (!result) return;
        if (result.status === 'accepted') {
          setSent(prev => prev ? { ...prev, status: 'accepted' } : null);
          playRingSound();
          vibrate([500, 100, 500]);
          if (sentPollRef.current) clearInterval(sentPollRef.current);
          setTimeout(() => { onOpenOrderChat(result.orderId); setTimeout(() => setSent(null), 4000); }, 1500);
        } else if (['declined', 'expired', 'not_found'].includes(result.status)) {
          setSent(prev => prev ? { ...prev, status: 'declined' } : null);
          if (sentPollRef.current) clearInterval(sentPollRef.current);
          setTimeout(() => setSent(null), 6000);
        }
      } catch (_e) { /* ignore */ }
    };
    sentPollRef.current = setInterval(poll, 3000);
    return () => { if (sentPollRef.current) clearInterval(sentPollRef.current); };
  }, [sent?.invitationId, sent?.status, userId, onOpenOrderChat]);

  const handleRespond = async (response: 'accepted' | 'declined') => {
    if (!incoming || !userId) return;
    setResponding(true);
    try {
      const result = await respondToInvitation(incoming.id, userId, response);
      setIncoming(null);
      if (response === 'accepted' && result?.orderId) onOpenOrderChat(result.orderId);
    } finally {
      setResponding(false);
    }
  };

  // ── Входящее приглашение ──────────────────────────────────────────────────
  if (incoming) {
    return createPortal(
      <div style={{ position: 'fixed', inset: 0, zIndex: 99999, pointerEvents: 'none' }}>
        <div
          style={{
            position: 'absolute',
            bottom: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'calc(100% - 2rem)',
            maxWidth: '400px',
            pointerEvents: 'all',
          }}
          className="animate-in slide-in-from-bottom-4 fade-in duration-300"
        >
          <div style={{
            background: 'var(--card)',
            border: '2px solid hsl(var(--primary) / 0.5)',
            borderRadius: '1rem',
            padding: '1rem',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: 'hsl(var(--primary) / 0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                fontSize: '20px',
              }}>
                📞
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: '14px', margin: 0 }}>Приглашение к онлайн-общению</p>
                <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <strong>{incoming.senderName}</strong> приглашает обсудить условия сделки
                </p>
              </div>
              <button
                onClick={() => setIncoming(null)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '4px', marginTop: '-4px', marginRight: '-4px',
                  color: 'var(--muted-foreground)', flexShrink: 0,
                  fontSize: '18px', lineHeight: 1,
                }}
              >✕</button>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => { if (!responding) handleRespond('accepted'); }}
                disabled={responding}
                style={{
                  flex: 1, height: '44px', borderRadius: '8px', border: 'none',
                  background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))',
                  fontSize: '14px', fontWeight: 600, cursor: responding ? 'not-allowed' : 'pointer',
                  opacity: responding ? 0.7 : 1,
                }}
              >
                {responding ? 'Открываю...' : '✓ Принять'}
              </button>
              <button
                onClick={() => { if (!responding) handleRespond('declined'); }}
                disabled={responding}
                style={{
                  flex: 1, height: '44px', borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--background)', color: 'var(--foreground)',
                  fontSize: '14px', cursor: responding ? 'not-allowed' : 'pointer',
                  opacity: responding ? 0.7 : 1,
                }}
              >
                Отклонить
              </button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // ── Статус отправленного приглашения ─────────────────────────────────────
  if (sent) {
    const colors = {
      waiting: { bg: 'var(--card)', border: 'hsl(var(--primary) / 0.4)', text: 'var(--muted-foreground)' },
      accepted: { bg: '#f0fdf4', border: '#22c55e', text: '#16a34a' },
      declined: { bg: 'var(--card)', border: 'hsl(var(--destructive) / 0.4)', text: 'hsl(var(--destructive))' },
    }[sent.status];

    return createPortal(
      <div style={{ position: 'fixed', inset: 0, zIndex: 99998, pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute', bottom: '80px', left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 2rem)', maxWidth: '360px', pointerEvents: 'all',
        }}
          className="animate-in slide-in-from-bottom-4 fade-in duration-300"
        >
          <div style={{
            background: colors.bg,
            border: `2px solid ${colors.border}`,
            borderRadius: '1rem', padding: '0.875rem 1rem',
            boxShadow: '0 20px 40px -8px rgba(0,0,0,0.3)',
            display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <span style={{ fontSize: '20px', flexShrink: 0 }}>
              {sent.status === 'waiting' ? '📡' : sent.status === 'accepted' ? '✅' : '❌'}
            </span>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600, fontSize: '13px', margin: 0, color: colors.text }}>
                {sent.status === 'waiting' && `Ожидаем ответа от ${sent.recipientName}…`}
                {sent.status === 'accepted' && `${sent.recipientName} принял приглашение!`}
                {sent.status === 'declined' && `${sent.recipientName} отклонил приглашение`}
              </p>
              {sent.status === 'waiting' && (
                <p style={{ fontSize: '11px', color: 'var(--muted-foreground)', margin: '2px 0 0' }}>
                  Ждём до 2 минут
                </p>
              )}
            </div>
            <button
              onClick={() => setSent(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--muted-foreground)', fontSize: '16px' }}
            >✕</button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  return null;
}
