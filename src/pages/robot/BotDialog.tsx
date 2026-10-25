import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import BotSettingsForm from './BotSettingsForm';
import BotBacktest from './BotBacktest';
import BotLog from './BotLog';
import { botsSave, type Bot, type BotMeta, type BotSettings } from './botsApi';

interface Props {
  bot: Bot | null;
  meta: BotMeta;
  tab: string;
  onTab: (t: string) => void;
  onClose: () => void;
  onChanged: () => void;
}

export default function BotDialog({ bot, meta, tab, onTab, onClose, onChanged }: Props) {
  const { toast } = useToast();
  const [cfg, setCfg] = useState<BotSettings>({});
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (bot) {
      setCfg(bot.settings);
      setName(bot.name);
    }
  }, [bot]);

  if (!bot) return null;
  const tm = meta.types[bot.bot_type];

  const save = async () => {
    setSaving(true);
    try {
      await botsSave({ id: bot.id, bot_type: bot.bot_type, name, asset_code: bot.asset_code, settings: cfg });
      toast({ title: 'Настройки сохранены' });
      onChanged();
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'Не удалось сохранить', variant: 'destructive' });
    }
    setSaving(false);
  };

  const reset = () => setCfg({ ...tm.defaults });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{bot.name}</DialogTitle>
          <DialogDescription>
            {bot.type_title}, {bot.asset_code}. Настройки, проверка на истории и журнал решений относятся только к этому роботу.
          </DialogDescription>
        </DialogHeader>
        <Tabs value={tab} onValueChange={onTab}>
          <TabsList className="mb-3">
            <TabsTrigger value="settings">Настройки</TabsTrigger>
            <TabsTrigger value="history">Проверка на истории</TabsTrigger>
            <TabsTrigger value="log">Журнал решений</TabsTrigger>
          </TabsList>
          <TabsContent value="settings" className="space-y-4">
            <div className="max-w-sm space-y-1">
              <Label>Название</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
            </div>
            <BotSettingsForm meta={tm} value={cfg} onChange={setCfg} />
            <div className="flex gap-2">
              <Button onClick={save} disabled={saving}>
                {saving ? 'Сохраняю...' : 'Сохранить'}
              </Button>
              <Button variant="outline" onClick={reset}>
                Вернуть стандартные
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="history">
            <BotBacktest bot={bot} />
          </TabsContent>
          <TabsContent value="log">
            <BotLog bot={bot} onRan={onChanged} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
