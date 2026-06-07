import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';

const FREQUENCIES = [
  { hz: 15000, label: '15 000 Гц', desc: 'Мягкое отпугивание' },
  { hz: 16000, label: '16 000 Гц', desc: 'Стандартный режим' },
  { hz: 17500, label: '17 500 Гц', desc: 'Усиленный режим' },
  { hz: 19000, label: '19 000 Гц', desc: 'Максимум' },
];

export default function MosquitoRepellent() {
  const navigate = useNavigate();
  const [isActive, setIsActive] = useState(false);
  const [selectedFreq, setSelectedFreq] = useState(FREQUENCIES[1]);
  const [volume, setVolume] = useState(0.5);
  const [pulseAnim, setPulseAnim] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  const stop = useCallback(() => {
    oscillatorRef.current?.stop();
    oscillatorRef.current?.disconnect();
    oscillatorRef.current = null;
    gainRef.current?.disconnect();
    gainRef.current = null;
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    setIsActive(false);
    setPulseAnim(false);
  }, []);

  const start = useCallback(() => {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(selectedFreq.hz, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();

    audioCtxRef.current = ctx;
    oscillatorRef.current = osc;
    gainRef.current = gain;

    setIsActive(true);
    setPulseAnim(true);
  }, [selectedFreq.hz, volume]);

  const toggle = () => {
    if (isActive) {
      stop();
    } else {
      start();
    }
  };

  useEffect(() => {
    if (isActive && oscillatorRef.current) {
      oscillatorRef.current.frequency.setValueAtTime(
        selectedFreq.hz,
        audioCtxRef.current!.currentTime
      );
    }
  }, [selectedFreq, isActive]);

  useEffect(() => {
    if (isActive && gainRef.current) {
      gainRef.current.gain.setValueAtTime(volume, audioCtxRef.current!.currentTime);
    }
  }, [volume, isActive]);

  useEffect(() => {
    return () => { stop(); };
  }, [stop]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-4 py-6">

        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <Icon name="ArrowLeft" size={22} />
          </button>
          <div>
            <h1 className="text-xl font-bold">Отпугиватель комаров</h1>
            <p className="text-xs text-muted-foreground">Ультразвуковой генератор</p>
          </div>
        </div>

        {/* Главная кнопка */}
        <div className="flex flex-col items-center mb-10">
          <div className="relative flex items-center justify-center mb-6">
            {pulseAnim && (
              <>
                <span className="absolute inline-flex h-48 w-48 rounded-full bg-green-400 opacity-20 animate-ping" />
                <span className="absolute inline-flex h-36 w-36 rounded-full bg-green-400 opacity-30 animate-ping [animation-delay:0.3s]" />
              </>
            )}
            <button
              onClick={toggle}
              className={`relative z-10 w-32 h-32 rounded-full text-white font-bold text-lg shadow-xl transition-all duration-300 flex flex-col items-center justify-center gap-1
                ${isActive
                  ? 'bg-green-500 hover:bg-green-600 scale-105'
                  : 'bg-muted-foreground/30 hover:bg-muted-foreground/40'
                }`}
            >
              <Icon name={isActive ? 'Volume2' : 'VolumeX'} size={36} />
              <span className="text-sm">{isActive ? 'Включён' : 'Выключен'}</span>
            </button>
          </div>

          <p className={`text-sm font-medium transition-colors ${isActive ? 'text-green-600' : 'text-muted-foreground'}`}>
            {isActive ? `Работает на ${selectedFreq.label}` : 'Нажми чтобы включить'}
          </p>
        </div>

        {/* Выбор частоты */}
        <div className="bg-card border rounded-xl p-4 mb-4">
          <p className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Icon name="Waves" size={16} className="text-primary" />
            Частота сигнала
          </p>
          <div className="grid grid-cols-2 gap-2">
            {FREQUENCIES.map((f) => (
              <button
                key={f.hz}
                onClick={() => setSelectedFreq(f)}
                className={`rounded-lg border-2 p-3 text-left transition-all
                  ${selectedFreq.hz === f.hz
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/40'
                  }`}
              >
                <p className="text-sm font-bold">{f.label}</p>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Громкость */}
        <div className="bg-card border rounded-xl p-4 mb-6">
          <p className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Icon name="Volume1" size={16} className="text-primary" />
            Громкость — {Math.round(volume * 100)}%
          </p>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Тише</span>
            <span>Громче</span>
          </div>
        </div>

        {/* Дисклеймер */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 space-y-1 leading-relaxed">
          <p className="font-semibold flex items-center gap-1">
            <Icon name="Info" size={13} />
            Важно знать
          </p>
          <p>Эффективность ультразвуковых отпугивателей научно не доказана. Функция предоставляется как эксперимент.</p>
          <p>Звук на частотах 15–19 кГц может быть слышен молодым людям и животным.</p>
        </div>

      </div>
    </div>
  );
}
