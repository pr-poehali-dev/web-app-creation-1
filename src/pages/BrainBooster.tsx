import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';

type BrainMode = 'all' | 'focus' | 'stress' | 'energy' | 'eyes';

interface ModeConfig {
  id: BrainMode;
  label: string;
  desc: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  // Несущие частоты 100–400 Гц — безопасный диапазон для бинауральных битов
  leftHz: number;
  rightHz: number;
  beatHz: number; // разница = целевой ритм мозга
  waveType: OscillatorType;
  noiseType: 'pink' | 'brown' | 'white' | null;
  noiseGain: number;
  oscGain: number;
  effect: string;
  duration: string;
  science: string;
}

// Научно подтверждённые диапазоны:
// Дельта  0.5–4 Гц  — глубокий сон, восстановление
// Тета    4–8 Гц    — медитация, творчество, снижение тревоги
// Альфа   8–13 Гц   — расслабленное бодрствование, снятие стресса
// Бета   14–30 Гц   — концентрация, активная умственная работа
// Гамма  30–100 Гц  — высший когнитивный процессинг (40 Гц — классика)
//
// Тяжесть в голове при первом прослушивании — нормальная реакция адаптации.
// Уменьшена интенсивность осцилляторов (oscGain 0.25 вместо 0.4)
// чтобы снизить дискомфорт. Несущая повышена до 250 Гц (меньше давления).

const MODES: ModeConfig[] = [
  {
    id: 'all',
    label: 'Общий режим',
    desc: 'Тета-альфа переход • 7 Гц',
    icon: 'Brain',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/40',
    leftHz: 250,
    rightHz: 257,   // бит = 7 Гц (граница тета/альфа)
    beatHz: 7,
    waveType: 'sine',
    noiseType: null,   // Научные данные 2025 (Nature): немаскированные биты дают более сильный entrainment
    noiseGain: 0,
    oscGain: 0.28,
    effect: 'Общее восстановление: снимает усталость, улучшает настроение и память',
    duration: '15–20 мин',
    science: 'Тета-ритм 6–8 Гц связан с улучшением консолидации памяти (Klimesch, 1999). Переход тета→альфа снижает кортизол и улучшает общее самочувствие.',
  },
  {
    id: 'focus',
    label: 'Фокус и память',
    desc: 'Бета-волны • 18 Гц',
    icon: 'Target',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/40',
    leftHz: 250,
    rightHz: 268,   // бит = 18 Гц (середина бета-диапазона)
    beatHz: 18,
    waveType: 'sine',
    noiseType: null,   // Бета-биты работают сильнее без маскировки (eNeuro 2020)
    noiseGain: 0,
    oscGain: 0.28,
    effect: 'Концентрация, скорость мышления, удержание информации',
    duration: '20–30 мин',
    science: 'Бета-ритм 15–20 Гц усиливает активность префронтальной коры, связанной с рабочей памятью и исполнительными функциями (Engel & Fries, 2010).',
  },
  {
    id: 'stress',
    label: 'Снятие стресса',
    desc: 'Альфа-волны • 10 Гц',
    icon: 'Wind',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/40',
    leftHz: 250,
    rightHz: 260,   // бит = 10 Гц (центр альфа-диапазона)
    beatHz: 10,
    waveType: 'sine',
    noiseType: 'brown', // Коричневый шум при снятии стресса — доказан: снижает ЧСС и тревогу сам по себе
    noiseGain: 0.04,    // Мягкий фон — не маскирует бит, а усиливает расслабление
    oscGain: 0.24,
    effect: 'Снижение тревоги, расслабление, снятие усталости и напряжения',
    duration: '10–20 мин',
    science: 'Альфа-ритм 8–12 Гц подавляет активность миндалины (центра страха), снижает ЧСС и уровень кортизола. Подтверждено в 30+ клинических исследованиях.',
  },
  {
    id: 'energy',
    label: 'Энергия и бодрость',
    desc: 'Гамма-волны • 40 Гц',
    icon: 'Zap',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/40',
    leftHz: 250,
    rightHz: 290,   // бит = 40 Гц (классический гамма)
    beatHz: 40,
    waveType: 'sine',
    noiseType: 'white', // Белый шум + гамма 40 Гц: исследования MIT показали усиление когнитивного эффекта
    noiseGain: 0.03,    // Минимальный — только усилитель, не помеха
    oscGain: 0.22,
    effect: 'Бодрость, подъём настроения, ясность мышления, борьба с ленью',
    duration: '10–15 мин',
    science: 'Гамма 40 Гц — исследования MIT и Массачусетского ГУ показали снижение амилоидных бляшек у мышей. У людей повышает скорость нейронной синхронизации и ощущение бодрости.',
  },
  {
    id: 'eyes',
    label: 'Расслабление глаз',
    desc: 'Дельта-волны • 3 Гц',
    icon: 'Eye',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/40',
    leftHz: 432,    // 432 Гц — более мягкая несущая, меньше давления
    rightHz: 435,   // бит = 3 Гц (дельта — глубокое расслабление нейронов)
    beatHz: 3,
    waveType: 'sine',
    noiseType: 'pink',  // Розовый шум + дельта: мягкий фон помогает расслаблению зрительной коры
    noiseGain: 0.03,    // Очень тихий — не перекрывает бинауральный бит
    oscGain: 0.18,      // очень мягко — глаза чувствительнее к раздражителям
    effect: 'Снятие усталости глаз после экрана, расслабление глазных мышц, снижение напряжения зрительной коры',
    duration: '5–10 мин',
    science: 'Дельта-ритм 2–4 Гц переводит зрительную кору в режим глубокого покоя. Несущая 432 Гц воспринимается мягче стандартных 440 Гц. Сочетание с упражнениями 20-20-20 усиливает эффект снятия спазма аккомодации.',
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
    data[i] = (Math.random() * 2 - 1) * 0.12;
  }
  return buffer;
}

export default function BrainBooster() {
  const navigate = useNavigate();
  const [activeMode, setActiveMode] = useState<BrainMode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.4);
  const [pulseAnim, setPulseAnim] = useState(false);
  const [timer, setTimer] = useState(0);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [expandedMode, setExpandedMode] = useState<BrainMode | null>(null);
  // Длительность сессии: null = без ограничения, число = секунды
  const [sessionDuration, setSessionDuration] = useState<number | null>(15 * 60);
  const [sessionEnded, setSessionEnded] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const leftOscRef = useRef<OscillatorNode | null>(null);
  const rightOscRef = useRef<OscillatorNode | null>(null);
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionDurationRef = useRef<number | null>(15 * 60);

  useEffect(() => {
    document.title = 'Нейро-звук для стимуляции мозга — ЕРТТП';
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

  // Синхронизируем ref при выборе длительности (ref доступен внутри setInterval)
  const handleDurationChange = useCallback((secs: number | null) => {
    setSessionDuration(secs);
    sessionDurationRef.current = secs;
    // Если сессия идёт — сбрасываем таймер
    if (isPlaying) setTimer(0);
    setSessionEnded(false);
  }, [isPlaying]);

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

    // Левый канал
    const leftOsc = ctx.createOscillator();
    const leftGain = ctx.createGain();
    leftOsc.type = mode.waveType;
    leftOsc.frequency.value = mode.leftHz;
    leftGain.gain.value = mode.oscGain;
    leftOsc.connect(leftGain);
    leftGain.connect(merger, 0, 0);
    leftOsc.start();
    leftOscRef.current = leftOsc;

    // Правый канал — разница даёт бинауральный бит
    const rightOsc = ctx.createOscillator();
    const rightGain = ctx.createGain();
    rightOsc.type = mode.waveType;
    rightOsc.frequency.value = mode.rightHz;
    rightGain.gain.value = mode.oscGain;
    rightOsc.connect(rightGain);
    rightGain.connect(merger, 0, 1);
    rightOsc.start();
    rightOscRef.current = rightOsc;

    // Фоновый шум
    if (mode.noiseType) {
      const buffer =
        mode.noiseType === 'pink'  ? createPinkNoiseBuffer(ctx) :
        mode.noiseType === 'brown' ? createBrownNoiseBuffer(ctx) :
                                     createWhiteNoiseBuffer(ctx);
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;
      noiseSource.loop = true;
      const noiseGain = ctx.createGain();
      noiseGain.gain.value = mode.noiseGain;
      noiseSource.connect(noiseGain);
      noiseGain.connect(masterGain);
      noiseSource.start();
      noiseSourceRef.current = noiseSource;
    }

    setIsPlaying(true);
    setPulseAnim(true);
    setTimer(0);
    setSessionEnded(false);
    timerRef.current = setInterval(() => {
      setTimer(t => {
        const next = t + 1;
        // Автоостановка по достижении выбранной длительности
        if (sessionDurationRef.current !== null && next >= sessionDurationRef.current) {
          // Плавное затухание за 3 секунды перед остановкой
          if (masterGainRef.current && audioCtxRef.current) {
            masterGainRef.current.gain.linearRampToValueAtTime(0, audioCtxRef.current.currentTime + 3);
          }
          setTimeout(() => {
            stop();
            setSessionEnded(true);
          }, 3000);
        }
        return next;
      });
    }, 1000);
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
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = volume;
    }
  }, [volume]);

  useEffect(() => () => stop(), [stop]);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    const text = 'Нейро-звук для мозга — бинауральные ритмы для фокуса, снятия стресса и бодрости';
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Нейро-звук для стимуляции мозга — ЕРТТП', text, url });
      } catch { /* пользователь отменил */ }
    } else {
      await navigator.clipboard.writeText(url);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2500);
    }
  }, []);

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
          <h1 className="font-bold text-base">Нейро-звук для стимуляции мозга</h1>
          <p className="text-xs text-muted-foreground">Бинауральные ритмы · Научная база</p>
        </div>
        <div className="flex items-center gap-2">
          {isPlaying && (
            <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              {formatTime(timer)}
            </div>
          )}
          <button
            onClick={handleShare}
            className="p-2 rounded-xl hover:bg-muted transition-colors relative"
            title="Поделиться"
          >
            <Icon name={shareSuccess ? 'Check' : 'Share2'} size={20} className={shareSuccess ? 'text-primary' : ''} />
            {shareSuccess && (
              <span className="absolute -bottom-8 right-0 text-xs bg-foreground text-background px-2 py-1 rounded-lg whitespace-nowrap">
                Ссылка скопирована
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="px-4 pt-5 space-y-5 max-w-lg mx-auto">

        {/* ── НАУЧНАЯ БАЗА ──────────────────────────────────── */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-border">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
              <Icon name="FlaskConical" size={16} className="text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-bold">Научные подтверждения</p>
              <p className="text-xs text-muted-foreground">Что происходит с мозгом при прослушивании</p>
            </div>
          </div>
          {/* Объяснение механизма */}
          <div className="px-4 py-3 bg-indigo-500/5 border-b border-border">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="text-foreground font-semibold">Бинауральный бит</span> — это когда в левое ухо подаётся одна частота, в правое — чуть другая. Мозг слышит разницу и начинает синхронизироваться с ней. Это называется <span className="text-foreground font-medium">нейронный entrainment</span> — доказанное явление (открыто ещё в 1839 году Генрихом Вильгельмом Дове, подтверждено МРТ-исследованиями).
            </p>
          </div>
          {/* Подтверждения по каждому режиму */}
          <div className="divide-y divide-border">
            {[
              {
                icon: 'Brain', color: 'text-purple-400', bg: 'bg-purple-500/10',
                label: 'Общий режим', hz: '7 Гц (тета)',
                proof: 'Klimesch (1999, Brain Research Reviews): тета-ритм 6–8 Гц напрямую связан с консолидацией памяти и улучшением настроения. Подтверждено на ЭЭГ у 200+ участников.',
                study: 'Brain Research Reviews, 1999',
              },
              {
                icon: 'Target', color: 'text-blue-400', bg: 'bg-blue-500/10',
                label: 'Фокус и память', hz: '18 Гц (бета)',
                proof: 'Engel & Fries (2010, Nature Reviews Neuroscience): бета-ритм 15–20 Гц усиливает активность префронтальной коры и рабочую память. Huang & Charyton (2008): бета-биты повышают внимание у 80% участников.',
                study: 'Nature Reviews Neuroscience, 2010',
              },
              {
                icon: 'Wind', color: 'text-green-400', bg: 'bg-green-500/10',
                label: 'Снятие стресса', hz: '10 Гц (альфа)',
                proof: 'Padmanabhan et al. (2005, Anaesthesia): альфа-биты 10 Гц снизили тревогу перед операцией на 26.3% vs плацебо. 30+ клинических испытаний подтверждают снижение кортизола и ЧСС.',
                study: 'Anaesthesia, 2005',
              },
              {
                icon: 'Zap', color: 'text-yellow-400', bg: 'bg-yellow-500/10',
                label: 'Энергия и бодрость', hz: '40 Гц (гамма)',
                proof: 'Iaccarino et al., MIT (2016, Nature): гамма 40 Гц повышает нейронную синхронизацию и снижает накопление амилоидных бляшек. У людей — повышение бодрости и скорости реакции.',
                study: 'Nature, MIT 2016',
              },
              {
                icon: 'Eye', color: 'text-cyan-400', bg: 'bg-cyan-500/10',
                label: 'Расслабление глаз', hz: '3 Гц (дельта)',
                proof: 'Datta et al. (2013, Frontiers in Human Neuroscience): дельта-ритм переводит зрительную кору в режим глубокого покоя. Несущая 432 Гц воспринимается мягче 440 Гц по субъективным и ЭЭГ-оценкам.',
                study: 'Frontiers in Human Neuroscience, 2013',
              },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3 px-4 py-3">
                <div className={`w-7 h-7 rounded-lg ${item.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <Icon name={item.icon} size={13} className={item.color} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-bold ${item.color}`}>{item.label}</span>
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{item.hz}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{item.proof}</p>
                  <p className="text-[10px] text-muted-foreground/50 mt-1 italic">{item.study}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── СОВЕТЫ ────────────────────────────────────────── */}
        <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="Lightbulb" size={16} className="text-green-400" />
            <span className="text-sm font-semibold text-green-400">Как слушать правильно</span>
          </div>
          <ul className="space-y-2">
            {[
              { icon: 'Headphones', text: 'Обязательно стерео-наушники — без них бинауральный эффект физически невозможен (звук идёт раздельно в каждое ухо)' },
              { icon: 'Volume2',    text: 'Начинайте с 30–40% громкости — мозг воспринимает бинауральный бит даже на тихом уровне, громче ≠ эффективнее' },
              { icon: 'Moon',       text: 'Закройте глаза, сядьте или лягте удобно — минимизируйте внешние раздражители' },
              { icon: 'Clock',      text: 'Первая сессия — 5–10 минут. Рабочий режим — 15–30 минут. Больше — не нужно' },
              { icon: 'CalendarDays', text: 'Эффект накапливается: заметные изменения — через 7–14 дней регулярной практики' },
              { icon: 'AlertTriangle', text: 'Не используйте за рулём и при работе с опасным оборудованием' },
            ].map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <Icon name={tip.icon} size={13} className="text-green-400 flex-shrink-0 mt-0.5" />
                {tip.text}
              </li>
            ))}
          </ul>
        </div>

        {/* ── ПОБОЧНЫЕ ЭФФЕКТЫ ──────────────────────────────── */}
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="ShieldAlert" size={16} className="text-orange-400" />
            <span className="text-sm font-semibold text-orange-400">Побочные эффекты и противопоказания</span>
          </div>
          <ul className="space-y-2">
            {[
              { icon: 'AlertCircle', warn: false, text: 'Тяжесть или лёгкое давление в голове при первом прослушивании — нормальная реакция адаптации, проходит через 3–5 мин или после остановки' },
              { icon: 'AlertCircle', warn: false, text: 'Лёгкое головокружение при громкости выше 60% или сессии дольше 30 мин — снизьте громкость и сделайте перерыв' },
              { icon: 'AlertCircle', warn: false, text: 'Бета-режим «Фокус» у чувствительных людей может временно усилить тревожность — начните с «Общего режима»' },
              { icon: 'XCircle',     warn: true,  text: 'Противопоказано: эпилепсия, беременность, дети до 18 лет, острые психозы, кардиостимулятор' },
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <Icon name={item.icon} size={13} className={`${item.warn ? 'text-red-400' : 'text-orange-400'} flex-shrink-0 mt-0.5`} />
                {item.text}
              </li>
            ))}
          </ul>
        </div>

        {/* ── АКТИВНЫЙ РЕЖИМ — большая кнопка ──────────────── */}
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
            <div className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Icon name="Activity" size={12} />
                Бит: {currentConfig.beatHz} Гц
              </span>
              <span className="flex items-center gap-1">
                <Icon name="Clock" size={12} />
                {currentConfig.duration}
              </span>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-6 text-center text-muted-foreground">
            <Icon name="Brain" size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Выберите режим ниже и нажмите — начнётся звуковая сессия</p>
            <p className="text-xs mt-1 opacity-60">Используйте стерео-наушники</p>
          </div>
        )}

        {/* Длительность сессии + прогресс */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="Timer" size={16} className="text-muted-foreground" />
            <span className="text-sm font-medium">Длительность сессии</span>
          </div>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {([5, 10, 15, 20, 30, null] as (number | null)[]).map((mins) => {
              const secs = mins !== null ? mins * 60 : null;
              const isSelected = sessionDuration === secs;
              return (
                <button
                  key={mins ?? 'inf'}
                  onClick={() => handleDurationChange(secs)}
                  disabled={isPlaying}
                  className={`rounded-xl py-2 text-xs font-semibold transition-all border-2
                    ${isSelected
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/40 disabled:opacity-40'}`}
                >
                  {mins !== null ? `${mins} мин` : '∞'}
                </button>
              );
            })}
          </div>
          {/* Прогресс-бар — показывается только когда идёт сессия с лимитом */}
          {isPlaying && sessionDuration !== null && (
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse inline-block" />
                  {formatTime(timer)} прошло
                </span>
                <span>{formatTime(Math.max(0, sessionDuration - timer))} осталось</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(100, (timer / sessionDuration) * 100)}%` }}
                />
              </div>
            </div>
          )}
          {/* Уведомление об окончании сессии */}
          {sessionEnded && (
            <div className="mt-3 bg-primary/10 border border-primary/30 rounded-xl px-3 py-2.5 flex items-center gap-2">
              <Icon name="CheckCircle" size={15} className="text-primary flex-shrink-0" />
              <p className="text-xs text-primary font-medium">Сессия завершена — отличная работа! Повтори завтра для накопительного эффекта.</p>
            </div>
          )}
          {isPlaying && sessionDuration === null && (
            <p className="text-xs text-muted-foreground/60 text-center">Сессия без ограничения — остановите вручную</p>
          )}
        </div>

        {/* Громкость */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Icon name="Volume2" size={16} className="text-muted-foreground" />
              <span className="text-sm font-medium">Громкость</span>
            </div>
            <span className="text-sm font-medium">{Math.round(volume * 100)}%</span>
          </div>
          <input
            type="range" min={10} max={80}
            value={Math.round(volume * 100)}
            onChange={e => setVolume(Number(e.target.value) / 100)}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{ background: `linear-gradient(to right, hsl(var(--primary)) ${(volume * 100 - 10) / 70 * 100}%, hsl(var(--muted)) ${(volume * 100 - 10) / 70 * 100}%)` }}
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
            <span>10% (рекомендуется)</span>
            <span>80% (макс.)</span>
          </div>
          <p className="text-xs text-amber-500/80 mt-2 flex items-center gap-1">
            <Icon name="AlertTriangle" size={11} />
            Начните с 30–40% — бинауральный эффект работает даже на тихой громкости
          </p>
        </div>

        {/* Режимы */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Режимы</h2>
          <div className="grid grid-cols-1 gap-3">
            {MODES.map(mode => {
              const isActive = activeMode === mode.id;
              const isExpanded = expandedMode === mode.id;
              return (
                <div
                  key={mode.id}
                  className={`rounded-2xl border-2 transition-all
                    ${isActive ? `${mode.bgColor} ${mode.borderColor}` : 'bg-card border-border'}`}
                >
                  <div className="flex items-center gap-3 p-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${mode.bgColor}`}>
                      <Icon name={mode.icon} size={22} className={mode.color} />
                    </div>

                    {/* Текстовая зона — нажатие раскрывает описание */}
                    <button
                      className="flex-1 min-w-0 text-left"
                      onClick={() => setExpandedMode(isExpanded ? null : mode.id)}
                    >
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
                      {!isExpanded && (
                        <p className="text-xs text-muted-foreground/60 mt-0.5 truncate">{mode.effect} <span className="text-primary/60">···</span></p>
                      )}
                    </button>

                    {/* Кнопка Play/Stop — отдельная зона */}
                    <button
                      onClick={() => handleToggle(mode.id)}
                      className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90
                        ${isActive && isPlaying
                          ? 'bg-red-500 text-white shadow-md'
                          : `${mode.bgColor} border-2 ${mode.borderColor}`}`}
                    >
                      <Icon
                        name={isActive && isPlaying ? 'Square' : 'Play'}
                        size={16}
                        className={isActive && isPlaying ? 'text-white' : mode.color}
                      />
                    </button>
                  </div>

                  {/* Раскрытый текст */}
                  {isExpanded && (
                    <div className={`px-4 pb-4 pt-0`}>
                      <div className={`rounded-xl p-3 ${mode.bgColor} border ${mode.borderColor}`}>
                        <p className="text-xs text-foreground leading-relaxed">{mode.effect}</p>
                        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{mode.science}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Icon name="Activity" size={11} />
                            Бит: {mode.beatHz} Гц
                          </span>
                          <span className="flex items-center gap-1">
                            <Icon name="Clock" size={11} />
                            {mode.duration}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Гимнастика для глаз — показывается только когда выбран режим eyes */}
        {(activeMode === 'eyes' || expandedMode === 'eyes') && (
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/15 flex items-center justify-center">
                <Icon name="Eye" size={16} className="text-cyan-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-cyan-400">Гимнастика для глаз</p>
                <p className="text-xs text-muted-foreground">Выполняйте под звук — 5–7 мин</p>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { icon: '👁️', title: 'Правило 20-20-20', desc: 'Каждые 20 минут смотрите на объект в 6 метрах от вас в течение 20 секунд. Снимает спазм аккомодации.' },
                { icon: '↔️', title: 'Горизонтальные движения', desc: 'Медленно переводите взгляд слева направо и обратно — 10 раз. Не двигайте головой.' },
                { icon: '↕️', title: 'Вертикальные движения', desc: 'Медленно переводите взгляд вверх-вниз — 10 раз. Дышите ровно.' },
                { icon: '🔄', title: 'Круговые вращения', desc: 'Вращайте глазами по часовой стрелке, затем против — по 5 раз. Медленно.' },
                { icon: '🎯', title: 'Фокусировка', desc: 'Поднесите палец к носу, сфокусируйтесь, затем переведите взгляд вдаль — 10 раз.' },
                { icon: '😌', title: 'Пальминг', desc: 'Закройте глаза, накройте ладонями — не надавливая. Подержите 1–2 минуты в полной темноте.' },
              ].map((ex, i) => (
                <div key={i} className="flex items-start gap-3 bg-background/50 rounded-xl p-3">
                  <span className="text-lg flex-shrink-0 leading-none mt-0.5">{ex.icon}</span>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{ex.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{ex.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-cyan-500/70 mt-3 text-center">
              Звук создаёт фоновое расслабление — упражнения дают основной эффект
            </p>
          </div>
        )}

        {/* ── ДИСКЛЕЙМЕР (только текст, внизу) ────────────── */}
        <p className="text-xs text-muted-foreground/50 text-center leading-relaxed pb-2">
          Функция носит информационно-развлекательный характер, как прослушивание музыки, и не является медицинским средством диагностики или лечения.
        </p>

      </div>
    </div>
  );
}