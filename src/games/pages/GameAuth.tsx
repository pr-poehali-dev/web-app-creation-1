import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { registerGameUser, loginGameUser, getGameSession } from '../utils/gameAuth';
import GamesPWAMeta from '../components/GamesPWAMeta';

export default function GameAuth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [nickname, setNickname] = useState('');
  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const redirectAfterAuth = () => {
    const pendingInvite = localStorage.getItem('pending_game_invite');
    if (pendingInvite) {
      localStorage.removeItem('pending_game_invite');
      navigate(`/games/invite/${pendingInvite}`);
    } else {
      navigate('/games');
    }
  };

  if (getGameSession()) {
    redirectAfterAuth();
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (nickname.trim().length < 3) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Никнейм должен быть от 3 символов' });
      return;
    }

    if (!/^\d{4}$/.test(pin)) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Пароль должен состоять из 4 цифр' });
      return;
    }
    if (mode === 'register' && pin !== pin2) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Пароли не совпадают' });
      return;
    }

    setIsLoading(true);
    const result = mode === 'register'
      ? await registerGameUser(nickname.trim(), pin)
      : await loginGameUser(nickname.trim(), pin);
    setIsLoading(false);

    if (result.success) {
      toast({
        title: 'Добро пожаловать!',
        description: result.pin_created ? `Привет, ${result.user?.nickname}! Пароль сохранён, запомните его` : `Привет, ${result.user?.nickname}!`,
      });
      redirectAfterAuth();
    } else {
      toast({ variant: 'destructive', title: 'Ошибка', description: result.error });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950 flex items-center justify-center p-4">
      <GamesPWAMeta />
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
            <p className="text-slate-400 text-sm mt-1">Шахматы · Шашки · Покер · Дурак · Баарыс</p>
          </div>

          <div className="flex gap-2 mb-6 bg-slate-800/60 rounded-lg p-1">
            <button
              onClick={() => { setMode('login'); setPin(''); setPin2(''); }}
              className={`flex-1 py-2 rounded-md text-sm font-semibold transition-colors ${
                mode === 'login' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Вход
            </button>
            <button
              onClick={() => { setMode('register'); setPin(''); setPin2(''); }}
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
              <Label htmlFor="pin" className="text-slate-300">{mode === 'register' ? 'Придумайте пароль (4 цифры)' : 'Пароль (4 цифры)'}</Label>
              <Input
                id="pin"
                type="password"
                inputMode="numeric"
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="••••"
                className="bg-slate-800/60 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-amber-500 tracking-[0.5em]"
                maxLength={4}
              />
            </div>

            {mode === 'register' && (
              <div className="space-y-1.5">
                <Label htmlFor="pin2" className="text-slate-300">Повторите пароль</Label>
                <Input
                  id="pin2"
                  type="password"
                  inputMode="numeric"
                  autoComplete="new-password"
                  value={pin2}
                  onChange={(e) => setPin2(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="••••"
                  className="bg-slate-800/60 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-amber-500 tracking-[0.5em]"
                  maxLength={4}
                />
              </div>
            )}

            {mode === 'login' && (
              <p className="text-xs text-slate-500">
                Играли раньше без пароля? Войдите со своим ником и придумайте пароль: он сохранится.
              </p>
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