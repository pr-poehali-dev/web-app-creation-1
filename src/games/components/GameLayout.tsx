import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { GameUser, clearGameSession } from '../utils/gameAuth';
import GamesPWAMeta from './GamesPWAMeta';

interface GameLayoutProps {
  user: GameUser | null;
  onLogout?: () => void;
  children: ReactNode;
}

export default function GameLayout({ user, onLogout, children }: GameLayoutProps) {
  const handleLogout = () => {
    clearGameSession();
    onLogout?.();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950 text-slate-100">
      <GamesPWAMeta />
      <header className="border-b border-amber-500/20 bg-slate-950/60 backdrop-blur-md sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/games" className="flex items-center gap-2 group">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:scale-105 transition-transform">
              <Icon name="Spade" size={20} className="text-slate-950" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-amber-400 tracking-wide">ИГРОВОЙ КЛУБ</span>
              <span className="text-[10px] text-slate-400">ЕРТТП Games</span>
            </div>
          </Link>

          {user && (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 bg-slate-800/60 border border-amber-500/20 rounded-full px-3 py-1.5">
                <Icon name="Coins" size={16} className="text-amber-400" />
                <span className="text-sm font-semibold text-amber-300">{user.chips_balance}</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700 rounded-full px-3 py-1.5">
                <span>{user.avatar_emoji}</span>
                <span className="text-sm font-medium">{user.nickname}</span>
              </div>
              <button
                onClick={handleLogout}
                className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors"
                title="Выйти"
              >
                <Icon name="LogOut" size={18} />
              </button>
            </div>
          )}
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}