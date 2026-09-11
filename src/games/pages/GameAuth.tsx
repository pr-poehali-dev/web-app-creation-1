import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { registerGameUser, loginGameUser, getGameSession } from '../utils/gameAuth';

export default function GameAuth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [nickname, setNickname] = useState('');
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (getGameSession()) {
    navigate('/games');
    return null;
  }

  const handlePinChange = (value: string, setter: (v: string) => void) => {
    const digitsOnly = value.replace(/\D/g, '').slice(0, 6);
    setter(digitsOnly);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (nickname.trim().length < 3) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Никнейм должен быть от 3 символов' });
      return;
    }
    if (pin.length < 4) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'PIN-код должен содержать 4-6 цифр' });
      return;
    }
    if (mode === 'register' && pin !== pinConfirm) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'PIN-коды не совпадают' });
      return;
    }

    setIsLoading(true);
    const result = mode === 'register'
      ? await registerGameUser(nickname.trim(), pin)
      : await loginGameUser(nickname.trim(), pin);
    setIsLoading(false);

    if (result.success) {
      toast({ title: 'Добро пожаловать!', description: `Привет, ${result.user?.nickname}!` });
      navigate('/games');
    } else {
      toast({ variant: 'destructive', title: 'Ошибка', description: result.error });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <button
          onClick={() => navigate('/')}
          className="mb-6 flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <Icon name="ArrowLeft" size={16} />
          На главную ЕРТТП
        </button>

        <div className="bg-slate-900/70 backdrop-blur-xl border border-amber-500/20 rounded-2xl shadow-2xl shadow-amber-500/5 p-8">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/40">
              <Icon name="Spade" size={32} className="text-slate-950" />
            </div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-wide">ИГРОВОЙ КЛУБ</h1>
            <p className="text-slate-400 text-sm mt-1">Шахматы · Шашки · Покер</p>
          </div>

          <div className="flex gap-2 mb-6 bg-slate-800/60 rounded-lg p-1">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 rounded-md text-sm font-semibold transition-colors ${
                mode === 'login' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Вход
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-2 rounded-md text-sm font-semibold transition-colors ${
                mode === 'register' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Регистрация
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="nickname" className="text-slate-300">Никнейм</Label>
              <Input
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Ваш игровой ник"
                className="bg-slate-800/60 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-amber-500"
                maxLength={20}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pin" className="text-slate-300">PIN-код</Label>
              <div className="relative">
                <Input
                  id="pin"
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  value={pin}
                  onChange={(e) => handlePinChange(e.target.value, setPin)}
                  placeholder="4-6 цифр"
                  className="bg-slate-800/60 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-amber-500 pr-10 tracking-[0.3em]"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  tabIndex={-1}
                >
                  <Icon name={showPin ? 'EyeOff' : 'Eye'} size={16} />
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div className="space-y-1.5">
                <Label htmlFor="pinConfirm" className="text-slate-300">Повторите PIN-код</Label>
                <Input
                  id="pinConfirm"
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  value={pinConfirm}
                  onChange={(e) => handlePinChange(e.target.value, setPinConfirm)}
                  placeholder="4-6 цифр"
                  className="bg-slate-800/60 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-amber-500 tracking-[0.3em]"
                />
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 font-bold shadow-lg shadow-amber-500/30"
            >
              {isLoading ? (
                <>
                  <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                  Подождите...
                </>
              ) : mode === 'login' ? 'Войти' : 'Создать аккаунт'}
            </Button>
          </form>

          <p className="text-center text-xs text-slate-500 mt-6">
            Игра на виртуальные фишки. Реальные деньги не используются.
          </p>
        </div>
      </div>
    </div>
  );
}
