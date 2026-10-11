import { tone, noise } from './durakSounds';

export const pokerSounds = {
  deal: () => {
    for (let i = 0; i < 4; i++) noise(i * 0.1, 0.07, 0.1, 3000);
  },
  community: () => {
    noise(0, 0.06, 0.14, 2000);
    tone(220, 0, 0.08, 'triangle', 0.1, 120);
  },
  chips: () => {
    [0, 0.05, 0.1].forEach((t, i) => tone(2400 - i * 300, t, 0.06, 'triangle', 0.06));
    noise(0, 0.15, 0.04, 5000);
  },
  fold: () => {
    noise(0, 0.12, 0.1, 1500);
    tone(220, 0, 0.18, 'sine', 0.06, 130);
  },
  myTurn: () => {
    tone(660, 0, 0.12, 'sine', 0.14);
    tone(880, 0.12, 0.18, 'sine', 0.14);
  },
  win: () => {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.14, 0.25, 'triangle', 0.15));
    [0.5, 0.58, 0.66].forEach((t) => tone(2600, t, 0.06, 'triangle', 0.05));
  },
  lose: () => {
    [392, 330, 262].forEach((f, i) => tone(f, i * 0.2, 0.3, 'sawtooth', 0.07));
  },
};
