import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getJwtToken } from '@/utils/auth';
import funcUrl from '../../backend/func2url.json';

import AdminGeneralSettings from '@/components/admin/AdminGeneralSettings';
import AdminRolesManagement from '@/components/admin/AdminRolesManagement';

import AdminOtherTabs from '@/components/admin/AdminOtherTabs';

interface AdminSettingsProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function AdminSettings({ isAuthenticated, onLogout }: AdminSettingsProps) {
  const navigate = useNavigate();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [autoModeration, setAutoModeration] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  

  
  const [adminsList, setAdminsList] = useState<any[]>([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'moderator' | 'admin' | 'superadmin'>('moderator');
  const [isSettingRole, setIsSettingRole] = useState(false);
  const [foundUser, setFoundUser] = useState<any>(null);
  const [isSearchingUser, setIsSearchingUser] = useState(false);

  useEffect(() => {
    loadAdminsList();
  }, []);



  const loadAdminsList = async () => {
    setIsLoadingAdmins(true);
    try {
      const token = getJwtToken();
      const response = await fetch(funcUrl['admin-roles'], {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAdminsList(data.admins || []);
      } else {
        toast.error('Не удалось загрузить список администраторов');
      }
    } catch (error) {
      console.error('Ошибка загрузки администраторов:', error);
      toast.error('Ошибка загрузки данных');
    } finally {
      setIsLoadingAdmins(false);
    }
  };

  const handleSearchUser = async (email: string) => {
    if (!email.trim()) {
      setFoundUser(null);
      return;
    }

    setIsSearchingUser(true);
    try {
      const token = getJwtToken();
      const response = await fetch(`${funcUrl['admin-search-user']}?email=${encodeURIComponent(email)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFoundUser(data.user);
      } else {
        const data = await response.json();
        if (response.status === 404) {
          toast.error('Пользователь с таким email не найден');
        } else {
          toast.error(data.error || 'Ошибка поиска пользователя');
        }
        setFoundUser(null);
      }
    } catch (error) {
      console.error('Ошибка поиска:', error);
      toast.error('Не удалось найти пользователя');
      setFoundUser(null);
    } finally {
      setIsSearchingUser(false);
    }
  };

  const handleSetRole = async () => {
    if (!newAdminEmail.trim()) {
      toast.error('Введите email пользователя');
      return;
    }

    setIsSettingRole(true);
    try {
      const token = getJwtToken();
      const response = await fetch(funcUrl['admin-roles'], {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'set_role',
          email: newAdminEmail,
          role: newAdminRole
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Роль успешно изменена');
        setNewAdminEmail('');
        setFoundUser(null);
        loadAdminsList();
      } else {
        toast.error(data.error || 'Ошибка изменения роли');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      toast.error('Не удалось изменить роль');
    } finally {
      setIsSettingRole(false);
    }
  };

  const handleSaveSettings = () => {
    toast.success('Настройки сохранены');
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-8">
            <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2">
              <Icon name="ArrowLeft" className="mr-2 h-4 w-4" />
              Назад
            </Button>
            <h1 className="text-3xl font-bold">Настройки системы</h1>
            <p className="text-muted-foreground">Конфигурация торговой площадки</p>
          </div>

          <Tabs defaultValue="general" className="space-y-6">
            <TabsList>
              <TabsTrigger value="general">Общие</TabsTrigger>
              <TabsTrigger value="admins">Администраторы</TabsTrigger>
              <TabsTrigger value="moderation">Модерация</TabsTrigger>
              <TabsTrigger value="notifications">Уведомления</TabsTrigger>
              <TabsTrigger value="telegram">Telegram</TabsTrigger>
              <TabsTrigger value="security">Безопасность</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6">
              <AdminGeneralSettings
                maintenanceMode={maintenanceMode}
                setMaintenanceMode={setMaintenanceMode}
                handleSaveSettings={handleSaveSettings}
              />
            </TabsContent>

            <TabsContent value="admins" className="space-y-6">
              <AdminRolesManagement
                adminsList={adminsList}
                isLoadingAdmins={isLoadingAdmins}
                newAdminEmail={newAdminEmail}
                setNewAdminEmail={setNewAdminEmail}
                newAdminRole={newAdminRole}
                setNewAdminRole={setNewAdminRole}
                isSettingRole={isSettingRole}
                handleSetRole={handleSetRole}
                foundUser={foundUser}
                isSearchingUser={isSearchingUser}
                handleSearchUser={handleSearchUser}
              />
            </TabsContent>



            <TabsContent value="moderation" className="space-y-6">
              <AdminOtherTabs
                autoModeration={autoModeration}
                setAutoModeration={setAutoModeration}
                emailNotifications={emailNotifications}
                setEmailNotifications={setEmailNotifications}
                handleSaveSettings={handleSaveSettings}
              />
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <AdminOtherTabs
                autoModeration={autoModeration}
                setAutoModeration={setAutoModeration}
                emailNotifications={emailNotifications}
                setEmailNotifications={setEmailNotifications}
                handleSaveSettings={handleSaveSettings}
              />
            </TabsContent>

            <TabsContent value="telegram" className="space-y-6">
              <AdminOtherTabs
                autoModeration={autoModeration}
                setAutoModeration={setAutoModeration}
                emailNotifications={emailNotifications}
                setEmailNotifications={setEmailNotifications}
                handleSaveSettings={handleSaveSettings}
              />
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <AdminOtherTabs
                autoModeration={autoModeration}
                setAutoModeration={setAutoModeration}
                emailNotifications={emailNotifications}
                setEmailNotifications={setEmailNotifications}
                handleSaveSettings={handleSaveSettings}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}