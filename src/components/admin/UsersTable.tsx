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
}

interface UsersTableProps {
  users: User[];
  isLoading: boolean;
  onViewDetails: (user: User) => void;
  onBlock: (user: User) => void;
  onUnblock: (user: User) => void;
  onDelete: (user: User) => void;
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
          ) : users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name}</TableCell>
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
              <TableCell>{new Date(user.registeredAt).toLocaleDateString('ru-RU', { timeZone: 'Asia/Yakutsk' })}</TableCell>
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
}