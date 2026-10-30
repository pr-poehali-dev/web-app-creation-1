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

const SUGGESTIONS = [
  'Не ем острое',
  'Живу в городе',
  'Есть дети или внуки',
  'Есть давление',
  'Держу кошку или собаку',
  'Езжу на машине',
  'Есть дача или огород',
  'Люблю готовить',
];

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

  const save = async (value: string) => {
    if (value.trim().length < 3) return;
    try {
      await addMemory(value.trim());
      setText('');
      await refresh();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Не получилось', description: error instanceof Error ? error.message : '' });
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    save(text);
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
          Это ваша записная книжка для помощника. Напишите, что важно знать о вас, и он будет учитывать это в каждом ответе.
        </p>
        <ol className="mt-2 list-decimal space-y-0.5 pl-5 text-sm">
          <li>Выберите подсказку ниже или напишите свой факт.</li>
          <li>Нажмите «Запомнить».</li>
          <li>Ненужное удалите крестиком.</li>
        </ol>
        <p className="mt-2 text-sm text-slate-600">Также можно просто рассказать о себе в чате: помощник запомнит сам.</p>
      </div>

      <form onSubmit={handleAdd} className="flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={300}
          placeholder="Или напишите своё, например: не ем острое"
          className="h-12 min-w-0 flex-1 text-base"
        />
        <Button
          type="submit"
          disabled={text.trim().length < 3}
          className="h-12 shrink-0 bg-emerald-600 px-4 text-white hover:bg-emerald-700"
          aria-label="Запомнить"
        >
          <Icon name="Plus" size={18} className="mr-1" />
          Запомнить
        </Button>
      </form>

      <div>
        <p className="mb-2 text-sm font-medium text-slate-600">Нажмите, чтобы добавить:</p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.filter((x) => !facts.some((f) => f.fact.toLowerCase() === x.toLowerCase())).map((x) => (
            <button
              key={x}
              type="button"
              onClick={() => save(x)}
              className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:border-emerald-500 hover:text-emerald-700"
            >
              + {x}
            </button>
          ))}
        </div>
      </div>

      {loaded && facts.length === 0 && (
        <p className="py-4 text-center text-slate-500">Пока записей нет. Выберите подсказку выше или напишите свою.</p>
      )}

      <ul className="space-y-2">
        {facts.map((f) => (
          <li key={f.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3">
            <Icon name="Bookmark" size={18} className="shrink-0 text-emerald-600" />
            <p className="min-w-0 flex-1 break-words text-base text-slate-800">{f.fact}</p>
            <button
              type="button"
              onClick={() => handleDelete(f.id)}
              aria-label="Удалить запись" title="Удалить запись"
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