import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { isSoundOn, setSoundOn } from '../utils/durakSounds';
import { boardSounds } from '../utils/boardSounds';

export const YELLOW_BUTTON = 'bg-amber-400 hover:bg-amber-500 border-amber-500 text-slate-950 font-semibold hover:text-slate-950 disabled:opacity-70';

export function SoundToggle() {
  const [on, setOn] = useState(isSoundOn());
  const toggle = () => {
    const next = !on;
    setSoundOn(next);
    setOn(next);
    if (next) boardSounds.move();
  };
  return (
    <Button size="sm" variant="outline" onClick={toggle} aria-label={on ? 'Выключить звук' : 'Включить звук'} className={YELLOW_BUTTON}>
      <Icon name={on ? 'Volume2' : 'VolumeX'} size={14} />
    </Button>
  );
}

export default function GameHeaderTools({ rules }: { rules: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      {rules}
      <SoundToggle />
    </div>
  );
}
