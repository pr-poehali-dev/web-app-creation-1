import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { getSession } from '@/utils/auth';
import { playInviteSound } from '@/utils/notificationSound';
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

async function showSystemNotification(title: string, body: string) {
  try {
    if (!('Notification' in window)) return;
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
    playInviteSound().catch(() => { /* ignore */ });
    vibrate([300, 150, 300, 150, 300]);
    if (document.visibilityState !== 'visible') {
      showSystemNotification('Приглашение к онлайн-общению', `${inv.senderName} приглашает обсудить условия сделки`);
    }
  }, []);

  const pollIncomingFn = useCallback(async () => {
    if (!userId) return;
    try {
      const inv = await pollIncoming(userId);
      if (inv) handleNewInvitation(inv);
    } catch (_e) { /* ignore */ }
  }, [userId, handleNewInvitation]);

  useEffect(() => {
    if (!userId) return;
    pollIncomingFn();
    incomingPollRef.current = setInterval(pollIncomingFn, 3000);
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      pollIncomingFn();
      setTimeout(pollIncomingFn, 500);
      setTimeout(pollIncomingFn, 1500);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      if (incomingPollRef.current) clearInterval(incomingPollRef.current);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [userId, pollIncomingFn]);

  useEffect(() => {
    const handler = (e: Event) => {
      const { invitationId, orderId, recipientName } = (e as CustomEvent).detail;
      setSent({ invitationId, orderId, recipientName, status: 'waiting' });
    };
    window.addEventListener('onlineInviteSent', handler);
    return () => window.removeEventListener('onlineInviteSent', handler);
  }, []);

  // Автоскрытие: если чат заказа уже открыт (оба в модалке) — прячем баннер
  useEffect(() => {
    const handler = (e: Event) => {
      const { orderId } = (e as CustomEvent).detail;
      setIncoming(prev => (prev && prev.orderId === orderId ? null : prev));
      setSent(prev => (prev && prev.orderId === orderId && prev.status === 'waiting' ? null : prev));
    };
    window.addEventListener('orderChatOpened', handler);
    return () => window.removeEventListener('orderChatOpened', handler);
  }, []);

  useEffect(() => {
    if (!sent || sent.status !== 'waiting' || !userId) return;
    const poll = async () => {
      try {
        const result = await pollSentStatus(sent.invitationId, userId);
        if (!result) return;
        if (result.status === 'accepted') {
          setSent(prev => prev ? { ...prev, status: 'accepted' } : null);
          playInviteSound().catch(() => { /* ignore */ });
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
      // Полноэкранный backdrop — перекрывает ВСЁ включая модальные окна
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 99999, pointerEvents: 'none' }}
      >
        {/* Карточка приглашения — только она кликабельна */}
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
          <div
            style={{
              background: 'var(--card)',
              border: '2px solid hsl(var(--primary) / 0.5)',
              borderRadius: '1rem',
              padding: '1rem',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)',
            }}
          >
            {/* Заголовок */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: 'hsl(var(--primary) / 0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                📞
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: '14px', margin: 0 }}>Приглашение к онлайн-общению</p>
                <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <strong>{incoming.senderName}</strong> приглашает обсудить условия сделки
                </p>
              </div>
              {/* Крестик — закрыть без ответа */}
              <button
                onClick={() => setIncoming(null)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '4px', marginTop: '-4px', marginRight: '-4px',
                  color: 'var(--muted-foreground)', flexShrink: 0,
                  fontSize: '18px', lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>

            {/* Кнопки */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => { if (!responding) handleRespond('accepted'); }}
                disabled={responding}
                style={{
                  flex: 1, height: '40px', borderRadius: '8px', border: 'none',
                  background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))',
                  fontSize: '13px', fontWeight: 600, cursor: responding ? 'not-allowed' : 'pointer',
                  opacity: responding ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                }}
              >
                ✓ {responding ? 'Подождите…' : 'Принять'}
              </button>
              <button
                onClick={() => { if (!responding) handleRespond('declined'); }}
                disabled={responding}
                style={{
                  flex: 1, height: '40px', borderRadius: '8px',
                  border: '1px solid hsl(var(--border))',
                  background: 'transparent', color: 'hsl(var(--foreground))',
                  fontSize: '13px', cursor: responding ? 'not-allowed' : 'pointer',
                  opacity: responding ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                }}
              >
                ✕ Не сейчас
              </button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // ── Статус отправленного приглашения ──────────────────────────────────────
  if (sent) {
    const content = sent.status === 'waiting' ? (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'hsl(var(--primary))', flexShrink: 0, animation: 'pulse 1.5s infinite' }} />
        <p style={{ fontSize: '14px', flex: 1, margin: 0 }}>
          Ожидаем ответ от <strong>{sent.recipientName}</strong>…
        </p>
        <button onClick={() => setSent(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', fontSize: '16px', color: 'var(--muted-foreground)' }}>✕</button>
      </div>
    ) : sent.status === 'accepted' ? (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
        <p style={{ fontSize: '14px', fontWeight: 600, color: '#16a34a', margin: 0 }}>Приглашение принято — открываю чат…</p>
      </div>
    ) : (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '16px' }}>📵</span>
        <p style={{ fontSize: '14px', color: 'var(--muted-foreground)', flex: 1, margin: 0 }}>Не в сети. Предложите цену — ответит позже</p>
        <button onClick={() => setSent(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', fontSize: '16px', color: 'var(--muted-foreground)' }}>✕</button>
      </div>
    );

    return createPortal(
      <div style={{ position: 'fixed', inset: 0, zIndex: 99999, pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute', bottom: '80px', left: '50%', transform: 'translateX(-50%)',
          width: 'calc(100% - 2rem)', maxWidth: '400px', pointerEvents: 'all',
        }}
          className="animate-in slide-in-from-bottom-4 fade-in duration-300"
        >
          <div style={{
            background: 'var(--card)', border: '1px solid hsl(var(--border))',
            borderRadius: '1rem', padding: '12px 16px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          }}>
            {content}
          </div>
        </div>
      </div>,
      document.body
    );
  }

  return null;
}