import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
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

export default function OnlineInviteBanner({ onOpenOrderChat }: Props) {
  const [incoming, setIncoming] = useState<Invitation | null>(null);
  const [sent, setSent] = useState<SentState | null>(null);
  const [responding, setResponding] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  const seenInvites = useRef<Set<number>>(new Set());
  const sentPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const incomingPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Получаем userId надёжно — и при монтировании, и при смене сессии
  useEffect(() => {
    const sync = () => {
      const session = getSession();
      const id = session?.id ? Number(session.id) : null;
      setUserId(id);
    };
    sync();
    window.addEventListener('userSessionChanged', sync);
    window.addEventListener('userLoggedOut', () => setUserId(null));
    return () => {
      window.removeEventListener('userSessionChanged', sync);
    };
  }, []);

  // ── Polling входящих приглашений ────────────────────────────────────────────
  const pollIncomingFn = useCallback(async () => {
    if (!userId) return;
    const inv = await pollIncoming(userId);
    if (inv && !seenInvites.current.has(inv.id)) {
      console.log('[INVITE] incoming invitation:', inv);
      seenInvites.current.add(inv.id);
      setIncoming(inv);
      playInviteSound().catch(() => {});
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    console.log('[INVITE] starting poll for userId=', userId);
    pollIncomingFn();
    incomingPollRef.current = setInterval(pollIncomingFn, 3000);

    // При возврате в приложение (из фона / неактивной вкладки) — сразу опрашиваем
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        pollIncomingFn();
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      if (incomingPollRef.current) clearInterval(incomingPollRef.current);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [userId, pollIncomingFn]);

  // ── Слушаем событие отправки приглашения ──────────────────────────────────
  useEffect(() => {
    const handler = (e: Event) => {
      const { invitationId, orderId, recipientName } = (e as CustomEvent).detail;
      console.log('[INVITE] sent event:', { invitationId, orderId, recipientName });
      setSent({ invitationId, orderId, recipientName, status: 'waiting' });
    };
    window.addEventListener('onlineInviteSent', handler);
    return () => window.removeEventListener('onlineInviteSent', handler);
  }, []);

  // ── Polling статуса отправленного приглашения ─────────────────────────────
  useEffect(() => {
    if (!sent || sent.status !== 'waiting' || !userId) return;

    const poll = async () => {
      const result = await pollSentStatus(sent.invitationId, userId);
      if (!result) return;
      console.log('[INVITE] sent status:', result.status);
      if (result.status === 'accepted') {
        setSent(prev => prev ? { ...prev, status: 'accepted' } : null);
        playInviteSound().catch(() => {});
        if (sentPollRef.current) clearInterval(sentPollRef.current);
        setTimeout(() => {
          onOpenOrderChat(result.orderId);
          setTimeout(() => setSent(null), 4000);
        }, 1500);
      } else if (result.status === 'declined' || result.status === 'expired' || result.status === 'not_found') {
        setSent(prev => prev ? { ...prev, status: 'declined' } : null);
        if (sentPollRef.current) clearInterval(sentPollRef.current);
        setTimeout(() => setSent(null), 6000);
      }
    };

    sentPollRef.current = setInterval(poll, 3000);
    return () => {
      if (sentPollRef.current) clearInterval(sentPollRef.current);
    };
  }, [sent?.invitationId, sent?.status, userId, onOpenOrderChat]);

  // ── Ответ на входящее приглашение ─────────────────────────────────────────
  const handleRespond = async (response: 'accepted' | 'declined') => {
    if (!incoming || !userId) return;
    setResponding(true);
    const result = await respondToInvitation(incoming.id, userId, response);
    setResponding(false);
    setIncoming(null);
    if (response === 'accepted' && result?.orderId) {
      onOpenOrderChat(result.orderId);
    }
  };

  // ── Рендер: входящее приглашение ─────────────────────────────────────────
  if (incoming) {
    return (
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-300">
        <div className="bg-card border border-primary/30 shadow-2xl rounded-2xl p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 animate-pulse">
              <Icon name="PhoneCall" size={20} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm leading-tight">Приглашение к онлайн-общению</p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                <span className="font-medium text-foreground">{incoming.senderName}</span>
                {incoming.offerTitle ? ` · ${incoming.offerTitle}` : ' приглашает обсудить сделку'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 h-9 text-xs font-semibold"
              onClick={() => handleRespond('accepted')}
              disabled={responding}
            >
              <Icon name="Check" size={14} className="mr-1" />
              Принять
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-9 text-xs"
              onClick={() => handleRespond('declined')}
              disabled={responding}
            >
              <Icon name="X" size={14} className="mr-1" />
              Не сейчас
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Рендер: статус отправленного приглашения ──────────────────────────────
  if (sent) {
    if (sent.status === 'waiting') {
      return (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="bg-card border border-muted shadow-xl rounded-2xl px-4 py-3 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" />
            <p className="text-sm flex-1">
              Ожидаем ответ от <span className="font-semibold">{sent.recipientName}</span>…
            </p>
            <button onClick={() => setSent(null)} className="text-muted-foreground hover:text-foreground p-1">
              <Icon name="X" size={16} />
            </button>
          </div>
        </div>
      );
    }

    if (sent.status === 'accepted') {
      return (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="bg-card border border-green-500/40 shadow-xl rounded-2xl px-4 py-3 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
            <p className="text-sm flex-1 font-semibold text-green-600">
              Приглашение принято — открываю чат…
            </p>
          </div>
        </div>
      );
    }

    if (sent.status === 'declined') {
      return (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="bg-card border border-muted shadow-xl rounded-2xl px-4 py-3 flex items-start gap-3">
            <Icon name="WifiOff" size={18} className="text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-sm flex-1 text-muted-foreground">
              Не в сети. Предложите цену и условия — ответит позже
            </p>
            <button onClick={() => setSent(null)} className="text-muted-foreground hover:text-foreground p-1">
              <Icon name="X" size={16} />
            </button>
          </div>
        </div>
      );
    }
  }

  return null;
}