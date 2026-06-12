import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';

type BrainMode = 'all' | 'focus' | 'stress' | 'energy';

interface ModeConfig {
  id: BrainMode;
  label: string;
  desc: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  leftHz: number;
  rightHz: number;
  beatHz: number;
  waveType: OscillatorType;
  noiseType: 'pink' | 'brown' | 'white' | null;
  effect: string;
  duration: string;
}

const MODES: ModeConfig[] = [
  {
    id: 'all',
    label: 'Общий режим',
    desc: 'Баланс всех волн',
    icon: 'Brain',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/40',
    leftHz: 200,
    rightHz: 210,
    beatHz: 10,
    waveType: 'sine',
    noiseType: 'pink',
    effect: 'Улучшает память, снимает усталость, повышает общий тонус',
    duration: '15–20 мин',
  },
  {
    id: 'focus',
    label: 'Фокус и память',
    desc: 'Бета-волны 14–30 Гц',
    icon: 'Target',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/40',
    leftHz: 200,
    rightHz: 220,
    beatHz: 20,
    waveType: 'sine',
    noiseType: 'white',
    effect: 'Концентрация, работоспособность, улучшение памяти',
    duration: '20–30 мин',
  },
  {
    id: 'stress',
    label: 'Снятие стресса',
    desc: 'Альфа-волны 8–14 Гц',
    icon: 'Wind',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/40',
    leftHz: 200,
    rightHz: 210,
    beatHz: 10,
    waveType: 'sine',
    noiseType: 'brown',
    effect: 'Снятие тревоги, усталости, расслабление',
    duration: '10–20 мин',
  },
  {
    id: 'energy',
    label: 'Энергия и бодрость',
    desc: 'Гамма-волны 30–100 Гц',
    icon: 'Zap',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/40',
    leftHz: 200,
    rightHz: 240,
    beatHz: 40,
    waveType: 'sine',
    noiseType: null,
    effect: 'Бодрость, подъём настроения, борьба с ленью',
    duration: '10–15 мин',
  },
];

function createPinkNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
    b6 = white * 0.115926;
  }
  return buffer;
}

function createBrownNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let lastOut = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    data[i] = (lastOut + 0.02 * white) / 1.02;
    lastOut = data[i];
    data[i] *= 3.5;
  }
  return buffer;
}

function createWhiteNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.15;
  }
  return buffer;
}

export default function BrainBooster() {
  const navigate = useNavigate();
  const [activeMode, setActiveMode] = useState<BrainMode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.6);
  const [pulseAnim, setPulseAnim] = useState(false);
  const [timer, setTimer] = useState(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const leftOscRef = useRef<OscillatorNode | null>(null);
  const rightOscRef = useRef<OscillatorNode | null>(null);
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    document.title = 'Нейро-звук для мозга — ЕРТТП';
    return () => { document.title = 'ЕРТТП'; };
  }, []);

  const stop = useCallback(() => {
    leftOscRef.current?.stop();
    leftOscRef.current?.disconnect();
    leftOscRef.current = null;
    rightOscRef.current?.stop();
    rightOscRef.current?.disconnect();
    rightOscRef.current = null;
    noiseSourceRef.current?.stop();
    noiseSourceRef.current?.disconnect();
    noiseSourceRef.current = null;
    masterGainRef.current?.disconnect();
    masterGainRef.current = null;
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setIsPlaying(false);
    setPulseAnim(false);
  }, []);

  const play = useCallback((mode: ModeConfig, vol: number) => {
    stop();

    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    const merger = ctx.createChannelMerger(2);
    const masterGain = ctx.createGain();
    masterGain.gain.value = vol;
    masterGainRef.current = masterGain;
    merger.connect(masterGain);
    masterGain.connect(ctx.destination);

    // Бинауральный бит: левый канал
    const leftOsc = ctx.createOscillator();
    const leftGain = ctx.createGain();
    leftOsc.type = mode.waveType;
    leftOsc.frequency.value = mode.leftHz;
    leftGain.gain.value = 0.4;
    leftOsc.connect(leftGain);
    leftGain.connect(merger, 0, 0);
    leftOsc.start();
    leftOscRef.current = leftOsc;

    // Бинауральный бит: правый канал (разница = beatHz)
    const rightOsc = ctx.createOscillator();
    const rightGain = ctx.createGain();
    rightOsc.type = mode.waveType;
    rightOsc.frequency.value = mode.rightHz;
    rightGain.gain.value = 0.4;
    rightOsc.connect(rightGain);
    rightGain.connect(merger, 0, 1);
    rightOsc.start();
    rightOscRef.current = rightOsc;

    // Фоновый шум
    if (mode.noiseType) {
      const buffer =
        mode.noiseType === 'pink'  ? createPinkNoiseBuffer(ctx)  :
        mode.noiseType === 'brown' ? createBrownNoiseBuffer(ctx) :
                                     createWhiteNoiseBuffer(ctx);
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;
      noiseSource.loop = true;
      const noiseGain = ctx.createGain();
      noiseGain.gain.value = 0.12;
      noiseSource.connect(noiseGain);
      noiseGain.connect(masterGain);
      noiseSource.start();
      noiseSourceRef.current = noiseSource;
    }

    setIsPlaying(true);
    setPulseAnim(true);
    setTimer(0);
    timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
  }, [stop]);

  const handleToggle = useCallback((modeId: BrainMode) => {
    const config = MODES.find(m => m.id === modeId)!;
    if (isPlaying && activeMode === modeId) {
      stop();
      setActiveMode(null);
    } else {
      setActiveMode(modeId);
      play(config, volume);
    }
  }, [isPlaying, activeMode, stop, play, volume]);

  useEffect(() => {
    if (isPlaying && activeMode) {
      const config = MODES.find(m => m.id === activeMode)!;
      if (masterGainRef.current) {
        masterGainRef.current.gain.value = volume;
      } else {
        play(config, volume);
      }
    }
  }, [volume]);

  useEffect(() => () => stop(), [stop]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const currentConfig = activeMode ? MODES.find(m => m.id === activeMode) : null;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-muted transition-colors">
          <Icon name="ArrowLeft" size={20} />
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-base">Нейро-звук для мозга</h1>
          <p className="text-xs text-muted-foreground">Бинауральные ритмы и шумотерапия</p>
        </div>
        {isPlaying && (
          <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            {formatTime(timer)}
          </div>
        )}
      </div>

      <div className="px-4 pt-5 space-y-5 max-w-lg mx-auto">

        {/* Активный режим — большая кнопка */}
        {currentConfig ? (
          <div className={`rounded-2xl border-2 p-6 text-center ${currentConfig.bgColor} ${currentConfig.borderColor} transition-all`}>
            <div className="relative inline-flex items-center justify-center mb-4">
              {pulseAnim && (
                <>
                  <span className={`absolute inline-flex h-24 w-24 rounded-full opacity-20 animate-ping ${currentConfig.bgColor}`} />
                  <span className={`absolute inline-flex h-20 w-20 rounded-full opacity-30 animate-ping [animation-delay:150ms] ${currentConfig.bgColor}`} />
                </>
              )}
              <button
                onClick={() => handleToggle(currentConfig.id)}
                className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center text-white shadow-lg transition-all active:scale-95
                  ${isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-primary/90'}`}
              >
                <Icon name={isPlaying ? 'Square' : 'Play'} size={32} />
              </button>
            </div>
            <p className={`font-bold text-lg ${currentConfig.color}`}>{currentConfig.label}</p>
            <p className="text-sm text-muted-foreground mt-1">{currentConfig.effect}</p>
            <div className="flex items-center justify-center gap-2 mt-2 text-xs text-muted-foreground">
              <Icon name="Clock" size={13} />
              Рекомендуемое время: {currentConfig.duration}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-6 text-center text-muted-foreground">
            <Icon name="Brain" size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Выберите режим ниже и нажмите — начнётся звуковая сессия</p>
          </div>
        )}

        {/* Громкость */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Icon name="Volume2" size={16} className="text-muted-foreground" />
              <span className="text-sm font-medium">Громкость</span>
            </div>
            <span className="text-sm text-muted-foreground">{Math.round(volume * 100)}%</span>
          </div>
          <div className="relative">
            <input
              type="range" min={10} max={100}
              value={Math.round(volume * 100)}
              onChange={e => setVolume(Number(e.target.value) / 100)}
              className="w-full h-2 rounded-full appearance-none cursor-pointer bg-muted"
              style={{ background: `linear-gradient(to right, hsl(var(--primary)) ${volume * 100}%, hsl(var(--muted)) ${volume * 100}%)` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">Используйте наушники для максимального эффекта бинауральных ритмов</p>
        </div>

        {/* Кнопки режимов */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Режимы</h2>
          <div className="grid grid-cols-1 gap-3">
            {MODES.map(mode => {
              const isActive = activeMode === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => handleToggle(mode.id)}
                  className={`w-full text-left rounded-2xl border-2 p-4 transition-all active:scale-[0.98]
                    ${isActive ? `${mode.bgColor} ${mode.borderColor}` : 'bg-card border-border hover:border-primary/30'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${mode.bgColor}`}>
                      <Icon name={mode.icon} size={22} className={mode.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{mode.label}</p>
                        {isActive && isPlaying && (
                          <span className="flex items-center gap-1 text-xs text-primary font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            Играет
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{mode.desc}</p>
                      <p className="text-xs text-muted-foreground/70 mt-0.5 line-clamp-1">{mode.effect}</p>
                    </div>
                    <div className="flex-shrink-0">
                      {isActive && isPlaying
                        ? <div className={`w-8 h-8 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center`}>
                            <Icon name="Square" size={14} className="text-red-400" />
                          </div>
                        : <div className={`w-8 h-8 rounded-full ${mode.bgColor} border ${mode.borderColor} flex items-center justify-center`}>
                            <Icon name="Play" size={14} className={mode.color} />
                          </div>
                      }
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Как работает */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="Info" size={16} className="text-blue-400" />
            <span className="text-sm font-semibold text-blue-400">Как это работает</span>
          </div>
          <ul className="space-y-2">
            {[
              'Бинауральные ритмы — разные частоты в левом и правом ухе создают биение, которое синхронизирует волны мозга',
              'Фоновый шум (розовый, коричневый) маскирует раздражители и помогает войти в нужное состояние',
              'Гамма-волны 40 Гц связаны с ясностью мышления и подъёмом энергии',
              'Требуются стерео-наушники — без них бинауральный эффект не работает',
            ].map((text, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0 text-[10px] font-bold mt-0.5">{i + 1}</span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        {/* Советы */}
        <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="Lightbulb" size={16} className="text-green-400" />
            <span className="text-sm font-semibold text-green-400">Советы для лучшего эффекта</span>
          </div>
          <ul className="space-y-1.5">
            {[
              'Используйте стерео наушники (обязательно)',
              'Сядьте удобно или лягте, закройте глаза',
              'Первый эффект ощутите через 5–10 минут',
              'Не используйте за рулём',
              'Слушайте регулярно — эффект накапливается',
            ].map((tip, i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                <Icon name="CheckCircle" size={13} className="text-green-400 flex-shrink-0" />
                {tip}
              </li>
            ))}
          </ul>
        </div>

        {/* Дисклеймер */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="AlertTriangle" size={15} className="text-amber-400" />
            <span className="text-sm font-semibold text-amber-400">Важно</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Функция носит информационно-развлекательный характер. Не является медицинским средством.
            Не применять при эпилепсии, беременности и повышенной чувствительности к звукам.
          </p>
        </div>

      </div>
    </div>
  );
}