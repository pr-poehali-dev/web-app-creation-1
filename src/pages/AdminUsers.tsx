import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import UsersTable, { type User } from '@/components/admin/UsersTable';
import UserDetailsDialog from '@/components/admin/UserDetailsDialog';
import UserActionsDialogs from '@/components/admin/UserActionsDialogs';

interface AdminUsersProps {
  isAuthenticated: boolean;
  onLogout: () => void;
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
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: selectedUser.id })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        // Закрываем диалог
        setShowDeleteDialog(false);
        setSelectedUser(null);
        
        // Показываем сообщение
        toast.success('Пользователь успешно удален');
        
        // Обновляем список пользователей
        fetchUsers();
      } else {
        setShowDeleteDialog(false);
        setSelectedUser(null);
        toast.error(data?.error || 'Ошибка при удалении пользователя');
      }
    } catch (error) {
      setShowDeleteDialog(false);
      setSelectedUser(null);
      toast.error('Произошла ошибка при удалении пользователя');
    }
  };

  const handleViewDetails = (user: User) => {
    setSelectedUser(user);
    setShowDetailsDialog(true);
  };

  const handleBlock = (user: User) => {
    setSelectedUser(user);
    setShowBlockDialog(true);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
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
            <Button 
              variant="outline" 
              onClick={() => navigate('/admin/deleted-users')}
              className="gap-2"
            >
              <Icon name="Archive" className="h-4 w-4" />
              История удаленных
            </Button>
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

              <UsersTable
                users={users}
                isLoading={isLoading}
                onViewDetails={handleViewDetails}
                onBlock={handleBlock}
                onUnblock={handleUnblockUser}
                onDelete={handleDelete}
              />
            </CardContent>
          </Card>
        </div>
      </main>

      <UserActionsDialogs
        selectedUser={selectedUser}
        showBlockDialog={showBlockDialog}
        showDeleteDialog={showDeleteDialog}
        blockDuration={blockDuration}
        onBlockDurationChange={setBlockDuration}
        onCloseBlockDialog={() => {
          setShowBlockDialog(false);
          setBlockDuration(0);
        }}
        onCloseDeleteDialog={() => setShowDeleteDialog(false)}
        onConfirmBlock={handleBlockUser}
        onConfirmDelete={handleDeleteUser}
      />

      <UserDetailsDialog
        user={selectedUser}
        isOpen={showDetailsDialog}
        onClose={() => setShowDetailsDialog(false)}
      />

      <Footer />
    </div>
  );
}