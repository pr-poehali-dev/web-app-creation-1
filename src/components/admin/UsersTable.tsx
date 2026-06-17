import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Icon from '@/components/ui/icon';

export interface User {
  id: string;
  email: string;
  name: string;
  type: 'individual' | 'entrepreneur' | 'legal-entity';
  status: 'active' | 'blocked' | 'pending';
  verified: boolean;
  registeredAt: string;
  phone?: string;
  inn?: string;
  ogrnip?: string;
  ogrn?: string;
  companyName?: string;
  directorName?: string;
  position?: string;
  legalAddress?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  isActive?: boolean;
  lockedUntil?: string | null;
  rating?: number;
}

interface SubInfo {
  active: boolean;
  plan: string | null;
  expires_at: string | null;
}

interface UsersTableProps {
  users: User[];
  isLoading: boolean;
  onViewDetails: (user: User) => void;
  onBlock: (user: User) => void;
  onUnblock: (user: User) => void;
  onDelete: (user: User) => void;
  onCall?: (user: User) => void;
  onGrantSub?: (user: User) => void;
  onRevokeSub?: (user: User) => void;
  subMap?: Record<string, SubInfo>;
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

export default function UsersTable({
  users,
  isLoading,
  onViewDetails,
  onBlock,
  onUnblock,
  onDelete,
  onCall,
  onGrantSub,
  onRevokeSub,
  subMap = {},
}: UsersTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Имя / Компания</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Тип</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead>Верификация</TableHead>
            <TableHead>Дата регистрации</TableHead>
            <TableHead className="text-right">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8">
                Загрузка...
              </TableCell>
            </TableRow>
          ) : users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                Пользователи не найдены
              </TableCell>
            </TableRow>
          ) : users.map((user) => {
            const sub = subMap[String(user.id)];
            const subActive = sub?.active === true;
            const subExists = sub !== undefined;
            const planLabel = sub?.plan === 'trial' ? 'Триал' : sub?.plan === 'week' ? 'Неделя' : sub?.plan === 'month' ? 'Месяц' : sub?.plan === 'year' ? 'Год' : null;
            return (
            <TableRow key={user.id}>
              <TableCell className="font-medium">
                <div className="flex flex-col gap-1">
                  <span>{user.name}</span>
                  {subActive && planLabel && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-600 bg-purple-100 rounded-full px-1.5 py-0.5 w-fit">
                      <Icon name="Zap" size={9} />
                      {planLabel}
                    </span>
                  )}
                  {!subActive && subExists && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-500 bg-red-50 rounded-full px-1.5 py-0.5 w-fit">
                      <Icon name="ZapOff" size={9} />
                      Истекла
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{getTypeName(user.type)}</TableCell>
              <TableCell>{getStatusBadge(user.status)}</TableCell>
              <TableCell>
                {user.verified ? (
                  <Badge className="bg-green-500">
                    <Icon name="Check" className="mr-1 h-3 w-3" />
                    Верифицирован
                  </Badge>
                ) : (
                  <Badge variant="secondary">Не верифицирован</Badge>
                )}
              </TableCell>
              <TableCell>{new Date(user.registeredAt).toLocaleDateString('ru-RU')}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onViewDetails(user)}
                    title="Подробнее"
                  >
                    <Icon name="Eye" className="h-4 w-4" />
                  </Button>
                  {user.status === 'active' ? (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onBlock(user)}
                      title="Заблокировать"
                      className="bg-red-500 hover:bg-red-600"
                    >
                      <Icon name="Ban" className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onUnblock(user)}
                      title="Разблокировать"
                      className="border-green-500 text-green-600 hover:bg-green-50"
                    >
                      <Icon name="CheckCircle" className="h-4 w-4" />
                    </Button>
                  )}
                  {onCall && user.phone && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onCall(user)}
                      title="Позвонить"
                      className="border-blue-400 text-blue-600 hover:bg-blue-50"
                    >
                      <Icon name="Phone" className="h-4 w-4" />
                    </Button>
                  )}
                  {onGrantSub && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onGrantSub(user)}
                      title={subActive ? `Подписка активна: ${planLabel}` : 'Выдать подписку BrainBooster'}
                      className={subActive
                        ? 'border-[3px] border-purple-500 text-purple-600 bg-purple-50 hover:bg-purple-100'
                        : 'border-purple-300 text-purple-400 hover:bg-purple-50'}
                    >
                      <Icon name="Zap" className="h-4 w-4" />
                    </Button>
                  )}
                  {onRevokeSub && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onRevokeSub(user)}
                      title={subActive ? 'Отозвать подписку' : subExists ? 'Подписка неактивна / истекла' : 'Подписки нет'}
                      className={subActive
                        ? 'border-orange-400 text-orange-600 hover:bg-orange-50'
                        : 'border-[3px] border-red-500 text-red-500 bg-red-50 hover:bg-red-100'}
                    >
                      <Icon name="ZapOff" className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDelete(user)}
                    title="Удалить"
                    className="border-gray-400 text-gray-600 hover:bg-gray-50"
                  >
                    <Icon name="Trash2" className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}