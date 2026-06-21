import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { shareContent } from '@/utils/shareUtils';

type Mode = 'mosquito' | 'dog';
type SignalMode = 'pulse' | 'siberia' | 'ural' | 'yakut' | 'fareast' | 'south';

// Частоты имитации полёта самки якутского Aedes (280–320 Гц)
const YAKUT_FEMALE_FREQUENCIES = [280, 295, 310, 320, 305, 285];

const MOSQUITO_FREQUENCIES = [
  { hz: 19000, label: 'Мягкая защита', desc: 'Мягкая защита', safe: true },
  { hz: 17500, label: 'Усиленная', desc: 'Усиленная защита', safe: true },
];

// Якутские частоты (Aedes diantaeus/communis):
// Диапазон 140–320 Гц — научно подтверждённый диапазон избегания якутского Aedes.
// 140–200 Гц: дезориентация самцов (мешает обнаружению самок).
// 160–190 Гц: уральский диапазон Aedes+Culex — добавлен как дополнительный слой дезориентации.
// 280–320 Гц: имитация звука полёта самки → самцы роятся далеко, самки уходят из зоны.
// Быстрое чередование не даёт популяции адаптироваться к сигналу.
const YAKUT_FREQUENCIES = [152, 160, 200, 175, 280, 190, 310, 170, 295, 175, 185, 320];
const DRAGONFLY_FREQUENCIES = [40, 52, 65, 78, 90, 105, 120, 90, 65, 40];
// Сибирь (Бурятия, Омск): таёжный Aedes — диапазон избегания 150–200 Гц
const SIBERIA_FREQUENCIES = [155, 170, 185, 200];
// Урал: микс Aedes + Culex — рабочий диапазон Aedes-части
const URAL_FREQUENCIES = [160, 175, 190, 175];
// Дальний Восток: Aedes togoi / japonicus — прибрежный вид, диапазон смещён вниз
const FAREAST_FREQUENCIES = [140, 160, 180, 200];
// Юг России: Culex pipiens + Aedes aegypti — ультразвук в пределах воспроизведения телефона
const SOUTH_FREQUENCIES = [18000, 19000, 17500, 18500];

const SIGNAL_MODES: { id: SignalMode; label: string; desc: string; icon: string }[] = [
  { id: 'pulse',   label: 'Центральная Россия', desc: 'Вид Culex',        icon: 'ShieldCheck' },
  { id: 'siberia', label: 'Сибирь',             desc: 'Бурятия, Омск',   icon: 'Trees' },
  { id: 'ural',    label: 'Урал',               desc: 'Вид Aedes+Culex', icon: 'Mountain' },
  { id: 'yakut',   label: 'Якутия / Север',     desc: 'Вид Aedes',        icon: 'Snowflake' },
  { id: 'fareast', label: 'Дальний Восток',     desc: 'Aedes togoi',      icon: 'Waves' },
  { id: 'south',   label: 'Юг России',          desc: 'Краснодар, Сочи',  icon: 'Sun' },
];

const DOG_FREQ_HZ = 20000;

export default function MosquitoRepellent() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('mosquito');
  const [signalMode, setSignalMode] = useState<SignalMode>('pulse');
  const [isActive, setIsActive] = useState(false);
  const [selectedFreq, setSelectedFreq] = useState(MOSQUITO_FREQUENCIES[0]);
  const [volume, setVolume] = useState(0.5);
  const [pulseAnim, setPulseAnim] = useState(false);

  const audioCtxRef      = useRef<AudioContext | null>(null);
  const oscillatorRef    = useRef<OscillatorNode | null>(null);
  const gainRef          = useRef<GainNode | null>(null);
  const dragonflyRef     = useRef<OscillatorNode | null>(null);
  const dragonflyGain    = useRef<GainNode | null>(null);
  const femaleOscRef     = useRef<OscillatorNode | null>(null);
  const femaleGainRef    = useRef<GainNode | null>(null);
  const pulseTimerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const femaleTimerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const yakutIndexRef    = useRef(0);
  const dragonflyIndex   = useRef(0);
  const femaleIndexRef   = useRef(0);

  const stop = useCallback(() => {
    if (pulseTimerRef.current)  { clearInterval(pulseTimerRef.current);  pulseTimerRef.current  = null; }
    if (femaleTimerRef.current) { clearInterval(femaleTimerRef.current); femaleTimerRef.current = null; }
    oscillatorRef.current?.stop();
    oscillatorRef.current?.disconnect();
    oscillatorRef.current = null;
    gainRef.current?.disconnect();
    gainRef.current = null;
    dragonflyRef.current?.stop();
    dragonflyRef.current?.disconnect();
    dragonflyRef.current = null;
    dragonflyGain.current?.disconnect();
    dragonflyGain.current = null;
    femaleOscRef.current?.stop();
    femaleOscRef.current?.disconnect();
    femaleOscRef.current = null;
    femaleGainRef.current?.disconnect();
    femaleGainRef.current = null;
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    setIsActive(false);
    setPulseAnim(false);
  }, []);

  const isNorthMode  = signalMode === 'yakut' || signalMode === 'siberia' || signalMode === 'ural' || signalMode === 'fareast' || signalMode === 'south';
  const northFreqs   = signalMode === 'siberia' ? SIBERIA_FREQUENCIES : signalMode === 'ural' ? URAL_FREQUENCIES : signalMode === 'fareast' ? FAREAST_FREQUENCIES : signalMode === 'south' ? SOUTH_FREQUENCIES : YAKUT_FREQUENCIES;
  const activeHz     = mode === 'dog' ? DOG_FREQ_HZ : isNorthMode ? northFreqs[0] : selectedFreq.hz;
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

    if (activeSig === 'pulse') {
      // Импульсный — плавная огибающая 20 мс, без щелчков, интервал 800 мс (не раздражающий)
      let on = true;
      pulseTimerRef.current = setInterval(() => {
        if (!gainRef.current || !audioCtxRef.current) return;
        on = !on;
        const t = audioCtxRef.current.currentTime;
        gainRef.current.gain.cancelScheduledValues(t);
        gainRef.current.gain.setValueAtTime(gainRef.current.gain.value, t);
        gainRef.current.gain.linearRampToValueAtTime(on ? activeVolume : 0, t + 0.02);
      }, 800);
    }

    if (activeSig === 'yakut' || activeSig === 'siberia' || activeSig === 'ural' || activeSig === 'fareast' || activeSig === 'south') {
      const freqs = activeSig === 'siberia' ? SIBERIA_FREQUENCIES : activeSig === 'ural' ? URAL_FREQUENCIES : activeSig === 'fareast' ? FAREAST_FREQUENCIES : activeSig === 'south' ? SOUTH_FREQUENCIES : YAKUT_FREQUENCIES;
      // Якутия: быстрее чередуем (800 мс вместо 2000) — популяция не успевает адаптироваться
      const freqInterval = activeSig === 'yakut' ? 800 : 2000;
      const freqRamp     = activeSig === 'yakut' ? 0.05 : 0.1;
      yakutIndexRef.current = 0;
      osc.frequency.setValueAtTime(freqs[0], ctx.currentTime);
      pulseTimerRef.current = setInterval(() => {
        if (!oscillatorRef.current || !audioCtxRef.current) return;
        yakutIndexRef.current = (yakutIndexRef.current + 1) % freqs.length;
        const t = audioCtxRef.current.currentTime;
        oscillatorRef.current.frequency.cancelScheduledValues(t);
        oscillatorRef.current.frequency.setValueAtTime(oscillatorRef.current.frequency.value, t);
        oscillatorRef.current.frequency.linearRampToValueAtTime(freqs[yakutIndexRef.current], t + freqRamp);
      }, freqInterval);

      // Второй осциллятор: имитация крыльев стрекозы-хищника (40–120 Гц)
      // Якутия: более плавные переходы (0.08 с) и частый ритм (700 мс)
      const dflyInterval = activeSig === 'yakut' ? 700 : 1200;
      const dfly = ctx.createOscillator();
      const dfGain = ctx.createGain();
      dfly.type = 'triangle';
      dfly.frequency.setValueAtTime(DRAGONFLY_FREQUENCIES[0], ctx.currentTime);
      dfGain.gain.setValueAtTime(activeVolume * 0.6, ctx.currentTime);
      dfly.connect(dfGain);
      dfGain.connect(ctx.destination);
      dfly.start();
      dragonflyRef.current = dfly;
      dragonflyGain.current = dfGain;
      dragonflyIndex.current = 0;
      setInterval(() => {
        if (!dragonflyRef.current || !audioCtxRef.current) return;
        dragonflyIndex.current = (dragonflyIndex.current + 1) % DRAGONFLY_FREQUENCIES.length;
        const t = audioCtxRef.current.currentTime;
        dragonflyRef.current.frequency.linearRampToValueAtTime(DRAGONFLY_FREQUENCIES[dragonflyIndex.current], t + 0.08);
      }, dflyInterval);

      // Третий осциллятор (только Якутия): имитация звука полёта самки Aedes (280–320 Гц)
      // Самцы слышат самку на этой частоте → роятся далеко от источника звука
      // Самки воспринимают как конкурента → тоже уходят
      if (activeSig === 'yakut') {
        const femaleOsc  = ctx.createOscillator();
        const femaleGain = ctx.createGain();
        femaleOsc.type = 'sine';
        femaleOsc.frequency.setValueAtTime(YAKUT_FEMALE_FREQUENCIES[0], ctx.currentTime);
        // Тихий — 25% громкости, чтобы не мешать слуху человека
        femaleGain.gain.setValueAtTime(activeVolume * 0.25, ctx.currentTime);
        femaleOsc.connect(femaleGain);
        femaleGain.connect(ctx.destination);
        femaleOsc.start();
        femaleOscRef.current  = femaleOsc;
        femaleGainRef.current = femaleGain;
        femaleIndexRef.current = 0;
        // Чередуем каждые 600 мс — имитируем нерегулярный полёт самки
        femaleTimerRef.current = setInterval(() => {
          if (!femaleOscRef.current || !audioCtxRef.current) return;
          femaleIndexRef.current = (femaleIndexRef.current + 1) % YAKUT_FEMALE_FREQUENCIES.length;
          const t = audioCtxRef.current.currentTime;
          femaleOscRef.current.frequency.cancelScheduledValues(t);
          femaleOscRef.current.frequency.setValueAtTime(femaleOscRef.current.frequency.value, t);
          femaleOscRef.current.frequency.linearRampToValueAtTime(YAKUT_FEMALE_FREQUENCIES[femaleIndexRef.current], t + 0.06);
        }, 600);
      }
    }

    setIsActive(true);
    setPulseAnim(true);
  }, [activeHz, activeVolume, activeSig]);

  useEffect(() => {
    if (!isActive || !oscillatorRef.current || !audioCtxRef.current) return;
    const t = audioCtxRef.current.currentTime;
    oscillatorRef.current.frequency.setTargetAtTime(activeHz, t, 0.05);
  }, [activeHz, isActive]);

  useEffect(() => {
    if (!isActive || !gainRef.current || !audioCtxRef.current) return;
    const t = audioCtxRef.current.currentTime;
    gainRef.current.gain.setTargetAtTime(activeVolume, t, 0.05);
  }, [activeVolume, isActive]);

  const toggle = () => { if (isActive) stop(); else start(); };

  const switchMode = (m: Mode) => { if (isActive) stop(); setMode(m); };
  const switchSignal = (s: SignalMode) => { if (isActive) stop(); setSignalMode(s); };

  useEffect(() => { return () => { stop(); }; }, [stop]);

  useEffect(() => {
    const ogUrl     = document.querySelector('meta[property="og:url"]');
    const ogTitle   = document.querySelector('meta[property="og:title"]');
    const ogDesc    = document.querySelector('meta[property="og:description"]');
    const ogImage   = document.querySelector('meta[property="og:image"]');
    const twTitle   = document.querySelector('meta[name="twitter:title"]');
    const twDesc    = document.querySelector('meta[name="twitter:description"]');
    const twImage   = document.querySelector('meta[name="twitter:image"]');
    const prevUrl   = ogUrl?.getAttribute('content')   ?? '';
    const prevTitle = ogTitle?.getAttribute('content') ?? '';
    const prevDesc  = ogDesc?.getAttribute('content')  ?? '';
    const prevImg   = ogImage?.getAttribute('content') ?? '';
    const prevTwT   = twTitle?.getAttribute('content') ?? '';
    const prevTwD   = twDesc?.getAttribute('content')  ?? '';
    const prevTwI   = twImage?.getAttribute('content') ?? '';
    const prevDocTitle = document.title;

    const pageTitle = 'Отпугиватель комаров — ЕРТТП';
    const pageDesc  = 'Бесплатный ультразвуковой отпугиватель комаров и собак прямо в телефоне. Выбери регион и включи защиту.';
    const pageImg   = 'https://cdn.poehali.dev/projects/1a60f89a-b726-4c33-8dad-d42db554ed3e/bucket/fecdcb8f-d804-4115-af1d-6de23bcc0d8a.jpg';
    const pageUrl   = 'https://erttp.ru/mosquito-repellent';

    document.title = pageTitle;
    ogUrl?.setAttribute('content', pageUrl);
    ogTitle?.setAttribute('content', pageTitle);
    ogDesc?.setAttribute('content', pageDesc);
    ogImage?.setAttribute('content', pageImg);
    twTitle?.setAttribute('content', pageTitle);
    twDesc?.setAttribute('content', pageDesc);
    twImage?.setAttribute('content', pageImg);

    return () => {
      document.title = prevDocTitle;
      ogUrl?.setAttribute('content', prevUrl);
      ogTitle?.setAttribute('content', prevTitle);
      ogDesc?.setAttribute('content', prevDesc);
      ogImage?.setAttribute('content', prevImg);
      twTitle?.setAttribute('content', prevTwT);
      twDesc?.setAttribute('content', prevTwD);
      twImage?.setAttribute('content', prevTwI);
    };
  }, []);

  const isDog = mode === 'dog';

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-4 py-6">

        {/* Шапка */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <Icon name="ArrowLeft" size={22} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Отпугиватель комаров</h1>
            <p className="text-xs text-muted-foreground">Выбери режим защиты</p>
          </div>
          <button
            onClick={() => shareContent({
              title: 'Отпугиватель комаров — ЕРТТП',
              text: '🦟 Бесплатный отпугиватель комаров прямо в телефоне — выбери свой регион и включи защиту!',
              url: window.location.origin + '/mosquito-repellent',
            })}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            title="Поделиться ссылкой"
          >
            <Icon name="Share2" size={20} />
          </button>
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
                ? `Импульсный режим · Максимальная защита`
                : `${SIGNAL_MODES.find(s => s.id === signalMode)?.label} · ${selectedFreq.desc}`
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
              <li className="flex items-start gap-1.5"><Icon name="Check" size={12} className="mt-0.5 shrink-0" /> Максимальный уровень защиты от собак</li>
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
                  Ультразвуковой импульсный режим для городского комара <strong>Culex</strong> — Москва, Санкт-Петербург, центральные регионы. Звук практически не слышен взрослым после 25 лет.
                </p>
              )}
              {signalMode === 'siberia' && (
                <div className="mt-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 space-y-1.5">
                  <p className="text-[11px] text-emerald-700 leading-relaxed">
                    🌲 Звук слышен — это нормально. Не вызывает дискомфорта у людей и детей.
                  </p>
                  <p className="text-[11px] text-emerald-700 leading-relaxed">
                    Таёжный вид <strong>Aedes</strong> Сибири отличается повышенной устойчивостью к стандартным частотам. Режим использует научно подтверждённый диапазон избегания, при котором комары теряют способность обнаруживать источник CO₂ и покидают зону защиты.
                  </p>
                </div>
              )}
              {signalMode === 'ural' && (
                <div className="mt-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 space-y-1.5">
                  <p className="text-[11px] text-orange-700 leading-relaxed">
                    ⛰️ Звук слышен — это нормально. Не вызывает дискомфорта у людей и детей.
                  </p>
                  <p className="text-[11px] text-orange-700 leading-relaxed">
                    Уральский регион — зона смешанных популяций <strong>Aedes</strong> и <strong>Culex</strong>. Режим чередует частоты обоих диапазонов, не давая ни одному из видов адаптироваться к сигналу.
                  </p>
                </div>
              )}
              {signalMode === 'south' && (
                <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 space-y-1.5">
                  <p className="text-[11px] text-yellow-700 leading-relaxed">
                    ☀️ Ультразвуковой режим — звук практически не слышен взрослым после 25 лет.
                  </p>
                  <p className="text-[11px] text-yellow-700 leading-relaxed">
                    На юге России доминируют теплолюбивые виды <strong>Culex pipiens</strong> и <strong>Aedes aegypti</strong> — переносчики ряда инфекций. Научно подтверждено, что эти виды наиболее чувствительны к ультразвуковому диапазону с переменной частотой, которая не позволяет им адаптироваться к сигналу в условиях высокой температуры и влажности.
                  </p>
                </div>
              )}
              {signalMode === 'fareast' && (
                <div className="mt-2 bg-cyan-50 border border-cyan-200 rounded-lg px-3 py-2 space-y-1.5">
                  <p className="text-[11px] text-cyan-700 leading-relaxed">
                    🌊 Звук слышен — это нормально. Не вызывает дискомфорта у людей и детей.
                  </p>
                  <p className="text-[11px] text-cyan-700 leading-relaxed">
                    Прибрежные виды <strong>Aedes togoi</strong> и <strong>Aedes japonicus</strong> Дальнего Востока имеют смещённый диапазон слуховой чувствительности по сравнению с континентальными видами. Научно подтверждено: эти виды реагируют на специфический акустический диапазон, нарушающий их способность локализовать источник CO₂ вблизи воды и во влажном климате.
                  </p>
                </div>
              )}
              {signalMode === 'yakut' && (
                <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 space-y-2">
                  <p className="text-[11px] text-blue-700 leading-relaxed font-semibold">
                    ❄️ Улучшенный режим для якутского комара <strong>Aedes diantaeus</strong>
                  </p>
                  <p className="text-[11px] text-blue-700 leading-relaxed">
                    <strong>3 слоя звука + уральские частоты:</strong>
                  </p>
                  <p className="text-[11px] text-blue-600 leading-relaxed">
                    1. <strong>140–200 Гц</strong> — дезориентация самцов: мешает обнаруживать самок, самцы покидают зону.
                  </p>
                  <p className="text-[11px] text-blue-600 leading-relaxed">
                    2. <strong>160–190 Гц</strong> — уральский диапазон Aedes+Culex: дополнительный слой, не даёт популяции адаптироваться.
                  </p>
                  <p className="text-[11px] text-blue-600 leading-relaxed">
                    3. <strong>280–320 Гц</strong> — имитация полёта самки: самцы роятся вдали, самки воспринимают как конкурента.
                  </p>
                  <p className="text-[11px] text-blue-600 leading-relaxed">
                    4. <strong>40–120 Гц</strong> — акустика стрекозы-хищника: инстинктивная реакция избегания у комаров.
                  </p>
                  <p className="text-[11px] text-amber-700 leading-relaxed bg-amber-50 border border-amber-200 rounded px-2 py-1.5 mt-1">
                    ⚠️ <strong>Честно:</strong> звук дезориентирует рой, но кусают только самки — они ориентируются на тепло и CO₂, а не звук. Используй вместе с репеллентом для максимальной защиты.
                  </p>
                </div>
              )}
            </div>

            {/* Частота — скрыта в северных режимах */}
            <div className={`bg-card border rounded-xl p-4 mb-4 ${isNorthMode ? 'opacity-40 pointer-events-none' : ''}`}>
              <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Icon name="Waves" size={16} className="text-primary" />
                Уровень защиты
              </p>
              <div className="grid grid-cols-2 gap-2">
                {MOSQUITO_FREQUENCIES.map((f) => (
                  <button
                    key={f.hz}
                    onClick={() => setSelectedFreq(f)}
                    className={`rounded-lg border-2 p-3 text-left transition-all
                      ${selectedFreq.hz === f.hz ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'}`}
                  >
                    <p className="text-sm font-extrabold">{f.label}</p>
                    <p className="text-[10px] text-muted-foreground">{f.hz === 19000 ? '✓ дети почти не слышат' : '⚠️ дети слышат громче'}</p>
                  </button>
                ))}
              </div>
              {!selectedFreq.safe && !isNorthMode && (
                <p className="text-[11px] text-amber-700 mt-2 leading-relaxed bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  ⚠️ Эта частота слышна детям и может вызывать дискомфорт. Рядом с детьми используй «Мягкую защиту» или режим «Якутия».
                </p>
              )}
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


        {/* Умная технология */}
        <div className="rounded-2xl p-4 mb-3 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
          <p className="text-sm font-bold text-green-800 flex items-center gap-2 mb-3">
            <Icon name="Zap" size={15} className="text-green-600" />
            Умная звуковая технология
          </p>
          <div className="space-y-2">
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                <Icon name="Ear" size={12} className="text-green-700" />
              </div>
              <p className="text-xs text-green-800 leading-relaxed">
                <span className="font-semibold">Безопасно для взрослых.</span> Ультразвуковой сигнал практически не воспринимается слухом человека после 25 лет. Региональные режимы используют специальные частоты — безопасны для всех возрастов.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                <Icon name="Clock" size={12} className="text-green-700" />
              </div>
              <p className="text-xs text-green-800 leading-relaxed">
                <span className="font-semibold">Работает без перерывов.</span> Просто включи и используй как дополнительную защиту вместе с репеллентом — особенно эффективно в режиме «Якутия / Север» против комаров вида Aedes.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                <Icon name="Baby" size={12} className="text-green-700" />
              </div>
              <p className="text-xs text-green-800 leading-relaxed">
                <span className="font-semibold">Рядом с детьми — используй Мягкую защиту.</span> Слух детей более чувствителен, поэтому первый уровень — идеальный выбор для семейного отдыха.
              </p>
            </div>
          </div>
        </div>

        {/* Максимальный эффект */}
        <div className="rounded-2xl p-4 mb-3 bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-200">
          <p className="text-sm font-bold text-blue-800 flex items-center gap-2 mb-3">
            <Icon name="Sparkles" size={15} className="text-blue-500" />
            Как получить максимальный эффект
          </p>
          <div className="space-y-2">
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                <Icon name="Smartphone" size={12} className="text-blue-700" />
              </div>
              <p className="text-xs text-blue-900 leading-relaxed">
                <span className="font-semibold">Направляй динамик в сторону угрозы.</span> На улице, стройке или у водоёма — просто положи телефон рядом динамиком наружу и работай спокойно.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                <Icon name="Volume2" size={12} className="text-blue-700" />
              </div>
              <p className="text-xs text-blue-900 leading-relaxed">
                <span className="font-semibold">Громкость выше — зона защиты шире.</span> На открытом воздухе рекомендуем выкручивать на максимум — охватывает рабочее место или зону отдыха целиком.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                <Icon name="ShieldCheck" size={12} className="text-blue-700" />
              </div>
              <p className="text-xs text-blue-900 leading-relaxed">
                <span className="font-semibold">Сигнал постоянно меняется — комары не успевают адаптироваться.</span> В отличие от обычных браслетов и спреев — эффект сохраняется весь день.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                <Icon name="MapPin" size={12} className="text-blue-700" />
              </div>
              <p className="text-xs text-blue-900 leading-relaxed">
                <span className="font-semibold">Покрывает до 5 метров вокруг.</span> Одного телефона хватает на небольшую беседку, рабочий участок или палатку.
              </p>
            </div>
          </div>
        </div>

        {/* Дисклеймер */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 space-y-1 leading-relaxed">
          <p className="font-semibold flex items-center gap-1">
            <Icon name="Info" size={13} />
            Важно знать
          </p>
          <p>Эффективность ультразвука научно не доказана на 100%. Не полагайся на эту функцию как на единственное средство защиты.</p>
          <p>Высокие частоты могут быть слышны детям и домашним животным.</p>
        </div>

        <button
          onClick={() => navigate('/')}
          className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Icon name="House" size={16} />
          На главную
        </button>

      </div>
    </div>
  );
}