// Глобальный AudioContext — инициализируется один раз после первого тапа
let audioContext: AudioContext | null = null;

// Разблокируем AudioContext по первому взаимодействию пользователя
const unlockAudio = () => {
  if (audioContext) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioContext.state === 'suspended') {
      audioContext.resume().catch(() => {});
    }
  } catch (_e) {}
};

// Вешаем на первый тап — до этого момента звук играть нельзя
if (typeof window !== 'undefined') {
  window.addEventListener('touchstart', unlockAudio, { once: true, passive: true });
  window.addEventListener('click', unlockAudio, { once: true });
  window.addEventListener('keydown', unlockAudio, { once: true });
}

const playNote = (
  ctx: AudioContext,
  frequency: number,
  startTime: number,
  duration: number,
  volume: number = 0.15
) => {
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  oscillator.frequency.value = frequency;
  oscillator.type = 'sine';
  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
};

export const playNotificationSound = async () => {
  try {
    if (!audioContext) return;
    if (audioContext.state === 'suspended') await audioContext.resume();
    const t = audioContext.currentTime;
    const melody = [
      { freq: 523.25, time: 0, duration: 0.15 },
      { freq: 659.25, time: 0.12, duration: 0.15 },
      { freq: 783.99, time: 0.24, duration: 0.15 },
      { freq: 1046.50, time: 0.36, duration: 0.25 },
    ];
    melody.forEach(note => playNote(audioContext!, note.freq, t + note.time, note.duration));
  } catch (_e) {}
};

export const enableNotificationSound = () => {
  unlockAudio();
};

// Звук приглашения — использует уже разблокированный контекст
// Если контекст ещё не разблокирован (пользователь ни разу не тапал) — тихо пропускаем
export const playInviteSound = async () => {
  try {
    if (!audioContext) {
      // Пробуем создать на случай если unlockAudio не вызвался
      unlockAudio();
    }
    if (!audioContext) return;
    if (audioContext.state === 'suspended') await audioContext.resume();
    const t = audioContext.currentTime;
    const pulses = [
      { freq: 783.99, time: 0 },
      { freq: 987.77, time: 0.22 },
      { freq: 1174.66, time: 0.44 },
      { freq: 783.99, time: 0.72 },
      { freq: 987.77, time: 0.94 },
      { freq: 1174.66, time: 1.16 },
    ];
    pulses.forEach(({ freq, time }) => {
      playNote(audioContext!, freq, t + time, 0.2, 0.18);
    });
  } catch (_e) {}
};
