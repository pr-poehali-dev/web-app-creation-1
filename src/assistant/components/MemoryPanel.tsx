import { useCallback, useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { MemoryFact, addMemory, deleteMemory, loadMemory } from '../utils/assistantApi';

interface MemoryPanelProps {
  refreshKey: number;
  onDeleteAccount: () => void;
}

export default function MemoryPanel({ refreshKey, onDeleteAccount }: MemoryPanelProps) {
  const { toast } = useToast();
  const [facts, setFacts] = useState<MemoryFact[]>([]);
  const [text, setText] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setFacts(await loadMemory());
    } catch {
      toast({ variant: 'destructive', title: 'Не удалось загрузить' });
    } finally {
      setLoaded(true);
    }
  }, [toast]);

  useEffect(() => {
    refresh();
  }, [refresh, refreshKey]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim().length < 3) return;
    try {
      await addMemory(text.trim());
      setText('');
      await refresh();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Не получилось', description: error instanceof Error ? error.message : '' });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMemory(id);
      await refresh();
    } catch {
      toast({ variant: 'destructive', title: 'Не получилось удалить' });
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-slate-700">
        <p className="font-semibold text-slate-800">Что я помню о вас</p>
        <p className="mt-1 text-sm">
          Только то, что вы сами рассказали. Это помогает давать точные советы. Любую запись можно удалить.
        </p>
      </div>

      <form onSubmit={handleAdd} className="flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={300}
          placeholder="Например: не ем острое"
          className="h-12 text-base"
        />
        <Button
          type="submit"
          disabled={text.trim().length < 3}
          className="h-12 bg-emerald-600 px-5 text-white hover:bg-emerald-700"
          aria-label="Запомнить"
        >
          <Icon name="Plus" size={20} />
        </Button>
      </form>

      {loaded && facts.length === 0 && (
        <p className="py-4 text-center text-slate-500">Пока ничего не запомнено.</p>
      )}

      <ul className="space-y-2">
        {facts.map((f) => (
          <li key={f.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3">
            <Icon name="Bookmark" size={18} className="shrink-0 text-emerald-600" />
            <p className="min-w-0 flex-1 break-words text-base text-slate-800">{f.fact}</p>
            <button
              type="button"
              onClick={() => handleDelete(f.id)}
              aria-label="Забыть"
              className="shrink-0 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-red-600"
            >
              <Icon name="X" size={18} />
            </button>
          </li>
        ))}
      </ul>

      <div className="border-t border-slate-200 pt-4">
        {!confirmDelete ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="text-sm text-slate-500 underline hover:text-red-600"
          >
            Удалить мой профиль и все данные
          </button>
        ) : (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-slate-700">Профиль, переписка, дела и всё, что я помню, будут удалены насовсем.</p>
            <div className="mt-3 flex gap-2">
              <Button onClick={onDeleteAccount} className="bg-red-600 text-white hover:bg-red-700">
                Да, удалить всё
              </Button>
              <Button variant="outline" onClick={() => setConfirmDelete(false)} className="border-slate-300 text-slate-700">
                Нет, оставить
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
