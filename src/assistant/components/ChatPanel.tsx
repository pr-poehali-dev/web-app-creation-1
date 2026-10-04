import { useEffect, useRef, useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  AssistantMode,
  AssistantUser,
  ChatMessage,
  MODE_INFO,
  SCENARIOS,
  clearHistory,
  loadHistory,
  sendMessage,
} from '../utils/assistantApi';

interface ChatPanelProps {
  user: AssistantUser;
  onMemoryChanged: () => void;
}

export default function ChatPanel({ user, onMemoryChanged }: ChatPanelProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadHistory()
      .then(setMessages)
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, sending]);

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || sending) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: message }]);
    setSending(true);
    try {
      const result = await sendMessage(message);
      setMessages((prev) => [...prev, { role: 'assistant', content: result.answer }]);
      if (result.remembered) {
        toast({ title: 'Запомнил', description: result.remembered });
        onMemoryChanged();
      }
    } catch (error) {
      setMessages((prev) => prev.slice(0, -1));
      setInput(message);
      toast({
        variant: 'destructive',
        title: 'Не получилось ответить',
        description: error instanceof Error ? error.message : 'Попробуйте ещё раз',
      });
    } finally {
      setSending(false);
    }
  };

  const handleClear = async () => {
    try {
      await clearHistory();
      setMessages([]);
    } catch {
      toast({ variant: 'destructive', title: 'Не удалось очистить переписку' });
    }
  };

  const scenarios = user.modes.flatMap((m: AssistantMode) => SCENARIOS[m] || []);

  return (
    <div className="flex h-[calc(100vh-9.5rem)] flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto px-1 py-2">
        {loaded && messages.length === 0 && (
          <div className="py-4">
            <p className="text-lg font-semibold text-slate-800">Здравствуйте, {user.name}!</p>
            <p className="mt-1 text-slate-600">Выберите, с чего начать, или напишите своими словами.</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {scenarios.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => send(s.prompt)}
                  disabled={sending}
                  className="rounded-2xl border-2 border-emerald-200 bg-white p-4 text-left text-base font-medium text-slate-800 transition-colors hover:border-emerald-500 hover:bg-emerald-50"
                >
                  {s.label}
                </button>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {user.modes.map((m) => (
                <span key={m} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
                  <Icon name={MODE_INFO[m].icon} size={14} />
                  {MODE_INFO[m].title}
                </span>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={m.id ?? `${m.role}-${i}`} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-base leading-relaxed ${
                m.role === 'user' ? 'bg-emerald-600 text-white' : 'border border-slate-200 bg-white text-slate-800'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-500">
              <Icon name="Loader2" size={16} className="animate-spin" />
              Думаю...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-slate-200 bg-white/80 pt-3">
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={2}
            maxLength={2000}
            placeholder="Напишите, что нужно..."
            className="min-h-[56px] resize-none text-base"
          />
          <Button
            onClick={() => send(input)}
            disabled={sending || !input.trim()}
            className="h-14 w-14 shrink-0 bg-emerald-600 text-white hover:bg-emerald-700"
            aria-label="Отправить"
          >
            <Icon name="Send" size={20} />
          </Button>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="mt-2 text-xs text-slate-500 underline hover:text-slate-700"
          >
            Очистить переписку
          </button>
        )}
      </div>
    </div>
  );
}
