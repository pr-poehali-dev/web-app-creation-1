import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

interface AdminUsersProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

interface User {
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

export default function AdminUsers({ isAuthenticated, onLogout }: AdminUsersProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [blockDuration, setBlockDuration] = useState<number>(0);

  useEffect(() => {
    fetchUsers();
  }, [searchQuery, filterStatus, filterType]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterType !== 'all') params.append('type', filterType);

      const response = await fetch(`https://functions.poehali.dev/f20975b5-cf6f-4ee6-9127-53f3d552589f?${params}`);
      const data = await response.json();
      
      if (data.users) {
        setUsers(data.users);
      }
    } catch (error) {
      toast.error('Ошибка при загрузке пользователей');
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleBlockUser = async () => {
    if (!selectedUser) return;
    try {
      const response = await fetch('https://functions.poehali.dev/f20975b5-cf6f-4ee6-9127-53f3d552589f', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: selectedUser.id, 
          action: 'block',
          duration: blockDuration > 0 ? blockDuration : undefined
        })
      });
      if (response.ok) {
        const durationText = blockDuration > 0 ? ` на ${blockDuration} часов` : ' навсегда';
        toast.success(`Пользователь ${selectedUser.name} заблокирован${durationText}`);
        fetchUsers();
      } else {
        toast.error('Ошибка при блокировке');
      }
    } catch (error) {
      toast.error('Ошибка при блокировке');
    }
    setShowBlockDialog(false);
    setSelectedUser(null);
    setBlockDuration(0);
  };

  const handleUnblockUser = async (user: User) => {
    try {
      const response = await fetch('https://functions.poehali.dev/f20975b5-cf6f-4ee6-9127-53f3d552589f', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, action: 'unblock' })
      });
      if (response.ok) {
        toast.success(`Пользователь ${user.name} разблокирован`);
        fetchUsers();
      }
    } catch (error) {
      toast.error('Ошибка при разблокировке');
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      const response = await fetch('https://functions.poehali.dev/f20975b5-cf6f-4ee6-9127-53f3d552589f', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser.id })
      });
      if (response.ok) {
        toast.success(`Пользователь ${selectedUser.name} удален`);
        fetchUsers();
      } else {
        toast.error('Ошибка при удалении');
      }
    } catch (error) {
      toast.error('Ошибка при удалении');
    }
    setShowDeleteDialog(false);
    setSelectedUser(null);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2">
                <Icon name="ArrowLeft" className="mr-2 h-4 w-4" />
                Назад
              </Button>
              <h1 className="text-3xl font-bold">Управление пользователями</h1>
              <p className="text-muted-foreground">Просмотр и управление пользователями площадки</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Список пользователей</CardTitle>
              <CardDescription>Всего пользователей: {users.length}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center">
                <div className="flex-1">
                  <Input
                    placeholder="Поиск по имени или email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Статус" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все статусы</SelectItem>
                    <SelectItem value="active">Активные</SelectItem>
                    <SelectItem value="blocked">Заблокированные</SelectItem>
                    <SelectItem value="pending">Ожидающие</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Тип" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все типы</SelectItem>
                    <SelectItem value="individual">Физ. лица</SelectItem>
                    <SelectItem value="entrepreneur">ИП</SelectItem>
                    <SelectItem value="legal-entity">Юр. лица</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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
                        <TableCell>{new Date(user.registeredAt).toLocaleDateString('ru-RU')}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedUser(user);
                                setShowDetailsDialog(true);
                              }}
                              title="Подробнее"
                            >
                              <Icon name="Eye" className="h-4 w-4" />
                            </Button>
                            {user.status === 'active' ? (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowBlockDialog(true);
                                }}
                                title="Заблокировать"
                              >
                                <Icon name="Ban" className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUnblockUser(user)}
                                title="Разблокировать"
                              >
                                <Icon name="CheckCircle" className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedUser(user);
                                setShowDeleteDialog(true);
                              }}
                              title="Удалить"
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
            </CardContent>
          </Card>
        </div>
      </main>

      <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Заблокировать пользователя</DialogTitle>
            <DialogDescription>
              Укажите срок блокировки для {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Срок блокировки</label>
              <Select value={blockDuration.toString()} onValueChange={(val) => setBlockDuration(Number(val))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Навсегда</SelectItem>
                  <SelectItem value="1">1 час</SelectItem>
                  <SelectItem value="3">3 часа</SelectItem>
                  <SelectItem value="6">6 часов</SelectItem>
                  <SelectItem value="12">12 часов</SelectItem>
                  <SelectItem value="24">1 день</SelectItem>
                  <SelectItem value="72">3 дня</SelectItem>
                  <SelectItem value="168">7 дней</SelectItem>
                  <SelectItem value="720">30 дней</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {blockDuration === 0 
                  ? 'Пользователь не сможет войти в систему до ручной разблокировки'
                  : `Пользователь будет заблокирован на ${blockDuration} часов`
                }
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowBlockDialog(false);
              setBlockDuration(0);
            }}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleBlockUser}>
              Заблокировать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить пользователя?</DialogTitle>
            <DialogDescription>
              Вы действительно хотите удалить пользователя {selectedUser?.name}?
              Это действие необратимо. Все данные пользователя будут удалены.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Информация о пользователе</DialogTitle>
            <DialogDescription>
              Полная карточка пользователя
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-sm">{selectedUser.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Тип пользователя</p>
                  <p className="text-sm">{getTypeName(selectedUser.type)}</p>
                </div>
              </div>

              {selectedUser.type === 'individual' && (
                <div className="space-y-2 border-t pt-4">
                  <h3 className="text-sm font-semibold">Персональные данные</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Фамилия</p>
                      <p className="text-sm">{selectedUser.lastName || '—'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Имя</p>
                      <p className="text-sm">{selectedUser.firstName || '—'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Отчество</p>
                      <p className="text-sm">{selectedUser.middleName || '—'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Телефон</p>
                      <p className="text-sm">{selectedUser.phone || '—'}</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedUser.type === 'entrepreneur' && (
                <div className="space-y-2 border-t pt-4">
                  <h3 className="text-sm font-semibold">Данные ИП</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">ФИО</p>
                      <p className="text-sm">{selectedUser.name}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Телефон</p>
                      <p className="text-sm">{selectedUser.phone || '—'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">ИНН</p>
                      <p className="text-sm">{selectedUser.inn || '—'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">ОГРНИП</p>
                      <p className="text-sm">{selectedUser.ogrnip || '—'}</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedUser.type === 'legal-entity' && (
                <div className="space-y-2 border-t pt-4">
                  <h3 className="text-sm font-semibold">Данные юридического лица</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Название компании</p>
                      <p className="text-sm">{selectedUser.companyName || '—'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Телефон</p>
                      <p className="text-sm">{selectedUser.phone || '—'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">ИНН</p>
                      <p className="text-sm">{selectedUser.inn || '—'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">ОГРН</p>
                      <p className="text-sm">{selectedUser.ogrn || '—'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Директор</p>
                      <p className="text-sm">{selectedUser.directorName || '—'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Должность</p>
                      <p className="text-sm">{selectedUser.position || '—'}</p>
                    </div>
                    <div className="space-y-1 col-span-2">
                      <p className="text-sm font-medium text-muted-foreground">Юридический адрес</p>
                      <p className="text-sm">{selectedUser.legalAddress || '—'}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2 border-t pt-4">
                <h3 className="text-sm font-semibold">Системная информация</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Статус</p>
                    <div>{getStatusBadge(selectedUser.status)}</div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Верификация</p>
                    <div>
                      {selectedUser.verified ? (
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
                    <p className="text-sm">{new Date(selectedUser.registeredAt).toLocaleString('ru-RU')}</p>
                  </div>
                  {selectedUser.lockedUntil && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Заблокирован до</p>
                      <p className="text-sm">{new Date(selectedUser.lockedUntil).toLocaleString('ru-RU')}</p>
                    </div>
                  )}
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">ID</p>
                    <p className="text-xs font-mono">{selectedUser.id}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowDetailsDialog(false)}>
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}