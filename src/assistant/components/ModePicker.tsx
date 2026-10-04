import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { AssistantMode, AssistantUser, MODE_INFO, saveProfile } from '../utils/assistantApi';

interface ModePickerProps {
  user: AssistantUser;
  onDone: (user: AssistantUser) => void;
  onCancel?: () => void;
}

export default function ModePicker({ user, onDone, onCancel }: ModePickerProps) {
  const { toast } = useToast();
  const [modes, setModes] = useState<AssistantMode[]>(user.modes);
  const [about, setAbout] = useState(user.about);
  const [saving, setSaving] = useState(false);

  const toggle = (mode: AssistantMode) => {
    setModes((prev) => (prev.includes(mode) ? prev.filter((m) => m !== mode) : [...prev, mode]));
  };

  const handleSave = async () => {
    if (modes.length === 0) {
      toast({ variant: 'destructive', title: 'Выберите хотя бы одно', description: 'Это можно будет поменять потом' });
      return;
    }
    setSaving(true);
    try {
      onDone(await saveProfile(modes, about.trim()));
    } catch (error) {
      toast({ variant: 'destructive', title: 'Не получилось сохранить', description: error instanceof Error ? error.message : '' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-xl p-4">
      <h2 className="text-2xl font-bold text-slate-800">С чем вам помочь, {user.name}?</h2>
      <p className="mt-1 text-slate-600">Отметьте всё, что подходит. Это можно поменять в любой момент.</p>

      <div className="mt-5 grid gap-3">
        {(Object.keys(MODE_INFO) as AssistantMode[]).map((mode) => {
          const info = MODE_INFO[mode];
          const active = modes.includes(mode);
          return (
            <button
              key={mode}
              type="button"
              onClick={() => toggle(mode)}
              className={`flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-colors ${
                active ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white hover:border-emerald-300'
              }`}
            >
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${active ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                <Icon name={info.icon} size={24} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-800">{info.title}</p>
                <p className="text-sm text-slate-500">{info.hint}</p>
              </div>
              {active && <Icon name="CheckCircle2" size={24} className="text-emerald-600" />}
            </button>
          );
        })}
      </div>

      <div className="mt-5">
        <label htmlFor="about" className="mb-2 block text-sm font-medium text-slate-700">
          Хотите рассказать о себе? (необязательно)
        </label>
        <Textarea
          id="about"
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Например: готовлю на семью из четырёх человек, у сына аллергия на орехи"
          className="text-base"
        />
        <p className="mt-1 text-xs text-slate-500">Так советы будут точнее. Не пишите пароли и данные карт.</p>
      </div>

      <div className="mt-6 flex gap-3">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="h-12 flex-1 bg-emerald-600 text-base font-semibold text-white hover:bg-emerald-700"
        >
          {saving ? <Icon name="Loader2" size={18} className="mr-2 animate-spin" /> : null}
          Готово
        </Button>
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={saving} className="h-12 border-slate-300 text-slate-700">
            Отмена
          </Button>
        )}
      </div>
    </div>
  );
}
