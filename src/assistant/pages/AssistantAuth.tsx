import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getAssistantUser, login, register } from '../utils/assistantApi';

export default function AssistantAuth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  if (getAssistantUser()) {
    navigate('/assistant', { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      toast({ variant: 'destructive', title: 'Как к вам обращаться?', description: 'Имя должно быть от 2 букв. Подойдёт любое, даже придуманное' });
      return;
    }
    if (pin.length < 4) {
      toast({ variant: 'destructive', title: 'Нужен PIN-код', description: 'Введите от 4 до 6 цифр' });
      return;
    }
    setLoading(true);
    try {
      if (mode === 'register') {
        await register(name.trim(), pin);
        navigate('/assistant', { replace: true });
      } else {
        await login(name.trim(), pin);
        navigate('/assistant', { replace: true });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Не получилось',
        description: error instanceof Error ? error.message : 'Попробуйте ещё раз',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500 shadow-lg shadow-emerald-500/30">
            <Icon name="HeartHandshake" size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800">Помощник</h1>
          <p className="mt-2 text-slate-600">Спокойный помощник на каждый день: подскажет, напомнит и поможет с текстами</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-lg border border-slate-100">
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 mb-6">
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`rounded-lg py-2 text-sm font-medium transition-colors ${mode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            >
              Я здесь впервые
            </button>
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`rounded-lg py-2 text-sm font-medium transition-colors ${mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            >
              Уже заходил
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="assistant-name" className="text-slate-700">Как вас называть?</Label>
              <Input
                id="assistant-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Например: Анна"
                maxLength={30}
                autoComplete="off"
                className="h-12 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assistant-pin" className="text-slate-700">
                {mode === 'register' ? 'Придумайте PIN-код (4–6 цифр)' : 'Ваш PIN-код'}
              </Label>
              <Input
                id="assistant-pin"
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="••••"
                autoComplete="off"
                className="h-12 text-base tracking-widest"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="h-12 w-full bg-emerald-600 text-base font-semibold text-white hover:bg-emerald-700"
            >
              {loading ? <Icon name="Loader2" size={18} className="mr-2 animate-spin" /> : null}
              {mode === 'register' ? 'Начать' : 'Войти'}
            </Button>
          </form>

          <ul className="mt-6 space-y-2 text-sm text-slate-500">
            <li className="flex items-start gap-2">
              <Icon name="Check" size={16} className="mt-0.5 shrink-0 text-emerald-600" />
              Не нужны почта, телефон и фамилия
            </li>
            <li className="flex items-start gap-2">
              <Icon name="Check" size={16} className="mt-0.5 shrink-0 text-emerald-600" />
              Помощник помнит только то, что вы сами ему рассказали
            </li>
            <li className="flex items-start gap-2">
              <Icon name="Check" size={16} className="mt-0.5 shrink-0 text-emerald-600" />
              Всё можно посмотреть и удалить в любой момент
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
