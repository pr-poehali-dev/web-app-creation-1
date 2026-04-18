import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import type { User } from './UsersTable';

const ADMIN_USERS_API = 'https://functions.poehali.dev/f20975b5-cf6f-4ee6-9127-53f3d552589f';

interface UserDetailsDialogProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onRatingUpdated?: (userId: string, newRating: number) => void;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'active': return <Badge className="bg-green-500">Активен</Badge>;
    case 'blocked': return <Badge variant="destructive">Заблокирован</Badge>;
    case 'pending': return <Badge variant="secondary">Ожидает</Badge>;
    default: return null;
  }
};

const getTypeName = (type: string) => {
  switch (type) {
    case 'individual': return 'Физическое лицо';
    case 'entrepreneur': return 'ИП';
    case 'legal-entity': return 'Юридическое лицо';
    default: return type;
  }
};

const getRatingColor = (r: number) => {
  if (r >= 80) return 'text-green-600';
  if (r >= 50) return 'text-yellow-600';
  return 'text-red-600';
};

export default function UserDetailsDialog({ user, isOpen, onClose, onRatingUpdated }: UserDetailsDialogProps) {
  const [ratingInput, setRatingInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) setRatingInput(String(user.rating ?? 50));
  }, [user]);

  const handleSaveRating = async () => {
    if (!user) return;
    const val = parseFloat(ratingInput);
    if (isNaN(val) || val < 0 || val > 100) {
      toast.error('Рейтинг должен быть от 0 до 100');
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch(ADMIN_USERS_API, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, action: 'update', rating: val }),
      });
      if (res.ok) {
        toast.success(`Рейтинг обновлён: ${val}`);
        onRatingUpdated?.(user.id, val);
      } else {
        toast.error('Не удалось сохранить рейтинг');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Информация о пользователе</DialogTitle>
          <DialogDescription>Полная карточка пользователя</DialogDescription>
        </DialogHeader>
        {user && (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-sm">{user.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Тип пользователя</p>
                <p className="text-sm">{getTypeName(user.type)}</p>
              </div>
            </div>

            {user.type === 'individual' && (
              <div className="space-y-2 border-t pt-4">
                <h3 className="text-sm font-semibold">Персональные данные</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Фамилия</p>
                    <p className="text-sm">{user.lastName || '—'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Имя</p>
                    <p className="text-sm">{user.firstName || '—'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Отчество</p>
                    <p className="text-sm">{user.middleName || '—'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Телефон</p>
                    <p className="text-sm">{user.phone || '—'}</p>
                  </div>
                </div>
              </div>
            )}

            {user.type === 'entrepreneur' && (
              <div className="space-y-2 border-t pt-4">
                <h3 className="text-sm font-semibold">Данные ИП</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">ФИО</p>
                    <p className="text-sm">{user.name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Телефон</p>
                    <p className="text-sm">{user.phone || '—'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">ИНН</p>
                    <p className="text-sm">{user.inn || '—'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">ОГРНИП</p>
                    <p className="text-sm">{user.ogrnip || '—'}</p>
                  </div>
                </div>
              </div>
            )}

            {user.type === 'legal-entity' && (
              <div className="space-y-2 border-t pt-4">
                <h3 className="text-sm font-semibold">Данные юридического лица</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Название компании</p>
                    <p className="text-sm">{user.companyName || '—'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Телефон</p>
                    <p className="text-sm">{user.phone || '—'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">ИНН</p>
                    <p className="text-sm">{user.inn || '—'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">ОГРН</p>
                    <p className="text-sm">{user.ogrn || '—'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Директор</p>
                    <p className="text-sm">{user.directorName || '—'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Должность</p>
                    <p className="text-sm">{user.position || '—'}</p>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">Юридический адрес</p>
                    <p className="text-sm">{user.legalAddress || '—'}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2 border-t pt-4">
              <h3 className="text-sm font-semibold">Системная информация</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Статус</p>
                  <div>{getStatusBadge(user.status)}</div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Верификация</p>
                  <div>
                    {user.verified ? (
                      <Badge className="bg-green-500">
                        <Icon name="Check" className="mr-1 h-3 w-3" />
                        Верифицирован
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Не верифицирован</Badge>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Дата регистрации</p>
                  <p className="text-sm">{new Date(user.registeredAt).toLocaleString('ru-RU')}</p>
                </div>
                {user.lockedUntil && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Заблокирован до</p>
                    <p className="text-sm">{new Date(user.lockedUntil).toLocaleString('ru-RU')}</p>
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">ID</p>
                  <p className="text-xs font-mono">{user.id}</p>
                </div>
              </div>
            </div>

            {/* Рейтинг надёжности */}
            <div className="space-y-3 border-t pt-4">
              <h3 className="text-sm font-semibold">Рейтинг надёжности</h3>
              <div className="flex items-center gap-3">
                <div className={`text-3xl font-bold ${getRatingColor(parseFloat(ratingInput) || 0)}`}>
                  {user.rating ?? 50}
                </div>
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      (user.rating ?? 50) >= 80 ? 'bg-green-500' :
                      (user.rating ?? 50) >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${user.rating ?? 50}%` }}
                  />
                </div>
                <span className="text-sm text-muted-foreground">/ 100</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={ratingInput}
                  onChange={e => setRatingInput(e.target.value)}
                  className="w-24"
                  placeholder="0–100"
                />
                <Button onClick={handleSaveRating} disabled={isSaving} size="sm">
                  {isSaving ? <Icon name="Loader2" className="animate-spin mr-1 h-4 w-4" /> : <Icon name="Save" className="mr-1 h-4 w-4" />}
                  Сохранить
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Введите значение от 0 до 100 и нажмите «Сохранить»</p>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button onClick={onClose}>Закрыть</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
