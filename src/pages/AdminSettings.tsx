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
import AdminSupportSettings from '@/components/admin/AdminSupportSettings';
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
  
  const [supportContact, setSupportContact] = useState('');
  const [supportType, setSupportType] = useState<'email' | 'phone' | 'telegram' | 'whatsapp' | 'url'>('email');
  const [isLoadingSupport, setIsLoadingSupport] = useState(false);
  const [isSavingSupport, setIsSavingSupport] = useState(false);
  
  const [adminsList, setAdminsList] = useState<any[]>([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'moderator' | 'admin' | 'superadmin'>('moderator');
  const [isSettingRole, setIsSettingRole] = useState(false);

  useEffect(() => {
    loadSupportSettings();
    loadAdminsList();
  }, []);

  const loadSupportSettings = async () => {
    setIsLoadingSupport(true);
    try {
      const [contactRes, typeRes] = await Promise.all([
        fetch(`${funcUrl['site-settings']}?key=support_contact`),
        fetch(`${funcUrl['site-settings']}?key=support_type`)
      ]);

      if (contactRes.ok) {
        const data = await contactRes.json();
        setSupportContact(data.setting_value || '');
      }

      if (typeRes.ok) {
        const data = await typeRes.json();
        setSupportType(data.setting_value || 'email');
      }
    } catch (error) {
      console.error('Ошибка загрузки настроек:', error);
    } finally {
      setIsLoadingSupport(false);
    }
  };

  const handleSaveSupportSettings = async () => {
    const token = getJwtToken();
    if (!token) {
      toast.error('Требуется авторизация');
      return;
    }

    setIsSavingSupport(true);
    try {
      const results = await Promise.all([
        fetch(funcUrl['site-settings'], {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            setting_key: 'support_contact',
            setting_value: supportContact
          })
        }),
        fetch(funcUrl['site-settings'], {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            setting_key: 'support_type',
            setting_value: supportType
          })
        })
      ]);

      if (results.every(r => r.ok)) {
        toast.success('Настройки техподдержки сохранены');
      } else {
        toast.error('Ошибка при сохранении настроек');
      }
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      toast.error('Не удалось сохранить настройки');
    } finally {
      setIsSavingSupport(false);
    }
  };

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
              <TabsTrigger value="support">Техподдержка</TabsTrigger>
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
              />
            </TabsContent>

            <TabsContent value="support" className="space-y-6">
              <AdminSupportSettings
                isLoadingSupport={isLoadingSupport}
                supportType={supportType}
                setSupportType={setSupportType}
                supportContact={supportContact}
                setSupportContact={setSupportContact}
                isSavingSupport={isSavingSupport}
                handleSaveSupportSettings={handleSaveSupportSettings}
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
