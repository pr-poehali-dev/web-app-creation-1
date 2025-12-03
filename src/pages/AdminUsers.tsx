import { useState } from 'react';
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
}

export default function AdminUsers({ isAuthenticated, onLogout }: AdminUsersProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const mockUsers: User[] = [
    {
      id: '1',
      email: 'ivan.petrov@example.com',
      name: 'Иван Петров',
      type: 'individual',
      status: 'active',
      verified: true,
      registeredAt: '2024-01-15'
    },
    {
      id: '2',
      email: 'ip.ivanov@example.com',
      name: 'ИП Иванов А.С.',
      type: 'entrepreneur',
      status: 'active',
      verified: true,
      registeredAt: '2024-02-10'
    },
    {
      id: '3',
      email: 'info@stroyinvest.ru',
      name: 'ООО "СтройИнвест"',
      type: 'legal-entity',
      status: 'blocked',
      verified: false,
      registeredAt: '2024-03-05'
    },
  ];

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

  const handleBlockUser = () => {
    if (selectedUser) {
      toast.success(`Пользователь ${selectedUser.name} заблокирован`);
      setShowBlockDialog(false);
      setSelectedUser(null);
    }
  };

  const handleUnblockUser = (user: User) => {
    toast.success(`Пользователь ${user.name} разблокирован`);
  };

  const handleDeleteUser = (user: User) => {
    toast.success(`Пользователь ${user.name} удален`);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <Button variant="ghost" onClick={() => navigate('/admin/dashboard')} className="mb-2">
                <Icon name="ArrowLeft" className="mr-2 h-4 w-4" />
                Назад к панели
              </Button>
              <h1 className="text-3xl font-bold">Управление пользователями</h1>
              <p className="text-muted-foreground">Просмотр и управление пользователями площадки</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Список пользователей</CardTitle>
              <CardDescription>Всего пользователей: {mockUsers.length}</CardDescription>
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
                    {mockUsers.map((user) => (
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
                                setShowEditDialog(true);
                              }}
                            >
                              <Icon name="Edit" className="h-4 w-4" />
                            </Button>
                            {user.status === 'active' ? (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowBlockDialog(true);
                                }}
                              >
                                <Icon name="Ban" className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUnblockUser(user)}
                              >
                                <Icon name="CheckCircle" className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteUser(user)}
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
            <DialogTitle>Заблокировать пользователя?</DialogTitle>
            <DialogDescription>
              Вы действительно хотите заблокировать пользователя {selectedUser?.name}? 
              Пользователь не сможет войти в систему.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBlockDialog(false)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleBlockUser}>
              Заблокировать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать пользователя</DialogTitle>
            <DialogDescription>
              Изменение данных пользователя {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input defaultValue={selectedUser?.email} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Статус верификации</label>
              <Select defaultValue={selectedUser?.verified ? 'verified' : 'not-verified'}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="verified">Верифицирован</SelectItem>
                  <SelectItem value="not-verified">Не верифицирован</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Отмена
            </Button>
            <Button onClick={() => {
              toast.success('Данные пользователя обновлены');
              setShowEditDialog(false);
            }}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
