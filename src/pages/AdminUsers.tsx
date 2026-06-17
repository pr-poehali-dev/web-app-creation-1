import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  const [showCallDialog, setShowCallDialog] = useState(false);
  const [callUser, setCallUser] = useState<User | null>(null);
  const [callText, setCallText] = useState('Вам поступил новый заказ на вашем сайте.');
  const [isCalling, setIsCalling] = useState(false);

  // Управление подпиской BrainBooster
  const [showSubDialog, setShowSubDialog] = useState(false);
  const [subUser, setSubUser] = useState<User | null>(null);
  const [subPlan, setSubPlan] = useState<string>('month');
  const [subLoading, setSubLoading] = useState(false);
  const [subMap, setSubMap] = useState<Record<string, { active: boolean; plan: string | null; expires_at: string | null }>>({});

  const ADMIN_KEY = localStorage.getItem('adminKey') || '';
  const SUB_URL = 'https://functions.poehali.dev/f2a339e0-68a2-42ba-b5eb-55be5d543b5e';

  const fetchSubscriptions = async (key: string) => {
    try {
      const res = await fetch(`${SUB_URL}?action=admin-list`, { headers: { 'X-Admin-Key': key } });
      const data = await res.json();
      if (data.ok && data.subscriptions) {
        const map: Record<string, { active: boolean; plan: string | null; expires_at: string | null }> = {};
        for (const s of data.subscriptions) {
          map[String(s.user_id)] = { active: s.is_active, plan: s.plan, expires_at: s.expires_at };
        }
        setSubMap(map);
      }
    } catch { /* тихо */ }
  };

  const handleGrantSub = (user: User) => {
    setSubUser(user);
    setSubPlan('month');
    setShowSubDialog(true);
  };

  const getAdminKey = () => localStorage.getItem('adminKey') || '';

  const doGrantSub = async (key: string, userId: string, plan: string, userName: string) => {
    const res = await fetch(`${SUB_URL}?action=admin-grant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Key': key },
      body: JSON.stringify({ user_id: userId, plan }),
    });
    const data = await res.json();
    if (data.ok) {
      const planLabel = plan === 'week' ? 'Неделя' : plan === 'month' ? 'Месяц' : 'Год';
      toast.success(`Подписка (${planLabel}) выдана: ${userName}`);
      setShowSubDialog(false);
      fetchSubscriptions(localStorage.getItem('adminKey') || key);
      return true;
    }
    if (res.status === 403) return false;
    toast.error(data.error || 'Ошибка выдачи подписки');
    return true;
  };

  const confirmGrantSub = async () => {
    if (!subUser) return;
    setSubLoading(true);
    try {
      const key = getAdminKey();
      const ok = await doGrantSub(key, subUser.id, subPlan, subUser.name || subUser.email);
      if (!ok) {
        const entered = prompt('Введите ключ администратора (ADMIN_CLEANUP_KEY):');
        if (entered) {
          localStorage.setItem('adminKey', entered);
          await doGrantSub(entered, subUser.id, subPlan, subUser.name || subUser.email);
        }
      }
    } catch {
      toast.error('Ошибка сети');
    }
    setSubLoading(false);
  };

  const doRevokeSub = async (key: string, userId: string, userName: string) => {
    const res = await fetch(`${SUB_URL}?action=admin-revoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Key': key },
      body: JSON.stringify({ user_id: userId }),
    });
    const data = await res.json();
    if (data.ok) {
      toast.success(`Подписка отозвана: ${userName}`);
      fetchSubscriptions(localStorage.getItem('adminKey') || key);
      return true;
    }
    if (res.status === 403) return false;
    toast.error(data.error || 'Ошибка');
    return true;
  };

  const handleRevokeSub = async (user: User) => {
    try {
      const key = getAdminKey();
      const ok = await doRevokeSub(key, user.id, user.name || user.email);
      if (!ok) {
        const entered = prompt('Введите ключ администратора (ADMIN_CLEANUP_KEY):');
        if (entered) {
          localStorage.setItem('adminKey', entered);
          await doRevokeSub(entered, user.id, user.name || user.email);
        }
      }
    } catch {
      toast.error('Ошибка сети');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [searchQuery, filterStatus, filterType]);

  useEffect(() => {
    // Проверяем флаг успешного удаления при монтировании
    const deleteSuccess = sessionStorage.getItem('userDeleteSuccess');
    if (deleteSuccess) {
      sessionStorage.removeItem('userDeleteSuccess');
      // Показываем уведомление с небольшой задержкой после загрузки
      setTimeout(() => {
        toast.success('Пользователь удален');
      }, 300);
    }
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterType !== 'all') params.append('type', filterType);

      const [response] = await Promise.all([
        fetch(`https://functions.poehali.dev/f20975b5-cf6f-4ee6-9127-53f3d552589f?${params}`),
        fetchSubscriptions(localStorage.getItem('adminKey') || ''),
      ]);
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
    
    setShowDeleteDialog(false);
    setSelectedUser(null);
    
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
        // Сохраняем флаг успешного удаления перед перезагрузкой
        sessionStorage.setItem('userDeleteSuccess', 'true');
        // Принудительно перезагружаем страницу
        window.location.reload();
      } else {
        toast.error(data?.error || 'Ошибка при удалении пользователя');
        await fetchUsers();
      }
    } catch (error) {
      toast.error('Произошла ошибка при удалении пользователя');
      await fetchUsers();
    }
  };

  const handleCall = (user: User) => {
    setCallUser(user);
    setCallText('Вам поступил новый заказ на вашем сайте.');
    setShowCallDialog(true);
  };

  const handleMakeCall = async () => {
    if (!callUser?.phone) return;
    setIsCalling(true);
    try {
      const response = await fetch('https://functions.poehali.dev/5dbb4a7a-067d-4c58-805a-9e6fc53c9692', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: callUser.phone, text: callText }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(`Звонок на ${callUser.phone} совершён`);
        setShowCallDialog(false);
      } else {
        toast.error(`Ошибка звонка: ${data.error || 'неизвестная ошибка'}`);
      }
    } catch {
      toast.error('Ошибка при выполнении звонка');
    } finally {
      setIsCalling(false);
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
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => navigate('/admin/subscriptions')}
                className="gap-2 border-violet-400 text-violet-600 hover:bg-violet-50"
              >
                <Icon name="Zap" className="h-4 w-4" />
                Подписки
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/admin/deleted-users')}
                className="gap-2"
              >
                <Icon name="Archive" className="h-4 w-4" />
                История удаленных
              </Button>
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

              <UsersTable
                users={users}
                isLoading={isLoading}
                onViewDetails={handleViewDetails}
                onBlock={handleBlock}
                onUnblock={handleUnblockUser}
                onDelete={handleDelete}
                onCall={handleCall}
                onGrantSub={handleGrantSub}
                onRevokeSub={handleRevokeSub}
                subMap={subMap}
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

      <Dialog open={showCallDialog} onOpenChange={setShowCallDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Голосовой звонок</DialogTitle>
            <DialogDescription>
              Звонок на номер {callUser?.phone} ({callUser?.name})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <label className="text-sm font-medium">Текст голосового сообщения</label>
            <Textarea
              value={callText}
              onChange={(e) => setCallText(e.target.value)}
              rows={4}
              placeholder="Введите текст сообщения..."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCallDialog(false)}>Отмена</Button>
            <Button onClick={handleMakeCall} disabled={isCalling} className="gap-2">
              <Icon name="Phone" className="h-4 w-4" />
              {isCalling ? 'Звоним...' : 'Позвонить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог выдачи подписки BrainBooster */}
      <Dialog open={showSubDialog} onOpenChange={setShowSubDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Выдать подписку BrainBooster</DialogTitle>
            <DialogDescription>
              Пользователь: <strong>{subUser?.name || subUser?.email}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <label className="text-sm font-medium">Тариф</label>
            <Select value={subPlan} onValueChange={setSubPlan}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Неделя (7 дней)</SelectItem>
                <SelectItem value="month">Месяц (30 дней)</SelectItem>
                <SelectItem value="year">Год (365 дней)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Если у пользователя уже есть активная подписка — она будет продлена.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubDialog(false)}>Отмена</Button>
            <Button onClick={confirmGrantSub} disabled={subLoading} className="gap-2">
              <Icon name="Zap" className="h-4 w-4" />
              {subLoading ? 'Выдаём...' : 'Выдать подписку'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}