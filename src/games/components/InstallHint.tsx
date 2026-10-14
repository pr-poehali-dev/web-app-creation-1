import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useInstallApp } from '@/hooks/useInstallApp';
import { getGameSession } from '../utils/gameAuth';

const DISMISS_KEY = 'game_install_hint_dismissed_at';
const DISMISS_DAYS = 7;

const wasDismissedRecently = () => {
  const raw = localStorage.getItem(DISMISS_KEY);
  return !!raw && Date.now() - Number(raw) < DISMISS_DAYS * 24 * 60 * 60 * 1000;
};

const YANDEX_STEPS: Step[] = [
  { icon: 'Globe', title: 'Откройте клуб в Яндекс Браузере', text: 'Если клуб открыт в другом браузере, скопируйте ссылку и откройте её в Яндекс Браузере.' },
  { icon: 'EllipsisVertical', title: 'Нажмите на три точки внизу справа', text: 'Откроется меню с действиями для страницы.' },
  { icon: 'SquarePlus', title: 'Нажмите «Добавить ярлык на телефон»', text: 'Пункт в меню ниже «Добавить на Табло». Если его не видно, пролистайте меню вниз.' },
  { icon: 'Check', title: 'Подтвердите добавление', text: 'Значок клуба появится на главном экране телефона.' },
];

interface Step {
  icon: string;
  title: string;
  text: string;
}

const IPHONE_STEPS: Step[] = [
  { icon: 'Compass', title: 'Откройте клуб в Safari', text: 'Это синий значок компаса. В других браузерах пункта «На экран Домой» может не быть.' },
  { icon: 'Share', title: 'Нажмите «Поделиться»', text: 'Квадрат со стрелкой вверх. Он внизу экрана посередине.' },
  { icon: 'SquarePlus', title: 'Выберите «На экран Домой»', text: 'Листайте список вниз, пока не увидите квадрат с плюсом.' },
  { icon: 'Check', title: 'Нажмите «Добавить»', text: 'Кнопка справа вверху. Значок клуба появится на главном экране.' },
];

const ANDROID_STEPS: Step[] = [
  { icon: 'Chrome', title: 'Откройте клуб в Chrome', text: 'Это круглый значок красного, жёлтого и зелёного цвета.' },
  { icon: 'EllipsisVertical', title: 'Нажмите три точки', text: 'Они в правом верхнем углу экрана.' },
  { icon: 'SmartphoneNfc', title: 'Выберите «Установить приложение»', text: 'Или «Добавить на главный экран», название зависит от телефона.' },
  { icon: 'Check', title: 'Подтвердите', text: 'Нажмите «Установить» или «Добавить». Значок клуба появится среди приложений.' },
];

function Steps({ steps }: { steps: Step[] }) {
  return (
    <ol className="space-y-3">
      {steps.map((s, i) => (
        <li key={s.title} className="flex gap-3 rounded-xl bg-slate-800/60 border border-slate-700 p-3">
          <div className="relative shrink-0">
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <Icon name={s.icon} size={28} className="text-slate-950" fallback="Smartphone" />
            </div>
            <span className="absolute -top-2 -left-2 h-6 w-6 rounded-full bg-slate-950 border border-amber-400 text-amber-400 text-xs font-bold flex items-center justify-center">
              {i + 1}
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-100">{s.title}</p>
            <p className="text-sm text-slate-400">{s.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function InstallHint({ guest = false }: { guest?: boolean }) {
  const { install, isIOS, isInstalled } = useInstallApp();
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<'iphone' | 'android' | 'yandex'>(isIOS ? 'iphone' : 'android');

  useEffect(() => {
    if ((!guest && !getGameSession()) || isInstalled || wasDismissedRecently()) return;
    setVisible(true);
  }, [isInstalled, guest]);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  const handleClick = async () => {
    const result = await install();
    if (result === 'installed' || result === 'already') {
      setVisible(false);
      return;
    }
    if (result !== 'dismissed') setOpen(true);
  };

  if (!visible && !open && guest) return null;

  return (
    <>
      {!visible && !guest && !isInstalled && (
        <button
          onClick={() => setOpen(true)}
          className="mb-4 flex items-center gap-2 text-sm text-amber-400 underline underline-offset-4 hover:text-amber-300"
        >
          <Icon name="Smartphone" size={16} />
          Как добавить клуб на главный экран
        </button>
      )}

      {visible && (
        <div className={`${guest ? 'mt-4' : 'mb-4'} flex items-center gap-3 rounded-xl border border-amber-500/30 bg-slate-900/70 p-3`}>
          <div className="h-10 w-10 shrink-0 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
            <Icon name="Smartphone" size={20} className="text-slate-950" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-100">Добавьте клуб на главный экран</p>
            <p className="text-xs text-slate-400">Открывается в одно касание, вход сохраняется надёжнее.</p>
          </div>
          <Button onClick={handleClick} size="sm" className="bg-amber-500 font-semibold text-slate-950 hover:bg-amber-600">
            Как?
          </Button>
          <button onClick={dismiss} className="text-slate-500 hover:text-slate-300" title="Скрыть">
            <Icon name="X" size={18} />
          </button>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto bg-slate-900 border-amber-500/30 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-amber-400">Значок клуба на главном экране</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2 rounded-lg bg-slate-800/60 p-1">
            {(['iphone', 'android', 'yandex'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPlatform(p)}
                className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${
                  platform === p ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {p === 'iphone' ? 'iPhone' : p === 'android' ? 'Android' : 'Яндекс'}
              </button>
            ))}
          </div>
          <Steps steps={platform === 'iphone' ? IPHONE_STEPS : platform === 'android' ? ANDROID_STEPS : YANDEX_STEPS} />
        </DialogContent>
      </Dialog>
    </>
  );
}