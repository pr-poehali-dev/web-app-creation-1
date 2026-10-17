let ctx: AudioContext | null = null;
const STORAGE_KEY = 'durak_sound_off';

export const isSoundOn = () => localStorage.getItem(STORAGE_KEY) !== '1';
export const setSoundOn = (on: boolean) => localStorage.setItem(STORAGE_KEY, on ? '0' : '1');

const getCtx = (): AudioContext | null => {
  if (!isSoundOn()) return null;
  const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
};

export const tone = (freq: number, start: number, dur: number, type: OscillatorType = 'sine', vol = 0.15, slideTo?: number) => {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  const t0 = c.currentTime + start;
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
};

export const noise = (start: number, dur: number, vol = 0.12, cutoff = 2500) => {
  const c = getCtx();
  if (!c) return;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = cutoff;
  const gain = c.createGain();
  gain.gain.value = vol;
  src.connect(filter).connect(gain).connect(c.destination);
  src.start(c.currentTime + start);
};

export const sounds = {
  draw: (count = 1) => {
    for (let i = 0; i < count; i++) noise(i * 0.22, 0.07, 0.12, 3200);
  },
  deal: () => {
    for (let i = 0; i < 6; i++) noise(i * 0.09, 0.07, 0.1, 3000);
  },
  place: () => {
    noise(0, 0.06, 0.16, 1800);
    tone(180, 0, 0.08, 'triangle', 0.12, 90);
  },
  beat: () => {
    noise(0, 0.05, 0.14, 2200);
    tone(260, 0.02, 0.1, 'triangle', 0.14, 140);
  },
  transfer: () => {
    tone(330, 0, 0.1, 'sine', 0.12);
    tone(494, 0.09, 0.14, 'sine', 0.12);
  },
  take: () => {
    for (let i = 0; i < 3; i++) noise(i * 0.07, 0.08, 0.1, 2500);
    tone(200, 0, 0.25, 'sawtooth', 0.05, 120);
  },
  bito: () => {
    tone(392, 0, 0.12, 'sine', 0.13);
    tone(523, 0.1, 0.2, 'sine', 0.13);
  },
  myTurn: () => {
    tone(660, 0, 0.12, 'sine', 0.14);
    tone(880, 0.12, 0.18, 'sine', 0.14);
  },
  tick: () => tone(1000, 0, 0.05, 'square', 0.04),
  win: () => {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.14, 0.25, 'triangle', 0.15));
  },
  lose: () => {
    [392, 330, 262, 196].forEach((f, i) => tone(f, i * 0.2, 0.3, 'sawtooth', 0.08));
  },
};
