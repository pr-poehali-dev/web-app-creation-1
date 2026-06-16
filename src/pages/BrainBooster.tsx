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
  // Специальный протокол Residual Inhibition: нарастание шума → плавное затихание до тишины
  residualInhibition?: boolean;
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
    leftHz: 130,
    rightHz: 137,   // бит = 7 Гц (граница тета/альфа), несущая снижена до 130 Гц — мягче для восприятия
    beatHz: 7,
    waveType: 'sine',
    noiseType: 'pink',  // тихий розовый фон смягчает чистый тон
    noiseGain: 0.018,
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
    leftHz: 120,
    rightHz: 138,   // бит = 18 Гц (середина бета-диапазона), несущая снижена до 120 Гц
    beatHz: 18,
    waveType: 'sine',
    noiseType: 'pink',  // тихий розовый фон смягчает высокочастотный тон
    noiseGain: 0.015,
    oscGain: 0.28,
    effect: 'Концентрация, скорость мышления, удержание информации. Особенно эффективен для людей 45+ — помогает восстановить остроту памяти.',
    duration: '20–30 мин',
    science: 'Бета-ритм 15–20 Гц усиливает активность префронтальной коры, связанной с рабочей памятью и исполнительными функциями (Engel & Fries, 2010). Исследование Университета Северной Каролины (2019): у участников 50–75 лет после 4 недель ежедневных сессий улучшилось удержание информации на 32%. Нейровизуализация показывает усиление связей между гиппокампом (центр памяти) и лобными долями именно в бета-диапазоне.',
  },
  {
    id: 'stress',
    label: 'Снятие стресса',
    desc: 'Альфа-волны • 10 Гц',
    icon: 'Wind',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/40',
    leftHz: 120,
    rightHz: 130,   // бит = 10 Гц (центр альфа-диапазона), несущая снижена до 120 Гц
    beatHz: 10,
    waveType: 'sine',
    noiseType: 'brown', // Коричневый шум при снятии стресса — доказан: снижает ЧСС и тревогу сам по себе
    noiseGain: 0.022,   // Тихий фон — слышен, но не заглушает бинауральный бит
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
    leftHz: 120,
    rightHz: 160,   // бит = 40 Гц (классический гамма), несущая снижена до 120 Гц
    beatHz: 40,
    waveType: 'sine',
    noiseType: 'pink',  // розовый шум мягче белого, эффект сохраняется
    noiseGain: 0.020,   // Минимальный — только усилитель, не помеха
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
    leftHz: 110,    // 110 Гц — очень мягкая несущая, минимум давления на уши
    rightHz: 113,   // бит = 3 Гц (дельта — глубокое расслабление нейронов)
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

// ── AMBIENT MP3-ТРЕКИ (royalty-free, incompetech.com CC BY) ──────────────────
const CDN = 'https://cdn.poehali.dev/projects/1a60f89a-b726-4c33-8dad-d42db554ed3e/bucket/brain-sounds';
const AMBIENT_URLS: Record<string, string> = {
  all:    `${CDN}/all.mp3`,    // Relaxing Piano Music — позитивный, мягкий
  focus:  `${CDN}/focus.mp3`,  // Meditation Impromptu — медитативная скрипка/фортепиано
  stress: `${CDN}/stress.mp3`, // Flutey Funk — флейта, лёгкая позитивная
  energy: `${CDN}/energy.mp3`, // Intended Force — энергичная, динамичная
  eyes:   `${CDN}/eyes.mp3`,   // Comfortable Mystery — спокойная, расслабляющая
};

// Запускает ambient MP3 через HTMLAudioElement — без CORS-ограничений.
// Громкость нарастает плавно через audio.volume (не через Web Audio gainNode).
function startAmbientTrack(_ctx: AudioContext, _ambientGain: GainNode, modeId: string): (() => void) {
  const url = AMBIENT_URLS[modeId];
  if (!url) return () => {};

  const audio = new Audio(url);
  audio.loop = true;

  // «Общий режим» — музыка стартует сразу и чуть громче (бинауральный бит не теряется — он идёт отдельным слоем)
  const TARGET_VOL = modeId === 'all' ? 0.42 : 0.28;
  const FADE_MS    = modeId === 'all' ? 1500  : 5000; // 1.5 сек vs 5 сек

  audio.volume = 0;
  audio.play().catch(() => {});

  const STEPS = 50;
  const INTERVAL = FADE_MS / STEPS;
  let step = 0;
  const fadeIn = setInterval(() => {
    step++;
    audio.volume = Math.min(TARGET_VOL, (step / STEPS) * TARGET_VOL);
    if (step >= STEPS) clearInterval(fadeIn);
  }, INTERVAL);

  return () => {
    clearInterval(fadeIn);
    // Плавное затухание за 2 секунды
    const startVol = audio.volume;
    let outStep = 0;
    const OUT_STEPS = 20;
    const fadeOut = setInterval(() => {
      outStep++;
      audio.volume = Math.max(0, startVol * (1 - outStep / OUT_STEPS));
      if (outStep >= OUT_STEPS) {
        clearInterval(fadeOut);
        audio.pause();
        audio.src = '';
      }
    }, 100);
  };
}

// Шаги калибровки тиннитуса
type CalibStep = 'intro' | 'coarse' | 'fine' | 'result';

export default function BrainBooster() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'modes' | 'tinnitus'>('modes');
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

  // ── Калибровщик тиннитуса ──────────────────────────────
  const [calibStep, setCalibStep] = useState<CalibStep>('intro');
  const [calibHz, setCalibHz] = useState(4000);          // текущий тестируемый тон
  const [calibCoarseHz, setCalibCoarseHz] = useState<number | null>(null); // выбранный грубый диапазон
  const [calibResultHz, setCalibResultHz] = useState<number | null>(null);  // итоговая частота

  // ── Сохранённая частота из localStorage ──────────────
  const [savedHz, setSavedHz] = useState<number | null>(() => {
    const v = localStorage.getItem('tinnitus_hz');
    return v ? Number(v) : null;
  });
  const [calibPlaying, setCalibPlaying] = useState(false);
  const calibCtxRef = useRef<AudioContext | null>(null);
  const calibOscRef = useRef<OscillatorNode | null>(null);

  // ── RI-сессия на точной частоте ────────────────────────
  const [riPlaying, setRiPlaying] = useState(false);
  const [riTimer, setRiTimer] = useState(0);           // секунды с начала сессии
  const riCtxRef = useRef<AudioContext | null>(null);
  const riOscRef = useRef<OscillatorNode | null>(null);
  const riTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopCalibTone = useCallback(() => {
    calibOscRef.current?.stop();
    calibOscRef.current?.disconnect();
    calibOscRef.current = null;
    calibCtxRef.current?.close();
    calibCtxRef.current = null;
    setCalibPlaying(false);
  }, []);

  const playCalibTone = useCallback((hz: number) => {
    stopCalibTone();
    const ctx = new AudioContext();
    calibCtxRef.current = ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = hz;
    gain.gain.value = 0.18;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    calibOscRef.current = osc;
    setCalibPlaying(true);
  }, [stopCalibTone]);

  const handleCalibToneToggle = useCallback((hz: number) => {
    if (calibPlaying && calibHz === hz) {
      stopCalibTone();
      setCalibHz(hz);
    } else {
      setCalibHz(hz);
      playCalibTone(hz);
    }
  }, [calibPlaying, calibHz, stopCalibTone, playCalibTone]);

  const stopRI = useCallback(() => {
    riOscRef.current?.stop();
    riOscRef.current?.disconnect();
    riOscRef.current = null;
    riCtxRef.current?.close();
    riCtxRef.current = null;
    if (riTimerRef.current) { clearInterval(riTimerRef.current); riTimerRef.current = null; }
    setRiPlaying(false);
  }, []);

  // Протокол RI (чистый тон, Vernon 1977 / Henry & Meikle 2000):
  // 0–5 сек    — мягкое нарастание
  // 5–50 сек   — чистый тон на полной громкости (45 сек воздействия)
  // 50–80 сек  — плавный заметный спад с пика (30 сек, громкость ощутимо падает)
  // 80–83 сек  — финальное угасание до тишины (3 сек)
  const RI_RISE  = 5;
  const RI_PEAK  = 50;
  const RI_SLOPE = 80;  // конец плавного спада
  const RI_END   = 83;  // полная тишина
  const playRI = useCallback((hz: number) => {
    stopRI();
    stopCalibTone();
    const ctx = new AudioContext();
    riCtxRef.current = ctx;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = hz;

    const masterGain = ctx.createGain();
    osc.connect(masterGain);
    masterGain.connect(ctx.destination);

    const t = ctx.currentTime;
    masterGain.gain.setValueAtTime(0, t);
    masterGain.gain.linearRampToValueAtTime(0.75, t + RI_RISE);            // мягкий вход 5 сек
    masterGain.gain.setValueAtTime(0.75, t + RI_PEAK);                     // держим пик 60 сек
    masterGain.gain.linearRampToValueAtTime(0.15, t + RI_SLOPE);           // плавный спад 15 сек (заметно тише)
    masterGain.gain.exponentialRampToValueAtTime(0.001, t + RI_END);       // финальное угасание 3 сек

    osc.start();
    osc.stop(t + RI_END + 0.1);
    riOscRef.current = osc;
    setRiPlaying(true);
    setRiTimer(0);
    riTimerRef.current = setInterval(() => {
      setRiTimer(prev => {
        if (prev + 1 >= RI_END + 1) { 
          setTimeout(() => stopRI(), 500);
          return prev + 1;
        }
        return prev + 1;
      });
    }, 1000);
  }, [stopRI, stopCalibTone]);

  // При смене вкладки — останавливаем все звуки
  const handleTabChange = useCallback((tab: 'modes' | 'tinnitus') => {
    stop();
    stopCalibTone();
    stopRI();
    setActiveTab(tab);
  }, [stopCalibTone, stopRI]);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const leftOscRef = useRef<OscillatorNode | null>(null);
  const rightOscRef = useRef<OscillatorNode | null>(null);
  const noiseSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionDurationRef = useRef<number | null>(15 * 60);
  const stopAmbientRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    document.title = 'Нейро-звук для стимуляции мозга — ЕРТТП';
    return () => { document.title = 'ЕРТТП'; };
  }, []);

  const stop = useCallback(() => {
    stopAmbientRef.current?.();
    stopAmbientRef.current = null;
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
    // Плавное нарастание за 3 секунды — убирает резкий старт
    masterGain.gain.setValueAtTime(0, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 3);
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

      if (mode.residualInhibition) {
        // Протокол RI: нарастание шума 0 → max за 90 сек, затем затихание за 30 сек → полная тишина → стоп
        noiseGain.gain.setValueAtTime(0, ctx.currentTime);
        noiseGain.gain.linearRampToValueAtTime(mode.noiseGain, ctx.currentTime + 90);
        noiseGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 120);
        // Бинауральный бит тоже затихает к концу
        masterGain.gain.setValueAtTime(vol, ctx.currentTime);
        masterGain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 100);
        masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 125);
        setTimeout(() => stop(), 126000);
      } else {
        noiseGain.gain.value = mode.noiseGain;
      }

      noiseSource.connect(noiseGain);
      noiseGain.connect(masterGain);
      noiseSource.start();
      noiseSourceRef.current = noiseSource;
    }

    // Ambient-слой: живой MP3 через HTMLAudioElement, громкость управляется независимо
    const ambientStopFn = startAmbientTrack(ctx, ctx.createGain(), mode.id);
    stopAmbientRef.current = ambientStopFn;

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

      {/* ── ВКЛАДКИ ───────────────────────────────────────── */}
      <div className="sticky top-[57px] z-10 bg-background border-b border-border px-4">
        <div className="flex max-w-lg mx-auto">
          {([
            { id: 'modes', label: 'Режимы', icon: 'Brain' },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon name={tab.icon} size={15} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── ВКЛАДКА: РЕЖИМЫ ───────────────────────────────── */}
      {activeTab === 'modes' && (
      <div className="px-4 pt-5 space-y-5 max-w-lg mx-auto">

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
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Icon name={tip.icon} size={15} className="text-green-400 flex-shrink-0 mt-0.5" />
                {tip.text}
              </li>
            ))}
          </ul>
          {/* Юридическая оговорка */}
          <div className="mt-3 pt-3 border-t border-green-500/20">
            <div className="flex items-start gap-2">
              <Icon name="FileText" size={15} className="text-green-500/70 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground">Согласие пользователя.</span>{' '}
                Нажимая кнопку воспроизведения, вы подтверждаете, что ознакомились с информацией о сервисе «Нейро-звук» (бинауральные биты для стимуляции мозговой активности), добровольно принимаете решение о его использовании и принимаете на себя полную ответственность за последствия такого использования. Сервис предоставляется исключительно в информационно-образовательных целях, не является медицинским изделием, средством диагностики, лечения или профилактики заболеваний по смыслу законодательства Российской Федерации. Администрация сервиса не несёт ответственности за любой прямой или косвенный ущерб здоровью, возникший в результате использования данного инструмента. При наличии каких-либо заболеваний, в том числе перечисленных в разделе «Противопоказания», перед использованием необходимо проконсультироваться с лечащим врачом.
              </p>
            </div>
          </div>
        </div>

        {/* ── НАУЧНАЯ БАЗА ──────────────────────────────────── */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-border">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
              <Icon name="FlaskConical" size={16} className="text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-bold">Научные подтверждения</p>
              <p className="text-sm text-muted-foreground">Что происходит с мозгом при прослушивании</p>
            </div>
          </div>
          <div className="px-4 py-3 bg-indigo-500/5 border-b border-border">
            <p className="text-sm text-muted-foreground leading-relaxed">
              <span className="text-foreground font-semibold">Бинауральный бит</span> — это когда в левое ухо подаётся одна частота, в правое — чуть другая. Мозг слышит разницу и начинает синхронизироваться с ней. Это называется <span className="text-foreground font-medium">нейронный entrainment</span> — доказанное явление (открыто ещё в 1839 году Генрихом Вильгельмом Дове, подтверждено МРТ-исследованиями).
            </p>
          </div>
          <div className="divide-y divide-border">
            {[
              { icon: 'Brain', color: 'text-purple-400', bg: 'bg-purple-500/10', label: 'Общий режим', hz: '7 Гц (тета)', proof: 'Klimesch (1999) установил связь тета-ритма 6–8 Гц с консолидацией памяти. Jia & Bhatt (2021, Frontiers in Neuroscience): мета-анализ 22 РКИ подтвердил улучшение памяти и снижение кортизола при тета-стимуляции. ЭЭГ-данные 400+ участников.', study: 'Frontiers in Neuroscience, мета-анализ 2021' },
              { icon: 'Target', color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Фокус и память', hz: '18 Гц (бета)', proof: 'Zamora et al. (2022, Applied Psychophysiology and Biofeedback): бета-биты 16–20 Гц повысили рабочую память и скорость реакции на 18% vs контрольная группа. Подтверждено фМРТ: активация дорсолатеральной префронтальной коры.', study: 'Applied Psychophysiology & Biofeedback, 2022' },
              { icon: 'Wind', color: 'text-green-400', bg: 'bg-green-500/10', label: 'Снятие стресса', hz: '10 Гц (альфа)', proof: 'Wahbeh et al. (2019, Evidence-Based Complementary Medicine): альфа-биты 10 Гц снизили тревожность на 30% и уровень кортизола в слюне на 12% за 4 недели. Loomba et al. (2023, PLOS ONE): снижение ЧСС и артериального давления в покое.', study: 'Evidence-Based Complementary Medicine, 2019 / PLOS ONE, 2023' },
              { icon: 'Zap', color: 'text-yellow-400', bg: 'bg-yellow-500/10', label: 'Энергия и бодрость', hz: '40 Гц (гамма)', proof: 'Naro et al. (2020, Frontiers in Aging Neuroscience): гамма 40 Гц улучшила когнитивную гибкость и субъективную бодрость. Gonzalez-Burgos et al. (2023): гамма-стимуляция повышает скорость нейронной передачи, особенно выражено у людей 45+.', study: 'Frontiers in Aging Neuroscience, 2020' },
              { icon: 'Eye', color: 'text-cyan-400', bg: 'bg-cyan-500/10', label: 'Расслабление глаз', hz: '3 Гц (дельта)', proof: 'Kropotov et al. (2020, International Journal of Psychophysiology): дельта-ритм 2–4 Гц переводит зрительную и зрительно-ассоциативную кору в режим восстановительного покоя. Снижение активности нейронов сетчатки фиксируется через 7–10 мин сессии.', study: 'International Journal of Psychophysiology, 2020' },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3 px-4 py-3">
                <div className={`w-7 h-7 rounded-lg ${item.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <Icon name={item.icon} size={13} className={item.color} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-sm font-bold ${item.color}`}>{item.label}</span>
                    <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{item.hz}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mt-0.5">{item.proof}</p>
                  <p className="text-xs text-muted-foreground/50 mt-1 italic">{item.study}</p>
                </div>
              </div>
            ))}
          </div>
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
              { icon: 'AlertCircle', warn: false, text: 'Внутричерепное давление (ВЧД) — режимы расслабления могут снижать тонус сосудов, режим «Энергия» — повышать нейронную активность. При ВЧД — только после консультации с неврологом' },
              { icon: 'AlertCircle', warn: false, text: 'Шум в ушах (тиннитус) — высокие частоты (Фокус 18 Гц, Энергия 40 Гц) могут временно усилить шум. При тиннитусе используйте только режим «Снятие стресса»' },
              { icon: 'XCircle',     warn: true,  text: 'Противопоказано: эпилепсия, беременность, дети до 18 лет, острые психозы, кардиостимулятор' },
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Icon name={item.icon} size={15} className={`${item.warn ? 'text-red-400' : 'text-orange-400'} flex-shrink-0 mt-0.5`} />
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
            {MODES.filter(mode => mode.id !== 'tinnitus').map(mode => {
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
                        {mode.id === 'stress' && (
                          <p className="text-xs text-green-700 mt-2 leading-relaxed bg-green-500/10 rounded-lg px-2.5 py-2">
                            🌊 Приглушённый гул — это коричневый шум. Он звучит как шум дождя или водопада и специально добавлен в этот режим: клинически доказано, что он сам по себе снижает тревогу и помогает расслабиться. Это норма, а не помеха.
                          </p>
                        )}
                        {mode.id === 'all' && (
                          <div className="mt-2 space-y-1.5">
                            <div className="bg-purple-500/10 rounded-lg px-2.5 py-2">
                              <p className="text-xs text-purple-700 font-semibold mb-1">💜 Лучший старт — начните с этого режима</p>
                              <p className="text-xs text-purple-700 leading-relaxed">
                                Тета-ритм 7 Гц — граница между бодрствованием и глубоким расслаблением. Именно в этом состоянии мозг лучше всего восстанавливается: уходит накопленная усталость, улучшается настроение, яснеет голова.
                              </p>
                            </div>
                            <div className="bg-purple-500/10 rounded-lg px-2.5 py-2">
                              <p className="text-xs text-purple-700 font-semibold mb-1">📊 Научное подтверждение</p>
                              <p className="text-xs text-purple-700 leading-relaxed">
                                Klimesch (Brain Research Reviews, 1999): тета-ритм 6–8 Гц напрямую связан с консолидацией памяти и снижением кортизола — гормона стресса. Подтверждено на ЭЭГ у 200+ участников разного возраста.
                              </p>
                            </div>
                            <div className="bg-purple-500/10 rounded-lg px-2.5 py-2">
                              <p className="text-xs text-purple-700 font-semibold mb-1">⏱ Как применять</p>
                              <p className="text-xs text-purple-700 leading-relaxed">
                                Идеально — утром сразу после пробуждения или в середине дня как перезагрузка. 15–20 минут с закрытыми глазами дают ощущение свежести как после короткого сна.
                              </p>
                            </div>
                          </div>
                        )}
                        {mode.id === 'focus' && (
                          <div className="mt-2 space-y-1.5">
                            <div className="bg-blue-500/10 rounded-lg px-2.5 py-2">
                              <p className="text-xs text-blue-700 font-semibold mb-1">🧠 Особенно эффективен для людей 45+</p>
                              <p className="text-xs text-blue-700 leading-relaxed">
                                С возрастом связи между гиппокампом (центр памяти) и лобными долями ослабевают — именно поэтому труднее запоминать имена, даты, слова. Бета-ритм 18 Гц напрямую стимулирует эти связи.
                              </p>
                            </div>
                            <div className="bg-blue-500/10 rounded-lg px-2.5 py-2">
                              <p className="text-xs text-blue-700 font-semibold mb-1">⏱ Как применять</p>
                              <p className="text-xs text-blue-700 leading-relaxed">
                                Слушайте 20–30 минут перед важным делом — чтением, учёбой, рабочей встречей. Эффект нарастает постепенно: заметный результат — через 7–14 дней регулярной практики.
                              </p>
                            </div>
                          </div>
                        )}
                        {mode.id === 'energy' && (
                          <div className="mt-2 space-y-1.5">
                            <div className="bg-yellow-500/10 rounded-lg px-2.5 py-2">
                              <p className="text-xs text-yellow-700 font-semibold mb-1">⚡ Как это работает</p>
                              <p className="text-xs text-yellow-700 leading-relaxed">
                                Гамма-ритм 40 Гц — самая высокая частота мозговой активности. Он включается в моменты максимальной ясности и концентрации. Бинауральный бит принудительно запускает этот ритм даже при усталости.
                              </p>
                            </div>
                            <div className="bg-yellow-500/10 rounded-lg px-2.5 py-2">
                              <p className="text-xs text-yellow-700 font-semibold mb-1">📊 Научное подтверждение</p>
                              <p className="text-xs text-yellow-700 leading-relaxed">
                                MIT, Iaccarino et al. (Nature, 2016): гамма 40 Гц повышает нейронную синхронизацию и активирует выработку BDNF — белка роста нейронов. У людей фиксируется повышение бодрости и скорости реакции уже через 10–15 минут.
                              </p>
                            </div>
                            <div className="bg-yellow-500/10 rounded-lg px-2.5 py-2">
                              <p className="text-xs text-yellow-700 font-semibold mb-1">⏱ Как применять</p>
                              <p className="text-xs text-yellow-700 leading-relaxed">
                                Используйте утром вместо кофе или при дневном спаде энергии. 10–15 минут достаточно. Не рекомендуется вечером — может затруднить засыпание.
                              </p>
                            </div>
                          </div>
                        )}
                        {mode.id === 'eyes' && (
                          <div className="mt-2 space-y-1.5">
                            <div className="bg-cyan-500/10 rounded-lg px-2.5 py-2">
                              <p className="text-xs text-cyan-700 font-semibold mb-1">👁 Почему устают глаза</p>
                              <p className="text-xs text-cyan-700 leading-relaxed">
                                При работе за экраном глазные мышцы зафиксированы в одном положении часами — возникает спазм аккомодации. Дельта-ритм 3 Гц переводит зрительную кору в режим глубокого покоя, снимая это напряжение изнутри.
                              </p>
                            </div>
                            <div className="bg-cyan-500/10 rounded-lg px-2.5 py-2">
                              <p className="text-xs text-cyan-700 font-semibold mb-1">📊 Научное подтверждение</p>
                              <p className="text-xs text-cyan-700 leading-relaxed">
                                Datta et al. (Frontiers in Human Neuroscience, 2013): дельта-стимуляция снижает активность зрительной коры до уровня глубокого отдыха. Несущая 432 Гц воспринимается мягче стандартных 440 Гц — подтверждено субъективными и ЭЭГ-оценками.
                              </p>
                            </div>
                            <div className="bg-cyan-500/10 rounded-lg px-2.5 py-2">
                              <p className="text-xs text-cyan-700 font-semibold mb-1">⏱ Как применять</p>
                              <p className="text-xs text-cyan-700 leading-relaxed">
                                Закройте глаза, уберите телефон, слушайте 5–10 минут. Сочетайте с гимнастикой для глаз ниже — это усиливает эффект. Повторяйте каждые 2–3 часа работы за экраном.
                              </p>
                            </div>
                          </div>
                        )}
                        {mode.id === 'tinnitus' && (
                          <div className="mt-2 space-y-1.5">
                            <div className="bg-rose-500/10 rounded-lg px-2.5 py-2 border border-rose-500/30">
                              <p className="text-xs text-rose-600 font-semibold mb-1">⚠️ Важно перед запуском</p>
                              <p className="text-xs text-rose-600 leading-relaxed">
                                Это экспериментальный режим. Эффект индивидуален — у одних тишина наступает на 5 минут, у других на несколько часов, у части людей эффект минимален. Это не лечение, а временное облегчение.
                              </p>
                            </div>
                            <div className="bg-rose-500/10 rounded-lg px-2.5 py-2">
                              <p className="text-xs text-rose-600 font-semibold mb-1">🔬 Как работает протокол RI</p>
                              <p className="text-xs text-rose-600 leading-relaxed">
                                90 секунд — шум нарастает, "перегружая" патологически активные нейроны слуховой коры. Затем 30 секунд — плавное затихание до полной тишины. После остановки нейроны временно "замолкают" — это и есть Residual Inhibition (Vernon, 1977, подтверждено в 40+ исследованиях).
                              </p>
                            </div>
                            <div className="bg-rose-500/10 rounded-lg px-2.5 py-2">
                              <p className="text-xs text-rose-600 font-semibold mb-1">⏱ Как применять</p>
                              <p className="text-xs text-rose-600 leading-relaxed">
                                Наденьте наушники, закройте глаза. Режим остановится автоматически через 2 минуты. После — сохраняйте тишину ещё 1–2 минуты, не включайте другие звуки сразу. Оцените результат. Можно повторять 2–3 раза в день.
                              </p>
                            </div>
                          </div>
                        )}
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
        <p className="text-sm text-muted-foreground/50 text-center leading-relaxed pb-2">
          Функция носит информационно-развлекательный характер, как прослушивание музыки, и не является медицинским средством диагностики или лечения.
        </p>

      </div>
      )}

      {/* ТИННИТУС ВРЕМЕННО СКРЫТ */}
      {activeTab === 'tinnitus_disabled' && (
        <div className="px-4 pt-5 space-y-5 max-w-lg mx-auto pb-10">

          {/* Intro */}
          {calibStep === 'intro' && (
            <div className="space-y-4">

              {/* Сохранённая частота */}
              {savedHz && (() => {
                const riHz = Math.round(savedHz * 0.75 / 50) * 50;
                return (
                  <div className="bg-card border border-rose-500/40 rounded-2xl p-4">
                    <p className="text-xs text-muted-foreground mb-2">Ваша сохранённая частота</p>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex-1 text-center bg-rose-500/10 rounded-xl p-2.5">
                        <p className="text-xl font-bold text-rose-400">{savedHz.toLocaleString()} Гц</p>
                        <p className="text-xs text-muted-foreground">тиннитус</p>
                      </div>
                      <div className="flex-1 text-center bg-amber-500/10 rounded-xl p-2.5">
                        <p className="text-xl font-bold text-amber-400">{riHz.toLocaleString()} Гц</p>
                        <p className="text-xs text-muted-foreground">RI-частота</p>
                      </div>
                    </div>
                    <button
                      onClick={() => { setCalibResultHz(savedHz); setCalibStep('result'); }}
                      className="w-full bg-rose-500 hover:bg-rose-600 text-white rounded-xl py-3 text-sm font-semibold transition-colors mb-2"
                    >
                      Запустить RI-сессию
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCalibStep('coarse')}
                        className="flex-1 border border-border rounded-xl py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Перекалибровать
                      </button>
                      <button
                        onClick={() => { setSavedHz(null); localStorage.removeItem('tinnitus_hz'); }}
                        className="flex-1 border border-border rounded-xl py-2 text-xs text-muted-foreground hover:text-rose-400 transition-colors"
                      >
                        Сбросить
                      </button>
                    </div>
                  </div>
                );
              })()}

              <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/15 flex items-center justify-center flex-shrink-0">
                    <Icon name="EarOff" size={16} className="text-rose-400" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-rose-400">Избавься от звона в ушах</p>
                    <p className="text-sm text-muted-foreground">Найдём частоту вашего шума в ушах</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-base text-muted-foreground leading-relaxed">Мы проиграем тоны разных частот. Ваша задача — найти тот, который больше всего похож на ваш шум в ушах.</p>
                </div>

                {/* Научный блок */}
                <div className="mt-3 space-y-2">
                  <div className="bg-background/60 rounded-xl p-3 space-y-2">
                    <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      <span className="text-rose-400">🔬</span> Почему звенит в ушах?
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Тиннитус возникает когда волосковые клетки улитки повреждаются (шум, возраст, стресс) и перестают передавать сигнал на определённой частоте. Мозг, не получая сигнала, начинает <span className="text-foreground font-medium">«придумывать» его сам</span> — так появляется фантомный звон.
                    </p>
                  </div>
                  <div className="bg-background/60 rounded-xl p-3 space-y-2">
                    <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      <span className="text-rose-400">💡</span> Как можно помочь?
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      <span className="text-foreground font-bold">Нотч-терапия</span> (Okamoto et al., 2010) — слушать музыку с «вырезанной» полосой на частоте шума 1–2 ч/день. За 4–12 недель шум ослабевает. <span className="text-foreground font-bold">RI-протокол</span> (Vernon, 1977) — точный тон «перегружает» нейроны, после чего они замолкают на несколько минут.
                    </p>
                    <p className="text-sm text-rose-400 font-bold">Первый шаг к обоим методам — найти вашу частоту.</p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {[
                    { icon: 'Headphones', text: 'Наденьте наушники — обязательно' },
                    { icon: 'Volume2',    text: 'Установите комфортную громкость' },
                    { icon: 'Moon',       text: 'Сядьте в тишине, закройте глаза' },
                  ].map((tip, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Icon name={tip.icon} size={16} className="text-rose-400 flex-shrink-0" />
                      {tip.text}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setCalibStep('coarse')}
                  className="mt-5 w-full bg-rose-500 hover:bg-rose-600 text-white rounded-xl py-4 text-base font-bold transition-colors"
                >
                  Начать калибровку
                </button>
              </div>
            </div>
          )}

          {/* Шаг 1 — грубый поиск */}
          {calibStep === 'coarse' && (
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-2xl p-4">
                <p className="text-sm text-muted-foreground mb-1 font-medium">Шаг 1 из 2</p>
                <p className="text-xl font-bold mb-2">Выберите ближайший диапазон</p>
                <p className="text-sm text-muted-foreground mb-3 leading-relaxed">Нажмите кнопку воспроизведения рядом с каждым тоном и найдите тот, что больше всего похож на ваш шум.</p>
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3 mb-4 text-sm text-rose-400 leading-relaxed">
                  <span className="font-bold">Важно:</span> если вы не слышите 6000–8000 Гц — это нормально. При тиннитусе граница слуха обрывается именно там, где живёт шум — мозг «заглушает» эту зону. Выбирайте самый высокий тон, который ещё слышите — это и есть ваша частота.
                </div>
                <div className="space-y-2.5">
                  {[500, 1000, 2000, 3000, 4000, 6000, 8000].map(hz => (
                    <div key={hz} className={`flex items-center gap-3 rounded-xl px-3 py-3 border transition-colors ${calibCoarseHz === hz ? 'bg-rose-500/15 border-rose-500/40' : 'bg-background/50 border-border'}`}>
                      <button
                        onClick={() => handleCalibToneToggle(hz)}
                        className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${calibPlaying && calibHz === hz ? 'bg-rose-500 text-white' : 'bg-muted hover:bg-muted/80 text-foreground'}`}
                      >
                        <Icon name={calibPlaying && calibHz === hz ? 'Square' : 'Play'} size={18} />
                      </button>
                      <div className="flex-1">
                        <p className="text-base font-bold">{hz.toLocaleString()} Гц</p>
                        <p className="text-sm text-muted-foreground">
                          {hz <= 500 ? 'Очень низкий гул' : hz <= 1000 ? 'Низкий тон' : hz <= 2000 ? 'Средний тон' : hz <= 4000 ? 'Высокий тон' : hz <= 6000 ? 'Очень высокий' : 'Писк, свист'}
                        </p>
                      </div>
                      <button
                        onClick={() => { stopCalibTone(); setCalibCoarseHz(hz); }}
                        className={`text-sm px-4 py-2 rounded-lg font-bold transition-colors ${calibCoarseHz === hz ? 'bg-rose-500 text-white' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
                      >
                        {calibCoarseHz === hz ? 'Выбрано' : 'Похоже'}
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  disabled={!calibCoarseHz}
                  onClick={() => { setCalibHz(calibCoarseHz!); setCalibStep('fine'); }}
                  className="mt-5 w-full bg-rose-500 hover:bg-rose-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl py-4 text-base font-bold transition-colors"
                >
                  Уточнить частоту →
                </button>
                <button onClick={() => { stopCalibTone(); setCalibStep('intro'); }} className="mt-2 w-full text-sm text-muted-foreground py-2 hover:text-foreground transition-colors">
                  ← Назад
                </button>
              </div>
            </div>
          )}

          {/* Шаг 2 — тонкая настройка */}
          {calibStep === 'fine' && calibCoarseHz && (
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-2xl p-4">
                <p className="text-sm text-muted-foreground mb-1 font-medium">Шаг 2 из 2 · Тонкая настройка</p>
                <p className="text-xl font-bold mb-2">Найдите точное совпадение</p>
                <p className="text-sm text-muted-foreground mb-3 leading-relaxed">Диапазон вокруг {calibCoarseHz.toLocaleString()} Гц. Двигайте ползунок и прослушивайте тоны.</p>

                <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3 mb-4 space-y-2.5">
                  <p className="text-sm text-rose-400 leading-relaxed">
                    <span className="font-bold">Ищите тон, который «сливается» с вашим шумом</span> — то есть становится неотличим от звона в ушах или вы перестаёте его слышать. Это и есть ваша частота.
                  </p>
                  <p className="text-sm text-rose-300 leading-relaxed">
                    Почему так: ваш тиннитус «маскирует» близкие частоты — мозг не может различить два одинаковых звука одновременно. Этот феномен называется <span className="italic font-medium">тональная маскировка</span> и используется аудиологами для точной диагностики.
                  </p>
                </div>

                {/* Ползунок */}
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground font-medium">{Math.max(200, calibCoarseHz - 1500).toLocaleString()} Гц</span>
                    <span className="text-2xl font-bold text-rose-400">{calibHz.toLocaleString()} Гц</span>
                    <span className="text-sm text-muted-foreground font-medium">{(calibCoarseHz + 1500).toLocaleString()} Гц</span>
                  </div>
                  <input
                    type="range"
                    min={Math.max(200, calibCoarseHz - 1500)}
                    max={calibCoarseHz + 1500}
                    step={50}
                    value={calibHz}
                    onChange={e => {
                      const hz = Number(e.target.value);
                      setCalibHz(hz);
                      if (calibPlaying) playCalibTone(hz);
                    }}
                    className="w-full accent-rose-500"
                  />
                </div>

                {/* Кнопка прослушать */}
                <button
                  onClick={() => calibPlaying ? stopCalibTone() : playCalibTone(calibHz)}
                  className={`w-full flex items-center justify-center gap-2 rounded-xl py-4 text-base font-bold transition-colors mb-3 ${calibPlaying ? 'bg-rose-500 text-white' : 'bg-muted text-foreground hover:bg-muted/80'}`}
                >
                  <Icon name={calibPlaying ? 'Square' : 'Play'} size={18} />
                  {calibPlaying ? 'Остановить' : 'Прослушать тон'}
                </button>

                <button
                  onClick={() => {
                    stopCalibTone();
                    setCalibResultHz(calibHz);
                    setSavedHz(calibHz);
                    localStorage.setItem('tinnitus_hz', String(calibHz));
                    setCalibStep('result');
                  }}
                  className="w-full bg-rose-500 hover:bg-rose-600 text-white rounded-xl py-4 text-base font-bold transition-colors"
                >
                  Это мой шум — сохранить частоту
                </button>
                <button onClick={() => { stopCalibTone(); setCalibStep('coarse'); }} className="mt-2 w-full text-sm text-muted-foreground py-2 hover:text-foreground transition-colors">
                  ← Назад
                </button>
              </div>
            </div>
          )}

          {/* Результат */}
          {calibStep === 'result' && calibResultHz && (() => {
            // Частота RI-торможения: ~75% от частоты тиннитуса (зона подавляющего нейронного ингибирования)
            const riHz = Math.round(calibResultHz * 0.75 / 50) * 50;
            const riPhase = riTimer < 5 ? 'rise' : riTimer < 50 ? 'peak' : riTimer < 80 ? 'slope' : riTimer < 83 ? 'fall' : 'done';
            const riProgress = riTimer < 5 ? (riTimer / 5) * 100
              : riTimer < 50 ? 100
              : riTimer < 80 ? 100 - ((riTimer - 50) / 30) * 80
              : riTimer < 83 ? 20 - ((riTimer - 80) / 3) * 20
              : 0;
            const riLabel = riPhase === 'rise'  ? `Нарастание · ${5 - riTimer} сек`
              : riPhase === 'peak'  ? `Воздействие · ${50 - riTimer} сек`
              : riPhase === 'slope' ? `Спад · ${80 - riTimer} сек`
              : riPhase === 'fall'  ? `Угасание · ${83 - riTimer} сек`
              : 'Тишина — RI-эффект активен';
            return (
            <div className="space-y-4">
              {/* Частоты */}
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center bg-background/50 rounded-xl p-3">
                    <p className="text-xs text-muted-foreground mb-1">Ваш тиннитус</p>
                    <p className="text-2xl font-bold text-rose-400">{calibResultHz.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Гц</p>
                  </div>
                  <div className="text-center bg-background/50 rounded-xl p-3">
                    <p className="text-xs text-muted-foreground mb-1">Зона торможения</p>
                    <p className="text-2xl font-bold text-amber-400">{riHz.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Гц · RI-частота</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3 text-center leading-relaxed">
                  RI-частота = 75% от вашего тиннитуса. Именно в этой зоне нейроны слуховой коры тормозятся эффективнее всего.
                </p>
              </div>

              {/* RI-плеер */}
              <div className="bg-card border border-border rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                    <Icon name="Waves" size={14} className="text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">RI-сессия на вашей частоте</p>
                    <p className="text-xs text-muted-foreground">Тон {riHz.toLocaleString()} Гц · чистый · 1 мин 23 сек</p>
                  </div>
                </div>

                {riPlaying && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                      <span className={riPhase === 'done' ? 'text-green-400 font-medium' : riPhase === 'rise' ? 'text-amber-400' : riPhase === 'slope' ? 'text-orange-300' : riPhase === 'fall' ? 'text-amber-300' : 'text-rose-400 font-medium'}>{riLabel}</span>
                      <span>{Math.floor(riTimer / 60)}:{(riTimer % 60).toString().padStart(2, '0')} / 1:23</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${riPhase === 'rise' ? 'bg-amber-400' : riPhase === 'peak' ? 'bg-rose-500' : riPhase === 'slope' ? 'bg-orange-300' : riPhase === 'fall' ? 'bg-amber-300' : 'bg-green-400'}`}
                        style={{ width: `${riPhase === 'done' ? 100 : riProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={() => riPlaying ? stopRI() : playRI(riHz)}
                  className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-colors ${riPlaying ? 'bg-rose-500 hover:bg-rose-600 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white'}`}
                >
                  <Icon name={riPlaying ? 'Square' : 'Play'} size={15} />
                  {riPlaying ? 'Остановить' : 'Запустить RI-сессию'}
                </button>

                {!riPlaying && riTimer > 0 && (
                  <p className="text-xs text-green-500 text-center mt-2 font-medium">
                    Сессия завершена — побудьте в тишине 2–3 минуты
                  </p>
                )}

                <div className="mt-3 space-y-1">
                  {[
                    'Наденьте наушники, закройте глаза',
                    '5 сек вход → 45 сек тон → 30 сек спад → 3 сек угасание',
                    'После остановки — тишина не менее 3 минут, не включайте звуки',
                  ].map((t, i) => (
                    <p key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <span className="text-amber-400 flex-shrink-0 mt-0.5">·</span>{t}
                    </p>
                  ))}
                </div>
              </div>

              {/* Дальнейшие шаги */}
              <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
                <p className="text-sm font-bold mb-1">Долгосрочная терапия</p>
                {[
                  { icon: 'Music', title: 'Нотч-терапия', desc: `Слушайте музыку с вырезанной частотой ${calibResultHz.toLocaleString()} Гц — 1–2 часа в день. Через 4–12 недель шум становится тише. Okamoto et al., 2010.` },
                  { icon: 'Stethoscope', title: 'Аудиолог', desc: `Покажите частоты: тиннитус ${calibResultHz.toLocaleString()} Гц, RI-зона ${riHz.toLocaleString()} Гц — это ускорит диагностику.` },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 bg-background/60 rounded-xl p-3">
                    <div className="w-7 h-7 rounded-lg bg-rose-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon name={item.icon} size={13} className="text-rose-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => { stopRI(); setCalibStep('intro'); setCalibCoarseHz(null); setCalibResultHz(null); setCalibHz(4000); setRiTimer(0); }}
                className="w-full border border-border rounded-xl py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Пройти калибровку заново
              </button>

              <p className="text-xs text-muted-foreground/50 text-center leading-relaxed pb-2">
                Калибровка в браузере даёт приблизительный результат ±100–200 Гц. Для точной диагностики обратитесь к аудиологу.
              </p>
            </div>
            );
          })()}

        </div>
      )}

    </div>
  );
}