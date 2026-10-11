import { tone, noise } from './durakSounds';

export const boardSounds = {
  move: () => {
    noise(0, 0.04, 0.12, 1500);
    tone(320, 0, 0.07, 'triangle', 0.12, 200);
  },
  capture: () => {
    noise(0, 0.08, 0.2, 1200);
    tone(180, 0, 0.12, 'triangle', 0.16, 90);
    tone(420, 0.04, 0.08, 'square', 0.04, 260);
  },
  check: () => {
    tone(740, 0, 0.12, 'square', 0.06);
    tone(740, 0.16, 0.12, 'square', 0.06);
  },
  myTurn: () => {
    tone(660, 0, 0.12, 'sine', 0.14);
    tone(880, 0.12, 0.18, 'sine', 0.14);
  },
  win: () => {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.14, 0.25, 'triangle', 0.15));
  },
  lose: () => {
    [392, 330, 262, 196].forEach((f, i) => tone(f, i * 0.2, 0.3, 'sawtooth', 0.08));
  },
  draw: () => {
    tone(440, 0, 0.2, 'sine', 0.12);
    tone(440, 0.25, 0.25, 'sine', 0.12);
  },
};
