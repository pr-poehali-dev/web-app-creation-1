import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

interface DeletedUser {
  id: string;
  originalEmail: string;
  name: string;
  type: 'individual' | 'entrepreneur' | 'legal-entity';
  phone?: string;
  inn?: string;
  companyName?: string;
  removedAt: string;
  ordersCount?: number;
  offersCount?: number;
  requestsCount?: number;
}

interface AdminDeletedUsersProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function AdminDeletedUsers({ isAuthenticated, onLogout }: AdminDeletedUsersProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<DeletedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userToRestore, setUserToRestore] = useState<DeletedUser | null>(null);

  useEffect(() => {
    fetchDeletedUsers();
  }, [searchQuery]);

  const fetchDeletedUsers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('deleted', 'true');
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`https://functions.poehali.dev/f20975b5-cf6f-4ee6-9127-53f3d552589f?${params}`);
      const data = await response.json();
      
      if (data.users) {
        setUsers(data.users);
      }
    } catch (error) {
      toast.error('Ошибка при загрузке удаленных пользователей');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreUser = async () => {
    if (!userToRestore) return;
    try {
      const response = await fetch('https://functions.poehali.dev/f20975b5-cf6f-4ee6-9127-53f3d552589f', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: userToRestore.id, 
          action: 'restore'
        })
      });
      if (response.ok) {
        const data = await response.json();
        toast.success(`Пользователь ${userToRestore.name} восстановлен. Временный email: ${data.tempEmail}`);
        fetchDeletedUsers();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Ошибка при восстановлении');
      }
    } catch (error) {
      toast.error('Ошибка при восстановлении');
    }
    setUserToRestore(null);
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

  const filteredUsers = users.filter(user => 
    !searchQuery || 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.originalEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2">
              <Icon name="ArrowLeft" className="mr-2 h-4 w-4" />
              Назад
            </Button>
            <h1 className="text-3xl font-bold">История удаленных пользователей</h1>
            <p className="text-muted-foreground">Просмотр и восстановление удаленных пользователей</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Удаленные пользователи</CardTitle>
              <CardDescription>
                Всего удаленных: {users.length}
                {users.length > 0 && (
                  <span className="text-xs block mt-1 text-muted-foreground">
                    Данные пользователей (заказы, предложения, запросы) сохранены в системе
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <Input
                  placeholder="Поиск по имени или email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Имя / Компания</TableHead>
                      <TableHead>Оригинальный Email</TableHead>
                      <TableHead>Тип</TableHead>
                      <TableHead>Телефон</TableHead>
                      <TableHead>Дата удаления</TableHead>
                      <TableHead>Статистика</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          Загрузка...
                        </TableCell>
                      </TableRow>
                    ) : filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          {searchQuery ? 'Ничего не найдено' : 'Нет удаленных пользователей'}
                        </TableCell>
                      </TableRow>
                    ) : filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-mono text-sm">{user.id}</TableCell>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">{user.originalEmail}</span>
                            <Badge variant="secondary" className="text-xs">
                              <Icon name="Trash2" className="h-3 w-3 mr-1" />
                              Удален
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>{getTypeName(user.type)}</TableCell>
                        <TableCell>{user.phone || '—'}</TableCell>
                        <TableCell>
                          {new Date(user.removedAt).toLocaleString('ru-RU', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2 text-xs">
                            {user.ordersCount !== undefined && user.ordersCount > 0 && (
                              <Badge variant="outline" className="gap-1">
                                <Icon name="ShoppingCart" className="h-3 w-3" />
                                {user.ordersCount}
                              </Badge>
                            )}
                            {user.offersCount !== undefined && user.offersCount > 0 && (
                              <Badge variant="outline" className="gap-1">
                                <Icon name="Package" className="h-3 w-3" />
                                {user.offersCount}
                              </Badge>
                            )}
                            {user.requestsCount !== undefined && user.requestsCount > 0 && (
                              <Badge variant="outline" className="gap-1">
                                <Icon name="FileText" className="h-3 w-3" />
                                {user.requestsCount}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setUserToRestore(user)}
                            title="Восстановить пользователя"
                            className="border-green-500 text-green-600 hover:bg-green-50"
                          >
                            <Icon name="RotateCcw" className="h-4 w-4 mr-1" />
                            Восстановить
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <AlertDialog open={!!userToRestore} onOpenChange={() => setUserToRestore(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Восстановить пользователя?</AlertDialogTitle>
            <AlertDialogDescription>
              Пользователь {userToRestore?.name} будет восстановлен с временным email. Все его заказы, предложения и запросы вновь станут активными. Пользователь сможет войти в систему и изменить email в настройках профиля.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestoreUser}
              className="bg-green-500 hover:bg-green-600"
            >
              <Icon name="RotateCcw" className="h-4 w-4 mr-2" />
              Восстановить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
}