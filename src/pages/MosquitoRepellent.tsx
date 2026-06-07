import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';

type Mode = 'mosquito' | 'dog';
type SignalMode = 'modulated' | 'pulse';

const MOSQUITO_FREQUENCIES = [
  { hz: 15000, label: '15 000 Гц', desc: 'Мягкое отпугивание' },
  { hz: 16000, label: '16 000 Гц', desc: 'Стандартный режим' },
  { hz: 17500, label: '17 500 Гц', desc: 'Усиленный режим' },
  { hz: 19000, label: '19 000 Гц', desc: 'Максимум' },
];

const SIGNAL_MODES: { id: SignalMode; label: string; desc: string; icon: string }[] = [
  { id: 'modulated', label: 'Версия 1', desc: 'Стандартная', icon: 'Shield' },
  { id: 'pulse',     label: 'Версия 2', desc: 'Улучшенная',  icon: 'ShieldCheck' },
];

const DOG_FREQ_HZ = 20000;

export default function MosquitoRepellent() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('mosquito');
  const [signalMode, setSignalMode] = useState<SignalMode>('pulse');
  const [isActive, setIsActive] = useState(false);
  const [selectedFreq, setSelectedFreq] = useState(MOSQUITO_FREQUENCIES[1]);
  const [volume, setVolume] = useState(0.5);
  const [pulseAnim, setPulseAnim] = useState(false);

  const audioCtxRef   = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainRef       = useRef<GainNode | null>(null);
  const lfoRef        = useRef<OscillatorNode | null>(null);
  const lfoGainRef    = useRef<GainNode | null>(null);
  const pulseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (pulseTimerRef.current) { clearInterval(pulseTimerRef.current); pulseTimerRef.current = null; }
    lfoRef.current?.stop();
    lfoRef.current?.disconnect();
    lfoRef.current = null;
    lfoGainRef.current?.disconnect();
    lfoGainRef.current = null;
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

  const activeHz     = mode === 'dog' ? DOG_FREQ_HZ : selectedFreq.hz;
  const activeVolume = mode === 'dog' ? 1 : volume;
  const activeSig    = mode === 'dog' ? 'pulse' : signalMode;

  const start = useCallback(() => {
    const ctx  = new AudioContext();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(activeHz, ctx.currentTime);
    gain.gain.setValueAtTime(activeVolume, ctx.currentTime);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();

    audioCtxRef.current   = ctx;
    oscillatorRef.current = osc;
    gainRef.current       = gain;

    if (activeSig === 'modulated') {
      // LFO медленно качает частоту ±500 Гц с периодом ~2 сек
      const lfo     = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(0.5, ctx.currentTime);
      lfoGain.gain.setValueAtTime(500, ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start();
      lfoRef.current     = lfo;
      lfoGainRef.current = lfoGain;
    }

    if (activeSig === 'pulse') {
      // Импульсный — вкл/выкл gain каждые 300 мс
      let on = true;
      pulseTimerRef.current = setInterval(() => {
        if (!gainRef.current || !audioCtxRef.current) return;
        on = !on;
        gainRef.current.gain.setValueAtTime(on ? activeVolume : 0, audioCtxRef.current.currentTime);
      }, 300);
    }

    setIsActive(true);
    setPulseAnim(true);
  }, [activeHz, activeVolume, activeSig]);

  const toggle = () => { if (isActive) stop(); else start(); };

  const switchMode = (m: Mode) => { if (isActive) stop(); setMode(m); };
  const switchSignal = (s: SignalMode) => { if (isActive) stop(); setSignalMode(s); };

  useEffect(() => { return () => { stop(); }; }, [stop]);

  const isDog = mode === 'dog';

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-4 py-6">

        {/* Шапка */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-lg transition-colors">
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
            <span className="text-base">🦟</span>От комаров
          </button>
          <button
            onClick={() => switchMode('dog')}
            className={`rounded-lg py-2.5 px-3 text-sm font-semibold transition-all flex items-center justify-center gap-2
              ${isDog ? 'bg-white shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <span className="text-base">🐕</span>От собак
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
                  ? isDog ? 'bg-orange-500 hover:bg-orange-600 scale-105' : 'bg-green-500 hover:bg-green-600 scale-105'
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
                ? `Импульсный режим · ${DOG_FREQ_HZ.toLocaleString('ru-RU')} Гц`
                : `${SIGNAL_MODES.find(s => s.id === signalMode)?.label} · ${selectedFreq.label}`
              : 'Нажми чтобы включить'}
          </p>
        </div>

        {/* Режим собак */}
        {isDog && (
          <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 mb-4">
            <p className="text-sm font-semibold text-orange-800 mb-2 flex items-center gap-2">
              <Icon name="ShieldAlert" size={16} />
              Режим защиты от собак
            </p>
            <ul className="text-xs text-orange-700 space-y-1.5 leading-relaxed">
              <li className="flex items-start gap-1.5"><Icon name="Check" size={12} className="mt-0.5 shrink-0" /> Частота 20 000 Гц — максимум для динамиков телефона</li>
              <li className="flex items-start gap-1.5"><Icon name="Check" size={12} className="mt-0.5 shrink-0" /> Импульсный режим — сигнал пульсирует каждые 0.3 сек</li>
              <li className="flex items-start gap-1.5"><Icon name="Check" size={12} className="mt-0.5 shrink-0" /> Громкость выставлена на максимум автоматически</li>
              <li className="flex items-start gap-1.5"><Icon name="Check" size={12} className="mt-0.5 shrink-0" /> Держи телефон динамиком в сторону животного</li>
            </ul>
          </div>
        )}

        {/* Режим комаров */}
        {!isDog && (
          <>
            {/* Тип сигнала */}
            <div className="bg-card border rounded-xl p-4 mb-4">
              <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Icon name="Activity" size={16} className="text-primary" />
                Тип сигнала
              </p>
              <div className="grid grid-cols-3 gap-2">
                {SIGNAL_MODES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => switchSignal(s.id)}
                    className={`rounded-lg border-2 p-2.5 text-center transition-all
                      ${signalMode === s.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'}`}
                  >
                    <Icon name={s.icon as Parameters<typeof Icon>[0]['name']} size={16} className={`mx-auto mb-1 ${signalMode === s.id ? 'text-primary' : 'text-muted-foreground'}`} />
                    <p className="text-xs font-bold leading-tight">{s.label}</p>
                    <p className="text-[10px] text-muted-foreground">{s.desc}</p>
                  </button>
                ))}
              </div>
              {signalMode === 'pulse' && (
                <p className="text-[11px] text-primary/80 mt-2 leading-relaxed bg-primary/5 rounded-lg px-3 py-2">
                  Версия 2 — наиболее эффективный режим защиты
                </p>
              )}
            </div>

            {/* Частота */}
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
                      ${selectedFreq.hz === f.hz ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'}`}
                  >
                    <p className="text-sm font-bold">{f.label}</p>
                    <p className="text-xs text-muted-foreground">{f.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Громкость */}
            <div className="bg-card border-2 border-primary/30 rounded-xl p-5 mb-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <Icon name="Volume2" size={18} className="text-primary" />
                  Громкость
                </p>
                <span className="text-2xl font-bold text-primary">{Math.round(volume * 100)}%</span>
              </div>
              <div className="relative h-12 flex items-center">
                <div className="absolute w-full h-4 bg-muted rounded-full" />
                <div
                  className="absolute left-0 h-4 bg-primary rounded-full transition-all duration-75 pointer-events-none"
                  style={{ width: `${((volume - 0.1) / 0.9) * 100}%` }}
                />
                <input
                  type="range" min={0.1} max={1} step={0.05} value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="absolute w-full cursor-pointer opacity-0"
                  style={{ height: '48px' }}
                />
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

        {/* Бейдж тестовой версии */}
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-3">
          <Icon name="FlaskConical" size={15} className="text-blue-500 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-blue-700">Тестовая версия</p>
            <p className="text-xs text-blue-600 leading-relaxed">Функция в разработке. Если результат недостаточный — мы работаем над улучшением эффективности.</p>
          </div>
        </div>

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