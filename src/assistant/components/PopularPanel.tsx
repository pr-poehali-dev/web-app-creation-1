import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { PopularCategory, loadPopular, loadPopularAnswer } from '../utils/assistantApi';
import { renderText } from './ChatPanel';

interface Opened {
  id: string;
  text: string;
}

export default function PopularPanel() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<PopularCategory[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [opened, setOpened] = useState<Opened | null>(null);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    loadPopular()
      .then(setCategories)
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const open = async (q: Opened) => {
    setOpened(q);
    setAnswer('');
    setFailed(false);
    setLoading(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      setAnswer(await loadPopularAnswer(q.id));
    } catch (error) {
      setFailed(true);
      toast({
        variant: 'destructive',
        title: 'Не удалось получить ответ',
        description: error instanceof Error ? error.message : 'Попробуйте ещё раз',
      });
    } finally {
      setLoading(false);
    }
  };

  if (opened) {
    return (
      <div className="pb-6">
        <button
          type="button"
          onClick={() => setOpened(null)}
          className="mb-3 flex items-center gap-1 rounded-full py-1.5 pr-3 text-sm text-slate-600 hover:text-slate-900"
        >
          <Icon name="ArrowLeft" size={16} />
          Все вопросы
        </button>
        <h2 className="mb-3 text-xl font-bold text-slate-800">{opened.text}</h2>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          {loading && (
            <div className="flex items-center gap-2 text-slate-500">
              <Icon name="Loader2" size={16} className="animate-spin" />
              Ищу лучший ответ, это займёт до минуты...
            </div>
          )}
          {failed && !loading && (
            <button
              type="button"
              onClick={() => open(opened)}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
            >
              Попробовать ещё раз
            </button>
          )}
          {answer && <div className="whitespace-pre-wrap text-base leading-relaxed text-slate-800">{renderText(answer, false)}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-6">
      <p className="mb-4 text-slate-600">Что чаще всего спрашивают в интернете. Нажмите на вопрос, чтобы получить подробный ответ.</p>
      {loaded && categories.length === 0 && <p className="text-slate-500">Не удалось загрузить список, попробуйте позже.</p>}
      <div className="space-y-5">
        {categories.map((c) => (
          <section key={c.id}>
            <h3 className="mb-2 flex items-center gap-2 text-base font-semibold text-slate-800">
              <Icon name={c.icon} size={18} className="text-emerald-600" />
              {c.title}
            </h3>
            <div className="grid gap-2">
              {c.questions.map((q) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => open(q)}
                  className="rounded-2xl border-2 border-emerald-200 bg-white p-3 text-left text-base text-slate-800 transition-colors hover:border-emerald-500 hover:bg-emerald-50"
                >
                  {q.text}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
