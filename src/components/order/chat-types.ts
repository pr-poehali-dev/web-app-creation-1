export interface MessageAttachment {
  url: string;
  name: string;
  type: string;
}

export interface OrderMessage {
  id: string;
  orderId: string;
  senderId: number;
  senderName: string;
  senderType: 'buyer' | 'seller';
  message: string;
  isRead: boolean;
  attachments?: MessageAttachment[];
  createdAt: string;
}

let audioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext | null {
  try {
    const W = window as unknown as { AudioContext: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
    if (!audioCtx) {
      audioCtx = new (W.AudioContext || W.webkitAudioContext!)();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

export function unlockAudio() {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
}

export function playNotificationSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().then(() => playNotificationSound());
      return;
    }
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
  } catch {
    // ignore
  }
}
