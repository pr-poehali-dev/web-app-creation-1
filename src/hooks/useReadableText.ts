import { useCallback, useEffect, useState } from 'react';

const KEY = 'readable-text-level';
const EVENT = 'readable-text-change';

const read = () => {
  const v = Number(localStorage.getItem(KEY));
  return v === 1 || v === 2 ? v : 0;
};

export function useReadableText() {
  const [level, setLevel] = useState<number>(read);

  useEffect(() => {
    const sync = () => setLevel(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const cycle = useCallback(() => {
    localStorage.setItem(KEY, String((read() + 1) % 3));
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { level, cycle };
}
