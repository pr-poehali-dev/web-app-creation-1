// AudioContext — создаётся и разблокируется при первом взаимодействии
let audioContext: AudioContext | null = null;

// Заранее подготовленный Audio элемент — разблокируется при первом тапе
let preloadedAudio: HTMLAudioElement | null = null;

// Генерируем WAV-звонок как Blob URL
const createRingtoneBlob = (): string => {
  const sampleRate = 22050;
  const duration = 1.8; // секунды
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  const writeStr = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
  };
  writeStr(0, 'RIFF'); view.setUint32(4, 36 + numSamples * 2, true);
  writeStr(8, 'WAVE'); writeStr(12, 'fmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true);
  view.setUint16(22, 1, true); view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true);
  view.setUint16(34, 16, true); writeStr(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  // Телефонный звонок: 3 пары импульсов (880Hz + 1100Hz)
  const pairs = [
    { t: 0,    freq: 880 },  { t: 0.15, freq: 1100 },
    { t: 0.45, freq: 880 },  { t: 0.60, freq: 1100 },
    { t: 0.90, freq: 880 },  { t: 1.05, freq: 1100 },
  ];

  for (let i = 0; i < numSamples; i++) {
    let sample = 0;
    const sec = i / sampleRate;
    for (const { t, freq } of pairs) {
      const end = t + 0.18;
      if (sec >= t && sec < end) {
        const localT = sec - t;
        const env = Math.min(localT / 0.01, 1) * Math.min((end - sec) / 0.05, 1);
        sample += Math.sin(2 * Math.PI * freq * localT) * 0.4 * env;
      }
    }
    view.setInt16(44 + i * 2, Math.max(-32767, Math.min(32767, sample * 32767)), true);
  }

  const blob = new Blob([buffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
};

let ringtoneBlobUrl: string | null = null;

const getRingtoneUrl = () => {
  if (!ringtoneBlobUrl) ringtoneBlobUrl = createRingtoneBlob();
  return ringtoneBlobUrl;
};

// Разблокировка AudioContext + preload Audio — вызывается при ЛЮБОМ жесте
const unlockAudio = () => {
  // 1. WebAudio Context
  if (!audioContext) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (_e) { /* ignore */ }
  }
  if (audioContext?.state === 'suspended') {
    audioContext.resume().catch(() => { /* ignore */ });
  }

  // 2. HTML5 Audio preload — создаём элемент c тишиной чтобы разблокировать iOS,
  //    но сам рингтон НЕ загружаем сейчас — только при реальном вызове
  if (!preloadedAudio) {
    try {
      // Используем data-URI тишины (0.1 сек) — разблокирует элемент без звука
      const silenceUrl = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAA' +
        'EAAQARKwAAESsAAAEACABkYXRhAAAAAA==';
      const unlockEl = new Audio(silenceUrl);
      unlockEl.volume = 0;
      unlockEl.play().then(() => {
        unlockEl.pause();
        // Теперь создаём настоящий preloaded элемент — уже без play()
        preloadedAudio = new Audio(getRingtoneUrl());
        preloadedAudio.preload = 'auto';
        preloadedAudio.volume = 0.8;
      }).catch(() => { /* autoplay blocked — ничего страшного */ });
    } catch (_e) { /* ignore */ }
  }
};

if (typeof window !== 'undefined') {
  // Только явные жесты пользователя — scroll убран, он срабатывал при входе
  const events = ['touchstart', 'click', 'keydown', 'pointerdown'];
  const onceUnlock = () => {
    unlockAudio();
    // После первого срабатывания снимаем все слушатели
    events.forEach(evt => window.removeEventListener(evt, onceUnlock, true));
  };
  events.forEach(evt => {
    window.addEventListener(evt, onceUnlock, { passive: true, capture: true, once: false });
  });
}

const playNote = (
  ctx: AudioContext,
  frequency: number,
  startTime: number,
  duration: number,
  volume: number = 0.3
) => {
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  oscillator.frequency.value = frequency;
  oscillator.type = 'sine';
  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.05);
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
  } catch (_err) { /* audio unavailable */ }
};

export const enableNotificationSound = () => { unlockAudio(); };

// Звук входящего приглашения — сначала WebAudio, потом preloadedAudio, потом новый Audio
export const playInviteSound = async () => {
  // Вариант 1: WebAudio
  if (audioContext) {
    try {
      // Обязательно resume — контекст может быть suspended
      if (audioContext.state === 'suspended') await audioContext.resume();
      if (audioContext.state === 'running') {
        const t = audioContext.currentTime;
        const pulses = [
          { freq: 880,  time: 0 },    { freq: 1100, time: 0.15 },
          { freq: 880,  time: 0.45 }, { freq: 1100, time: 0.60 },
          { freq: 880,  time: 0.90 }, { freq: 1100, time: 1.05 },
        ];
        pulses.forEach(({ freq, time }) => {
          playNote(audioContext!, freq, t + time, 0.18, 0.35);
        });
        return;
      }
    } catch (_e) { /* fall through */ }
  }

  // Вариант 2: Заранее разблокированный Audio элемент (iOS после первого тапа)
  if (preloadedAudio) {
    try {
      // Клонируем чтобы избежать конфликта если элемент занят
      const clone = preloadedAudio.cloneNode() as HTMLAudioElement;
      clone.volume = 0.8;
      clone.currentTime = 0;
      await clone.play();
      return;
    } catch (_e) { /* fall through */ }
  }

  // Вариант 3: Новый Audio элемент с blob URL
  try {
    const audio = new Audio(getRingtoneUrl());
    audio.volume = 0.8;
    await audio.play();
  } catch (_e) { /* autoplay blocked */ }
};