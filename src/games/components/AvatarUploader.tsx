import { useRef, useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { GameUser, updateGameAvatar } from '../utils/gameAuth';
import { imageToDataUrl } from '../utils/gameChat';
import PlayerAvatar from './PlayerAvatar';

interface AvatarUploaderProps {
  user: GameUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AvatarUploader({ user, open, onOpenChange }: AvatarUploaderProps) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      const result = await updateGameAvatar(await imageToDataUrl(file, 400, 0.85));
      if (result.success) {
        toast({ title: 'Фото обновлено' });
        onOpenChange(false);
      } else {
        toast({ variant: 'destructive', title: 'Ошибка', description: result.error });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Не удалось прочитать картинку' });
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    setBusy(true);
    const result = await updateGameAvatar(null);
    setBusy(false);
    if (result.success) onOpenChange(false);
    else toast({ variant: 'destructive', title: 'Ошибка', description: result.error });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-sm">
        <DialogHeader>
          <DialogTitle>Ваш аватар</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-2">
          <PlayerAvatar emoji={user.avatar_emoji} url={user.avatar_url} size={96} />
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
          <Button disabled={busy} onClick={() => fileRef.current?.click()} className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold">
            <Icon name={busy ? 'Loader2' : 'Camera'} size={16} className={busy ? 'mr-2 animate-spin' : 'mr-2'} />
            Загрузить фото
          </Button>
          {user.avatar_url && (
            <Button variant="ghost" disabled={busy} onClick={handleRemove} className="text-slate-400 hover:text-red-400">
              Убрать фото
            </Button>
          )}
          <p className="text-xs text-slate-500 text-center">Фото увидят соперники в комнатах и в чате</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
