import { useEffect, useRef } from 'react';
import { ordersAPI } from '@/services/api';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx) audioCtx = new AudioContext();
    return audioCtx;
  } catch {
    return null;
  }
}

function playNotificationSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const resume = () => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1046, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    };
    if (ctx.state === 'suspended') {
      ctx.resume().then(resume);
    } else {
      resume();
    }
  } catch {
    // ignore
  }
}

interface MessageCount {
  [orderId: string]: number;
}

export function useGlobalMessagePolling(enabled: boolean) {
  const msgCountRef = useRef<MessageCount>({});
  const initialized = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const poll = async () => {
      try {
        const [salesRes, purchasesRes] = await Promise.all([
          ordersAPI.getAll('sale', 'accepted'),
          ordersAPI.getAll('purchase', 'accepted'),
        ]);

        const orders = [
          ...(salesRes.orders || []),
          ...(purchasesRes.orders || []),
        ];

        const uniqueOrders = Array.from(
          new Map(orders.map((o: { id: string }) => [o.id, o])).values()
        ) as { id: string }[];

        await Promise.all(
          uniqueOrders.map(async (order) => {
            try {
              const data = await ordersAPI.getMessagesByOrder(order.id);
              const messages = data.messages || [];
              const count = messages.length;
              const prev = msgCountRef.current[order.id];

              if (initialized.current && prev !== undefined && count > prev) {
                const lastMsg = messages[messages.length - 1];
                const senderType = lastMsg.senderType || lastMsg.sender_type;
                const storedRole = localStorage.getItem('userRole');
                const isFromOther = storedRole === 'buyer'
                  ? senderType !== 'buyer'
                  : senderType !== 'seller';

                if (isFromOther && localStorage.getItem('soundNotificationsEnabled') !== 'false') {
                  playNotificationSound();
                }
              }

              msgCountRef.current[order.id] = count;
            } catch {
              // ignore per-order errors
            }
          })
        );

        initialized.current = true;
      } catch {
        // ignore
      }
    };

    poll();
    const interval = setInterval(poll, 8000);
    return () => clearInterval(interval);
  }, [enabled]);
}
