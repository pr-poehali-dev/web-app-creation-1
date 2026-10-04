import { useCallback, useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { AssistantTask, addTask, deleteTask, loadTasks, toggleTask } from '../utils/assistantApi';
import { ensureReminderPermission, scheduleReminders } from '../utils/reminders';

const formatDue = (value: string | null): string => {
  if (!value) return '';
  const date = new Date(value.replace(' ', 'T'));
  if (isNaN(date.getTime())) return '';
  return date.toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
};

const isOverdue = (task: AssistantTask): boolean => {
  if (task.done || !task.due_at) return false;
  const date = new Date(task.due_at.replace(' ', 'T'));
  return !isNaN(date.getTime()) && date.getTime() < Date.now();
};

export default function TasksPanel() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<AssistantTask[]>([]);
  const [title, setTitle] = useState('');
  const [due, setDue] = useState('');
  const [adding, setAdding] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const list = await loadTasks();
      setTasks(list);
      scheduleReminders(list);
    } catch {
      toast({ variant: 'destructive', title: 'Не удалось загрузить дела' });
    } finally {
      setLoaded(true);
    }
  }, [toast]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 2) return;
    setAdding(true);
    try {
      if (due) await ensureReminderPermission();
      await addTask(title.trim(), due || undefined);
      setTitle('');
      setDue('');
      await refresh();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Не получилось', description: error instanceof Error ? error.message : '' });
    } finally {
      setAdding(false);
    }
  };

  const handleToggle = async (id: number) => {
    try {
      await toggleTask(id);
      await refresh();
    } catch {
      toast({ variant: 'destructive', title: 'Не получилось отметить' });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteTask(id);
      await refresh();
    } catch {
      toast({ variant: 'destructive', title: 'Не получилось удалить' });
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleAdd} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Что нужно сделать?"
          maxLength={200}
          className="h-12 text-base"
        />
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            type="datetime-local"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            className="h-12 text-base"
            aria-label="Когда напомнить"
          />
          <Button
            type="submit"
            disabled={adding || title.trim().length < 2}
            className="h-12 bg-emerald-600 px-6 text-base font-semibold text-white hover:bg-emerald-700"
          >
            {adding ? <Icon name="Loader2" size={18} className="mr-2 animate-spin" /> : <Icon name="Plus" size={18} className="mr-2" />}
            Добавить
          </Button>
        </div>
        <p className="text-xs text-slate-500">Если указать время, напомню, пока приложение открыто.</p>
      </form>

      {loaded && tasks.length === 0 && (
        <p className="py-6 text-center text-slate-500">Пока дел нет. Добавьте первое выше.</p>
      )}

      <ul className="space-y-2">
        {tasks.map((task) => (
          <li
            key={task.id}
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3"
          >
            <button
              type="button"
              onClick={() => handleToggle(task.id)}
              aria-label={task.done ? 'Вернуть в дела' : 'Отметить выполненным'}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                task.done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 text-transparent hover:border-emerald-400'
              }`}
            >
              <Icon name="Check" size={18} />
            </button>
            <div className="min-w-0 flex-1">
              <p className={`break-words text-base ${task.done ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{task.title}</p>
              {task.due_at && (
                <p className={`text-sm ${isOverdue(task) ? 'text-red-600' : 'text-slate-500'}`}>
                  {isOverdue(task) ? 'Просрочено: ' : ''}
                  {formatDue(task.due_at)}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => handleDelete(task.id)}
              aria-label="Удалить"
              className="shrink-0 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-red-600"
            >
              <Icon name="Trash2" size={18} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
