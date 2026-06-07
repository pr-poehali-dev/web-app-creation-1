import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';

type Mode = 'mosquito' | 'dog';

const MOSQUITO_FREQUENCIES = [
  { hz: 15000, label: '15 000 Гц', desc: 'Мягкое отпугивание' },
  { hz: 16000, label: '16 000 Гц', desc: 'Стандартный режим' },
  { hz: 17500, label: '17 500 Гц', desc: 'Усиленный режим' },
  { hz: 19000, label: '19 000 Гц', desc: 'Максимум' },
];

const DOG_FREQ_HZ = 20000;

export default function MosquitoRepellent() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('mosquito');
  const [isActive, setIsActive] = useState(false);
  const [selectedFreq, setSelectedFreq] = useState(MOSQUITO_FREQUENCIES[1]);
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

  const activeHz = mode === 'dog' ? DOG_FREQ_HZ : selectedFreq.hz;
  const activeVolume = mode === 'dog' ? 1 : volume;

  const start = useCallback(() => {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(activeHz, ctx.currentTime);
    gain.gain.setValueAtTime(activeVolume, ctx.currentTime);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();

    audioCtxRef.current = ctx;
    oscillatorRef.current = osc;
    gainRef.current = gain;

    setIsActive(true);
    setPulseAnim(true);
  }, [activeHz, activeVolume]);

  const toggle = () => {
    if (isActive) stop();
    else start();
  };

  const switchMode = (m: Mode) => {
    if (isActive) stop();
    setMode(m);
  };

  useEffect(() => {
    if (isActive && oscillatorRef.current && audioCtxRef.current) {
      oscillatorRef.current.frequency.setValueAtTime(activeHz, audioCtxRef.current.currentTime);
    }
  }, [activeHz, isActive]);

  useEffect(() => {
    if (isActive && gainRef.current && audioCtxRef.current) {
      gainRef.current.gain.setValueAtTime(activeVolume, audioCtxRef.current.currentTime);
    }
  }, [activeVolume, isActive]);

  useEffect(() => {
    return () => { stop(); };
  }, [stop]);

  const isDog = mode === 'dog';

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-4 py-6">

        {/* Шапка */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <Icon name="ArrowLeft" size={22} />
          </button>
          <div>
            <h1 className="text-xl font-bold">Ультразвуковой отпугиватель</h1>
            <p className="text-xs text-muted-foreground">Выбери режим защиты</p>
          </div>
        </div>

        {/* Переключатель режимов */}
        <div className="grid grid-cols-2 gap-2 mb-8 bg-muted p-1 rounded-xl">
          <button
            onClick={() => switchMode('mosquito')}
            className={`rounded-lg py-2.5 px-3 text-sm font-semibold transition-all flex items-center justify-center gap-2
              ${!isDog ? 'bg-white shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <span className="text-base">🦟</span>
            От комаров
          </button>
          <button
            onClick={() => switchMode('dog')}
            className={`rounded-lg py-2.5 px-3 text-sm font-semibold transition-all flex items-center justify-center gap-2
              ${isDog ? 'bg-white shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <span className="text-base">🐕</span>
            От собак
          </button>
        </div>

        {/* Главная кнопка */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative flex items-center justify-center mb-5">
            {pulseAnim && (
              <>
                <span className={`absolute inline-flex h-48 w-48 rounded-full opacity-20 animate-ping ${isDog ? 'bg-orange-400' : 'bg-green-400'}`} />
                <span className={`absolute inline-flex h-36 w-36 rounded-full opacity-30 animate-ping [animation-delay:0.3s] ${isDog ? 'bg-orange-400' : 'bg-green-400'}`} />
              </>
            )}
            <button
              onClick={toggle}
              className={`relative z-10 w-32 h-32 rounded-full text-white font-bold shadow-xl transition-all duration-300 flex flex-col items-center justify-center gap-1
                ${isActive
                  ? isDog
                    ? 'bg-orange-500 hover:bg-orange-600 scale-105'
                    : 'bg-green-500 hover:bg-green-600 scale-105'
                  : 'bg-muted-foreground/30 hover:bg-muted-foreground/40'
                }`}
            >
              <span className="text-3xl">{isDog ? '🐕' : '🦟'}</span>
              <span className="text-sm">{isActive ? 'Включён' : 'Выключен'}</span>
            </button>
          </div>

          <p className={`text-sm font-medium transition-colors ${isActive ? (isDog ? 'text-orange-600' : 'text-green-600') : 'text-muted-foreground'}`}>
            {isActive
              ? isDog
                ? `Работает на ${DOG_FREQ_HZ.toLocaleString('ru-RU')} Гц — максимум`
                : `Работает на ${selectedFreq.label}`
              : 'Нажми чтобы включить'}
          </p>
        </div>

        {/* Режим собак — описание */}
        {isDog && (
          <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 mb-4">
            <p className="text-sm font-semibold text-orange-800 mb-2 flex items-center gap-2">
              <Icon name="ShieldAlert" size={16} />
              Режим защиты от собак
            </p>
            <ul className="text-xs text-orange-700 space-y-1.5 leading-relaxed">
              <li className="flex items-start gap-1.5"><Icon name="Check" size={12} className="mt-0.5 shrink-0" /> Частота 18 500 Гц — оптимальная для слуха собак</li>
              <li className="flex items-start gap-1.5"><Icon name="Check" size={12} className="mt-0.5 shrink-0" /> Громкость выставлена на максимум автоматически</li>
              <li className="flex items-start gap-1.5"><Icon name="Check" size={12} className="mt-0.5 shrink-0" /> Держи телефон динамиком в сторону животного</li>
            </ul>
          </div>
        )}

        {/* Режим комаров — выбор частоты */}
        {!isDog && (
          <>
            <div className="bg-card border rounded-xl p-4 mb-4">
              <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Icon name="Waves" size={16} className="text-primary" />
                Частота сигнала
              </p>
              <div className="grid grid-cols-2 gap-2">
                {MOSQUITO_FREQUENCIES.map((f) => (
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

            <div className="bg-card border-2 border-primary/30 rounded-xl p-5 mb-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <Icon name="Volume2" size={18} className="text-primary" />
                  Громкость
                </p>
                <span className="text-2xl font-bold text-primary">{Math.round(volume * 100)}%</span>
              </div>

              {/* Полоса + ползунок совмещены */}
              <div className="relative h-12 flex items-center">
                {/* Фоновая полоса */}
                <div className="absolute w-full h-4 bg-muted rounded-full" />
                {/* Заполненная часть */}
                <div
                  className="absolute left-0 h-4 bg-primary rounded-full transition-all duration-75 pointer-events-none"
                  style={{ width: `${((volume - 0.1) / 0.9) * 100}%` }}
                />
                {/* Поверх — прозрачный input на всю высоту блока для удобного касания */}
                <input
                  type="range"
                  min={0.1}
                  max={1}
                  step={0.05}
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="absolute w-full cursor-pointer opacity-0"
                  style={{ height: '48px' }}
                />
                {/* Кружок-ползунок */}
                <div
                  className="absolute w-7 h-7 bg-white border-4 border-primary rounded-full shadow-md pointer-events-none transition-all duration-75"
                  style={{ left: `calc(${((volume - 0.1) / 0.9) * 100}% - 14px)` }}
                />
              </div>

              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span className="flex items-center gap-1"><Icon name="VolumeX" size={13} /> Тише</span>
                <span className="flex items-center gap-1">Громче <Icon name="Volume2" size={13} /></span>
              </div>
            </div>
          </>
        )}

        {/* Дисклеймер */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 space-y-1 leading-relaxed">
          <p className="font-semibold flex items-center gap-1">
            <Icon name="Info" size={13} />
            Важно знать
          </p>
          <p>Эффективность ультразвука научно не доказана. Не полагайся на эту функцию в реальной опасности.</p>
          <p>Высокие частоты могут быть слышны молодым людям и домашним животным.</p>
        </div>

      </div>
    </div>
  );
}