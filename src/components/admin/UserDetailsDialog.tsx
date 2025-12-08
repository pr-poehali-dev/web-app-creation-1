import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import type { User } from './UsersTable';

interface UserDetailsDialogProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'active':
      return <Badge className="bg-green-500">Активен</Badge>;
    case 'blocked':
      return <Badge variant="destructive">Заблокирован</Badge>;
    case 'pending':
      return <Badge variant="secondary">Ожидает</Badge>;
    default:
      return null;
  }
};

const getTypeName = (type: string) => {
  switch (type) {
    case 'individual':
      return 'Физическое лицо';
    case 'entrepreneur':
      return 'ИП';
    case 'legal-entity':
      return 'Юридическое лицо';
    default:
      return type;
  }
};

export default function UserDetailsDialog({ user, isOpen, onClose }: UserDetailsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Информация о пользователе</DialogTitle>
          <DialogDescription>
            Полная карточка пользователя
          </DialogDescription>
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
          </div>
        )}
        <DialogFooter>
          <Button onClick={onClose}>
            Закрыть
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
