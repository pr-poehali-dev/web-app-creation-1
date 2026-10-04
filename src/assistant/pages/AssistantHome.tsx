import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import ChatPanel from '../components/ChatPanel';
import TasksPanel from '../components/TasksPanel';
import MemoryPanel from '../components/MemoryPanel';
import ModePicker from '../components/ModePicker';
import {
  AssistantUser,
  clearAssistantSession,
  deleteAccount,
  getAssistantUser,
  getAssistantToken,
} from '../utils/assistantApi';

type Tab = 'chat' | 'tasks' | 'memory';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'chat', label: 'Чат', icon: 'MessageCircle' },
  { id: 'tasks', label: 'Мои дела', icon: 'ListChecks' },
  { id: 'memory', label: 'Что я помню', icon: 'Bookmark' },
];

export default function AssistantHome() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<AssistantUser | null>(getAssistantUser());
  const [tab, setTab] = useState<Tab>('chat');
  const [editingModes, setEditingModes] = useState(false);
  const [memoryKey, setMemoryKey] = useState(0);

  useEffect(() => {
    if (!user || !getAssistantToken()) {
      navigate('/assistant/auth', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const onChange = () => {
      const current = getAssistantUser();
      setUser(current);
      if (!current) navigate('/assistant/auth', { replace: true });
    };
    window.addEventListener('assistantSessionChanged', onChange);
    return () => window.removeEventListener('assistantSessionChanged', onChange);
  }, [navigate]);

  useEffect(() => {
    const prev = document.title;
    document.title = 'Ассистент на каждый день';
    return () => {
      document.title = prev;
    };
  }, []);

  if (!user) return null;

  const handleLogout = () => {
    clearAssistantSession();
    navigate('/assistant/auth', { replace: true });
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
      navigate('/assistant/auth', { replace: true });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Не удалось удалить', description: error instanceof Error ? error.message : '' });
    }
  };

  const needsModes = user.modes.length === 0 || editingModes;

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-emerald-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500">
              <Icon name="HeartHandshake" size={20} className="text-white" />
            </div>
            <span className="text-lg font-bold text-slate-800">Ассистент</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setEditingModes(true)}
              className="rounded-full px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
            >
              {user.name}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Выйти"
              className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            >
              <Icon name="LogOut" size={18} />
            </button>
          </div>
        </div>
      </header>

      {needsModes ? (
        <ModePicker
          user={user}
          onDone={(updated) => {
            setUser(updated);
            setEditingModes(false);
          }}
          onCancel={user.modes.length > 0 ? () => setEditingModes(false) : undefined}
        />
      ) : (
        <main className="mx-auto max-w-3xl px-4 pt-3 pb-4">
          <nav className="mb-3 grid grid-cols-3 gap-1 rounded-2xl bg-slate-100 p-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-medium transition-colors ${
                  tab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon name={t.icon} size={16} />
                <span>{t.label}</span>
              </button>
            ))}
          </nav>

          {tab === 'chat' && <ChatPanel user={user} onMemoryChanged={() => setMemoryKey((k) => k + 1)} />}
          {tab === 'tasks' && <TasksPanel />}
          {tab === 'memory' && <MemoryPanel refreshKey={memoryKey} onDeleteAccount={handleDeleteAccount} />}
        </main>
      )}
    </div>
  );
}
