import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Icon from '@/components/ui/icon';
import funcUrl from '../../../backend/func2url.json';

interface AudioItem {
  type: 'order' | 'response';
  label: string;
  description: string;
}

const AUDIO_ITEMS: AudioItem[] = [
  {
    type: 'order',
    label: 'Новый заказ на предложение',
    description: 'Воспроизводится когда кто-то оформляет заказ на ваше предложение'
  },
  {
    type: 'response',
    label: 'Новый отклик на запрос',
    description: 'Воспроизводится когда кто-то откликается на ваш запрос'
  }
];

export default function AdminAudioUpload() {
  const [uploading, setUploading] = useState<'order' | 'response' | null>(null);
  const orderRef = useRef<HTMLInputElement>(null);
  const responseRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (type: 'order' | 'response', file: File) => {
    if (!file) return;
    if (!file.type.includes('audio') && !file.name.endsWith('.mp3') && !file.name.endsWith('.wav')) {
      toast.error('Допустимы только MP3 или WAV файлы');
      return;
    }

    setUploading(type);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const url = (funcUrl as Record<string, string>)['upload-audio'];
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, file: base64 })
      });

      const data = await resp.json();
      if (data.success) {
        toast.success(`Файл "${type === 'order' ? 'Новый заказ' : 'Новый отклик'}" успешно загружен`);
      } else {
        toast.error(data.error || 'Ошибка загрузки');
      }
    } catch {
      toast.error('Ошибка при загрузке файла');
    } finally {
      setUploading(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Аудиофайлы уведомлений</CardTitle>
        <CardDescription>Загрузите MP3/WAV файлы для голосовых звонков при новых заказах и откликах</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {AUDIO_ITEMS.map((item) => {
          const ref = item.type === 'order' ? orderRef : responseRef;
          const isUploading = uploading === item.type;
          return (
            <div key={item.type} className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                  <Icon name="Volume2" className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
              <div>
                <input
                  ref={ref}
                  type="file"
                  accept=".mp3,.wav,audio/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(item.type, file);
                    e.target.value = '';
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isUploading}
                  onClick={() => ref.current?.click()}
                  className="gap-2"
                >
                  <Icon name={isUploading ? 'Loader2' : 'Upload'} className={`h-4 w-4 ${isUploading ? 'animate-spin' : ''}`} />
                  {isUploading ? 'Загрузка...' : 'Загрузить'}
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
