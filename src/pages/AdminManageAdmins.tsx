import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

interface AdminManageAdminsProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

interface Admin {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export default function AdminManageAdmins({ isAuthenticated, onLogout }: AdminManageAdminsProps) {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminFirstName, setNewAdminFirstName] = useState('');
  const [newAdminLastName, setNewAdminLastName] = useState('');

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('https://functions.poehali.dev/f20975b5-cf6f-4ee6-9127-53f3d552589f?role=admin');
      const data = await response.json();
      
      if (data.users) {
        setAdmins(data.users);
      }
    } catch (error) {
      toast.error('Ошибка при загрузке администраторов');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAdmin = async () => {
    if (!newAdminEmail || !newAdminPassword || !newAdminFirstName || !newAdminLastName) {
      toast.error('Заполните все поля');
      return;
    }

    try {
      const response = await fetch('https://functions.poehali.dev/fbbc018c-3522-4d56-bbb3-1ba113a4d213', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          email: newAdminEmail,
          password: newAdminPassword,
          firstName: newAdminFirstName,
          lastName: newAdminLastName,
          userType: 'individual',
          phone: '+00000000000',
          role: 'admin'
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Администратор успешно создан');
        setShowCreateDialog(false);
        setNewAdminEmail('');
        setNewAdminPassword('');
        setNewAdminFirstName('');
        setNewAdminLastName('');
        fetchAdmins();
      } else {
        toast.error(data.error || 'Ошибка при создании администратора');
      }
    } catch (error) {
      toast.error('Ошибка при создании администратора');
    }
  };

  const handleDeleteAdmin = async () => {
    if (!selectedAdmin) return;
    
    try {
      const response = await fetch('https://functions.poehali.dev/f20975b5-cf6f-4ee6-9127-53f3d552589f', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedAdmin.id })
      });

      if (response.ok) {
        toast.success(`Администратор ${selectedAdmin.name} удален`);
        fetchAdmins();
      }
    } catch (error) {
      toast.error('Ошибка при удалении администратора');
    }
    
    setShowDeleteDialog(false);
    setSelectedAdmin(null);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2">
                <Icon name="ArrowLeft" className="mr-2 h-4 w-4" />
                Назад
              </Button>
              <h1 className="text-3xl font-bold">Управление администраторами</h1>
              <p className="text-muted-foreground">Добавление и удаление администраторов системы</p>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Icon name="Plus" className="mr-2 h-4 w-4" />
              Добавить админа
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Список администраторов</CardTitle>
              <CardDescription>Всего администраторов: {admins.length}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Имя</TableHead>
                      <TableHead>Роль</TableHead>
                      <TableHead>Дата создания</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          Загрузка...
                        </TableCell>
                      </TableRow>
                    ) : admins.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Администраторы не найдены
                        </TableCell>
                      </TableRow>
                    ) : admins.map((admin) => (
                      <TableRow key={admin.id}>
                        <TableCell className="font-medium">{admin.email}</TableCell>
                        <TableCell>{admin.name}</TableCell>
                        <TableCell>
                          <Badge className="bg-purple-500">
                            <Icon name="Shield" className="mr-1 h-3 w-3" />
                            Администратор
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(admin.createdAt).toLocaleDateString('ru-RU')}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedAdmin(admin);
                              setShowDeleteDialog(true);
                            }}
                            disabled={admin.email === 'admin/ERTP'}
                          >
                            <Icon name="Trash2" className="h-4 w-4" />
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

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать нового администратора</DialogTitle>
            <DialogDescription>
              Введите данные для нового администратора системы
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email (логин)</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                placeholder="Введите пароль"
                value={newAdminPassword}
                onChange={(e) => setNewAdminPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="firstName">Имя</Label>
              <Input
                id="firstName"
                placeholder="Иван"
                value={newAdminFirstName}
                onChange={(e) => setNewAdminFirstName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Фамилия</Label>
              <Input
                id="lastName"
                placeholder="Иванов"
                value={newAdminLastName}
                onChange={(e) => setNewAdminLastName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Отмена
            </Button>
            <Button onClick={handleCreateAdmin}>
              Создать администратора
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить администратора?</DialogTitle>
            <DialogDescription>
              Вы действительно хотите удалить администратора {selectedAdmin?.name}? 
              Это действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleDeleteAdmin}>
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}