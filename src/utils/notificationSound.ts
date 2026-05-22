// AudioContext — инициализируется после первого тапа пользователя
let audioContext: AudioContext | null = null;
let audioUnlocked = false;

const tryCreateContext = () => {
  if (audioContext) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioContext.state === 'suspended') {
      audioContext.resume().catch((_err) => { audioUnlocked = false; });
    }
    audioUnlocked = true;
  } catch (_err) { audioUnlocked = false; }
};

const unlockAudio = () => {
  tryCreateContext();
  audioUnlocked = true;
};

if (typeof window !== 'undefined') {
  ['touchstart', 'touchend', 'click', 'keydown', 'pointerdown'].forEach(evt => {
    window.addEventListener(evt, unlockAudio, { once: false, passive: true, capture: true });
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

// Сначала пробуем WebAudio, при неудаче — HTML5 Audio beep
const playFallbackBeep = () => {
  try {
    // Короткий beep через HTML5 Audio Data URI (WAV 440Hz)
    const sampleRate = 44100;
    const numSamples = sampleRate * 2; // 2 секунды
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);
    // WAV header
    const writeStr = (off: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)); };
    writeStr(0, 'RIFF'); view.setUint32(4, 36 + numSamples * 2, true);
    writeStr(8, 'WAVE'); writeStr(12, 'fmt ');
    view.setUint32(16, 16, true); view.setUint16(20, 1, true);
    view.setUint16(22, 1, true); view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true);
    view.setUint16(34, 16, true); writeStr(36, 'data');
    view.setUint32(40, numSamples * 2, true);
    // Три звуковых импульса (телефонный звонок)
    const pulseFreqs = [880, 1100, 1320, 880, 1100, 1320];
    const pulseInterval = sampleRate * 0.28;
    for (let i = 0; i < numSamples; i++) {
      let sample = 0;
      for (let p = 0; p < pulseFreqs.length; p++) {
        const pulseStart = Math.floor(p * pulseInterval);
        const pulseEnd = pulseStart + Math.floor(sampleRate * 0.2);
        if (i >= pulseStart && i < pulseEnd) {
          const t = (i - pulseStart) / sampleRate;
          const env = Math.min(1, (i - pulseStart) / 50) * Math.min(1, (pulseEnd - i) / 200);
          sample = Math.sin(2 * Math.PI * pulseFreqs[p] * t) * 0.4 * env;
        }
      }
      view.setInt16(44 + i * 2, Math.max(-32767, Math.min(32767, sample * 32767)), true);
    }
    const blob = new Blob([buffer], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.volume = 0.7;
    audio.play().catch((_err) => { /* autoplay blocked */ });
    audio.onended = () => URL.revokeObjectURL(url);
  } catch (_err) { /* fallback unavailable */ }
};

export const playNotificationSound = async () => {
  try {
    tryCreateContext();
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

// Звук входящего приглашения — звонок телефона (3 пары нот)
export const playInviteSound = async () => {
  try {
    tryCreateContext();

    // Если контекст есть и не заблокирован — WebAudio
    if (audioContext && audioContext.state !== 'suspended') {
      const t = audioContext.currentTime;
      const pulses = [
        { freq: 880,  time: 0 },
        { freq: 1100, time: 0.15 },
        { freq: 880,  time: 0.45 },
        { freq: 1100, time: 0.60 },
        { freq: 880,  time: 0.90 },
        { freq: 1100, time: 1.05 },
      ];
      pulses.forEach(({ freq, time }) => {
        playNote(audioContext!, freq, t + time, 0.18, 0.35);
      });
      return;
    }

    // Если AudioContext заблокирован браузером — пробуем resume
    if (audioContext && audioContext.state === 'suspended') {
      await audioContext.resume();
      if (audioContext.state === 'running') {
        const t = audioContext.currentTime;
        [880, 1100, 880, 1100, 880, 1100].forEach((freq, i) => {
          playNote(audioContext!, freq, t + i * 0.25, 0.18, 0.35);
        });
        return;
      }
    }

    // Fallback: генерируем WAV в памяти и играем через HTML5 Audio
    playFallbackBeep();
  } catch (_e) {
    playFallbackBeep();
  }
};