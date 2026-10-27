import { useEffect, useRef, useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ChatMessage, sendChatMessage, deleteChatMessage, fileToDataUrl, imageToDataUrl } from '../utils/gameChat';
import PlayerAvatar from './PlayerAvatar';
import ImageViewer from './ImageViewer';

interface GameChatPanelProps {
  roomId: number;
  userId: number;
  messages: ChatMessage[];
  onSent: () => void;
}

const pickRecorderMime = () => {
  const options = ['audio/webm', 'audio/mp4', 'audio/ogg'];
  return options.find((m) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)) || '';
};

export default function GameChatPanel({ roomId, userId, messages, onSent }: GameChatPanelProps) {
  const { toast } = useToast();
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [viewer, setViewer] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  useEffect(() => () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
  }, []);

  const send = async (text: string, media?: string) => {
    setSending(true);
    try {
      await sendChatMessage(roomId, text, media);
      onSent();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Ошибка', description: e instanceof Error ? e.message : 'Не удалось отправить' });
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteChatMessage(id);
      onSent();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Ошибка', description: e instanceof Error ? e.message : 'Не удалось удалить' });
      onSent();
    }
  };

  const handleSendText = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput('');
    await send(text);
  };

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ variant: 'destructive', title: 'Нужна картинка' });
      return;
    }
    try {
      await send('', await imageToDataUrl(file));
    } catch {
      toast({ variant: 'destructive', title: 'Не удалось обработать картинку' });
    }
  };

  const stopTimer = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      toast({ variant: 'destructive', title: 'Запись голоса не поддерживается в этом браузере' });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = pickRecorderMime();
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: 32000 } : undefined);
      chunksRef.current = [];
      cancelledRef.current = false;
      recorder.ondataavailable = (ev) => ev.data.size && chunksRef.current.push(ev.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        stopTimer();
        setRecording(false);
        if (cancelledRef.current || !chunksRef.current.length) return;
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        await send('', await fileToDataUrl(blob));
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setSeconds(0);
      timerRef.current = window.setInterval(() => {
        setSeconds((s) => {
          if (s + 1 >= 60) recorder.state === 'recording' && recorder.stop();
          return s + 1;
        });
      }, 1000);
    } catch {
      toast({ variant: 'destructive', title: 'Нет доступа к микрофону', description: 'Разрешите микрофон в настройках браузера' });
    }
  };

  const finishRecording = (cancel: boolean) => {
    cancelledRef.current = cancel;
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col h-[260px] sm:h-[500px]">
      {viewer && <ImageViewer src={viewer} onClose={() => setViewer(null)} />}
      <div className="p-3 border-b border-slate-800 font-semibold text-slate-200 flex items-center gap-2">
        <Icon name="MessageCircle" size={18} />
        Чат комнаты
      </div>
      <div ref={containerRef} className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 ? (
          <p className="text-sm text-slate-500 text-center mt-4">Пока нет сообщений</p>
        ) : (
          messages.map((msg) =>
            msg.is_system ? (
              <div key={msg.id} className="flex justify-center">
                <div className="max-w-[95%] rounded-lg px-3 py-1.5 text-xs text-center bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1.5">
                  <Icon name="Sparkles" size={12} className="shrink-0" />
                  {msg.message}
                </div>
              </div>
            ) : (
              <div key={msg.id} className={`flex gap-2 ${msg.user_id === userId ? 'flex-row-reverse' : ''}`}>
                <PlayerAvatar emoji={msg.avatar_emoji} url={msg.avatar_url} size={24} className="mt-3" />
                <div className={`flex flex-col max-w-[80%] ${msg.user_id === userId ? 'items-end' : 'items-start'}`}>
                  <span className="text-[10px] text-slate-500">{msg.nickname}</span>
                  <div
                    className={`rounded-lg px-3 py-1.5 text-sm ${
                      msg.user_id === userId ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-200'
                    }`}
                  >
                    {msg.media_type === 'image' && msg.media_url ? (
                      <button type="button" onClick={() => setViewer(msg.media_url ?? null)} className="block">
                        <img src={msg.media_url} alt="Фото" loading="lazy" className="max-h-52 rounded-md" />
                      </button>
                    ) : msg.media_type === 'audio' && msg.media_url ? (
                      <audio controls preload="none" src={msg.media_url} className="h-9 w-48 max-w-full" />
                    ) : (
                      msg.message
                    )}
                  </div>
                  {msg.user_id === userId && (
                    <span className="mt-0.5 flex items-center gap-2">
                      <span className={msg.is_read ? 'text-emerald-400' : 'text-slate-200'} title={msg.is_read ? 'Прочитано' : 'Доставлено'}>
                        <Icon name={msg.is_read ? 'CheckCheck' : 'Check'} size={14} />
                      </span>
                      {!msg.is_read && (
                        <button type="button" onClick={() => handleDelete(msg.id)} className="text-slate-500 hover:text-red-400" aria-label="Удалить сообщение" title="Удалить">
                          <Icon name="Trash2" size={13} />
                        </button>
                      )}
                    </span>
                  )}
                </div>
              </div>
            )
          )
        )}
      </div>
      {recording ? (
        <div className="p-3 border-t border-slate-800 flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm text-slate-200 flex-1">Запись {seconds} с</span>
          <Button size="icon" variant="ghost" onClick={() => finishRecording(true)} className="text-slate-400 hover:text-red-400" aria-label="Отменить">
            <Icon name="Trash2" size={16} />
          </Button>
          <Button size="icon" onClick={() => finishRecording(false)} className="bg-amber-500 hover:bg-amber-600 text-slate-950" aria-label="Отправить голосовое">
            <Icon name="Send" size={16} />
          </Button>
        </div>
      ) : (
        <div className="p-3 border-t border-slate-800 flex gap-2">
          <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} className="hidden" />
          <Button size="icon" variant="ghost" disabled={sending} onClick={() => fileRef.current?.click()} className="text-slate-400 hover:text-amber-400 shrink-0" aria-label="Прикрепить фото">
            <Icon name="Image" size={18} />
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
            placeholder="Сообщение..."
            className="bg-slate-800/60 border-slate-700 text-slate-100 placeholder:text-slate-500"
            maxLength={500}
          />
          {input.trim() ? (
            <Button size="icon" disabled={sending} onClick={handleSendText} className="bg-amber-500 hover:bg-amber-600 text-slate-950 shrink-0" aria-label="Отправить">
              <Icon name="Send" size={16} />
            </Button>
          ) : (
            <Button size="icon" disabled={sending} onClick={startRecording} className="bg-amber-500 hover:bg-amber-600 text-slate-950 shrink-0" aria-label="Записать голосовое">
              <Icon name="Mic" size={16} />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}