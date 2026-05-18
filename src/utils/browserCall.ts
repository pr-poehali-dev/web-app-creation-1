/**
 * Браузерный звонок-уведомление при новом заказе
 * Воспроизводит звук звонка и показывает всплывающее окно
 */

let ringAudioCtx: AudioContext | null = null;
let ringInterval: ReturnType<typeof setInterval> | null = null;
let isRinging = false;

function getAudioContext(): AudioContext {
  if (!ringAudioCtx || ringAudioCtx.state === 'closed') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) throw new Error('AudioContext not supported');
    ringAudioCtx = new AudioCtx();
  }
  return ringAudioCtx;
}

function playRingTone(ctx: AudioContext) {
  const now = ctx.currentTime;

  const tones = [
    { freq: 480, start: 0, end: 0.4 },
    { freq: 620, start: 0, end: 0.4 },
  ];

  tones.forEach(({ freq, start, end }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.value = freq;
    osc.type = 'sine';

    gain.gain.setValueAtTime(0, now + start);
    gain.gain.linearRampToValueAtTime(0.25, now + start + 0.02);
    gain.gain.setValueAtTime(0.25, now + end - 0.05);
    gain.gain.linearRampToValueAtTime(0, now + end);

    osc.start(now + start);
    osc.stop(now + end);
  });
}

export function startBrowserRing() {
  if (isRinging) return;
  isRinging = true;

  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    playRingTone(ctx);

    ringInterval = setInterval(() => {
      if (!isRinging) {
        stopBrowserRing();
        return;
      }
      try {
        const c = getAudioContext();
        if (c.state === 'suspended') c.resume();
        playRingTone(c);
      } catch (err) {
        console.error('[BROWSER_CALL] ring error:', err);
      }
    }, 2000);
  } catch (e) {
    console.error('[BROWSER_CALL] Ошибка воспроизведения звонка:', e);
  }
}

export function stopBrowserRing() {
  isRinging = false;
  if (ringInterval) {
    clearInterval(ringInterval);
    ringInterval = null;
  }
}

export function isCurrentlyRinging(): boolean {
  return isRinging;
}