import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getUserFromStorage } from '@/utils/auth';
import funcUrl from '../../backend/func2url.json';

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

  useEffect(() => {
    loadSupportSettings();
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
    const user = getUserFromStorage();
    if (!user?.token) {
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
            'Authorization': `Bearer ${user.token}`
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
            'Authorization': `Bearer ${user.token}`
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
              <TabsTrigger value="support">Техподдержка</TabsTrigger>
              <TabsTrigger value="moderation">Модерация</TabsTrigger>
              <TabsTrigger value="notifications">Уведомления</TabsTrigger>
              <TabsTrigger value="telegram">Telegram</TabsTrigger>
              <TabsTrigger value="security">Безопасность</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Основные настройки</CardTitle>
                  <CardDescription>Настройка параметров площадки</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="platform-name">Название площадки</Label>
                    <Input id="platform-name" defaultValue="Единая Региональная Товарно-Торговая Площадка" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="support-email">Email поддержки</Label>
                    <Input id="support-email" type="email" defaultValue="support@platform.ru" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="support-phone">Телефон поддержки</Label>
                    <Input id="support-phone" defaultValue="+7 (800) 555-35-35" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="maintenance-mode">Режим обслуживания</Label>
                      <p className="text-sm text-muted-foreground">
                        Временно отключить доступ к площадке
                      </p>
                    </div>
                    <Switch
                      id="maintenance-mode"
                      checked={maintenanceMode}
                      onCheckedChange={setMaintenanceMode}
                    />
                  </div>
                  <Button onClick={handleSaveSettings}>Сохранить изменения</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="support" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Настройки техподдержки</CardTitle>
                  <CardDescription>
                    Укажите контакт для связи, который будет отображаться в формах входа и регистрации
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isLoadingSupport ? (
                    <div className="flex justify-center py-8">
                      <Icon name="Loader2" className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="support-type">Тип контакта</Label>
                        <Select value={supportType} onValueChange={(v) => setSupportType(v as typeof supportType)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="email">
                              <div className="flex items-center gap-2">
                                <Icon name="Mail" className="h-4 w-4" />
                                Email
                              </div>
                            </SelectItem>
                            <SelectItem value="phone">
                              <div className="flex items-center gap-2">
                                <Icon name="Phone" className="h-4 w-4" />
                                Телефон
                              </div>
                            </SelectItem>
                            <SelectItem value="telegram">
                              <div className="flex items-center gap-2">
                                <Icon name="MessageCircle" className="h-4 w-4" />
                                Telegram
                              </div>
                            </SelectItem>
                            <SelectItem value="whatsapp">
                              <div className="flex items-center gap-2">
                                <Icon name="MessageSquare" className="h-4 w-4" />
                                WhatsApp
                              </div>
                            </SelectItem>
                            <SelectItem value="url">
                              <div className="flex items-center gap-2">
                                <Icon name="ExternalLink" className="h-4 w-4" />
                                Ссылка (URL)
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">
                          Выберите, каким способом пользователи смогут связаться с вами
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="support-contact">Контакт</Label>
                        <Input
                          id="support-contact"
                          value={supportContact}
                          onChange={(e) => setSupportContact(e.target.value)}
                          placeholder={
                            supportType === 'email' ? 'support@example.com' :
                            supportType === 'phone' ? '+7 (800) 555-35-35' :
                            supportType === 'telegram' ? '@username или https://t.me/username' :
                            supportType === 'whatsapp' ? '+79991234567 или ссылка' :
                            'https://example.com/support'
                          }
                        />
                        <p className="text-sm text-muted-foreground">
                          {supportType === 'email' && 'Введите email для связи'}
                          {supportType === 'phone' && 'Введите номер телефона'}
                          {supportType === 'telegram' && 'Введите username (@username) или прямую ссылку'}
                          {supportType === 'whatsapp' && 'Введите номер телефона или ссылку на чат'}
                          {supportType === 'url' && 'Введите URL страницы поддержки или формы обратной связи'}
                        </p>
                      </div>

                      <div className="p-4 bg-primary/5 rounded-lg">
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <Icon name="Info" className="h-4 w-4" />
                          Предпросмотр
                        </h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Так будет выглядеть ссылка в формах:
                        </p>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">Нужна помощь?</span>
                          <span className="text-primary font-medium flex items-center gap-1.5">
                            <Icon
                              name={
                                supportType === 'email' ? 'Mail' :
                                supportType === 'phone' ? 'Phone' :
                                supportType === 'telegram' ? 'MessageCircle' :
                                supportType === 'whatsapp' ? 'MessageSquare' :
                                'ExternalLink'
                              }
                              className="h-4 w-4"
                            />
                            {supportType === 'email' && 'Написать в техподдержку'}
                            {supportType === 'phone' && 'Позвонить в техподдержку'}
                            {supportType === 'telegram' && 'Написать в Telegram'}
                            {supportType === 'whatsapp' && 'Написать в WhatsApp'}
                            {supportType === 'url' && 'Связаться с техподдержкой'}
                          </span>
                        </div>
                      </div>

                      <Button
                        onClick={handleSaveSupportSettings}
                        disabled={isSavingSupport || !supportContact}
                      >
                        {isSavingSupport ? (
                          <>
                            <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                            Сохранение...
                          </>
                        ) : (
                          'Сохранить настройки'
                        )}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="moderation" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Настройки модерации</CardTitle>
                  <CardDescription>Управление процессом модерации контента</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="auto-moderation">Автоматическая модерация</Label>
                      <p className="text-sm text-muted-foreground">
                        Использовать ИИ для предварительной проверки
                      </p>
                    </div>
                    <Switch
                      id="auto-moderation"
                      checked={autoModeration}
                      onCheckedChange={setAutoModeration}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="min-price">Минимальная цена предложения</Label>
                    <Input id="min-price" type="number" defaultValue="100" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max-price">Максимальная цена предложения</Label>
                    <Input id="max-price" type="number" defaultValue="10000000" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="blocked-words">Запрещенные слова (через запятую)</Label>
                    <Textarea 
                      id="blocked-words" 
                      placeholder="слово1, слово2, слово3"
                      rows={3}
                    />
                  </div>
                  <Button onClick={handleSaveSettings}>Сохранить изменения</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Настройки уведомлений</CardTitle>
                  <CardDescription>Управление системой уведомлений</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-notifications">Email уведомления</Label>
                      <p className="text-sm text-muted-foreground">
                        Отправлять уведомления на почту
                      </p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp-server">SMTP сервер</Label>
                    <Input id="smtp-server" defaultValue="smtp.yandex.ru" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp-port">SMTP порт</Label>
                    <Input id="smtp-port" type="number" defaultValue="465" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp-user">SMTP пользователь</Label>
                    <Input id="smtp-user" defaultValue="notifications@platform.ru" />
                  </div>
                  <Button onClick={handleSaveSettings}>Сохранить изменения</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="telegram" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Настройка Telegram бота</CardTitle>
                  <CardDescription>Подключение и настройка уведомлений через Telegram</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-primary/5 rounded-lg">
                    <p className="text-sm mb-2">
                      Telegram бот позволяет пользователям получать моментальные уведомления об откликах на их запросы и предложения.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Работает на всех устройствах, включая iOS. Не требует разрешений браузера.
                    </p>
                  </div>

                  <Button 
                    onClick={() => navigate('/telegram-setup')}
                    className="w-full"
                  >
                    <Icon name="Settings" className="mr-2 h-4 w-4" />
                    Открыть мастер настройки
                  </Button>

                  <div className="border-t pt-4 space-y-3">
                    <p className="text-sm font-medium">Быстрые действия:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Button 
                        variant="outline"
                        onClick={() => window.open('https://t.me/BotFather', '_blank')}
                        className="w-full"
                      >
                        <Icon name="ExternalLink" className="mr-2 h-4 w-4" />
                        Открыть BotFather
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => navigate('/telegram-setup')}
                        className="w-full"
                      >
                        <Icon name="Info" className="mr-2 h-4 w-4" />
                        Инструкция
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-500/10 text-blue-900 dark:text-blue-100 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Icon name="Info" className="h-5 w-5 flex-shrink-0 mt-0.5" />
                      <div className="text-sm space-y-2">
                        <p className="font-semibold">Статус интеграции</p>
                        <ul className="space-y-1 list-disc list-inside">
                          <li>Бот создан и задеплоен</li>
                          <li>API endpoints готовы</li>
                          <li>UI компоненты установлены</li>
                          <li>Требуется настройка вебхука</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Настройки безопасности</CardTitle>
                  <CardDescription>Параметры защиты и доступа</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="session-timeout">Время сессии (минуты)</Label>
                    <Input id="session-timeout" type="number" defaultValue="60" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max-login-attempts">Максимум попыток входа</Label>
                    <Input id="max-login-attempts" type="number" defaultValue="5" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-min-length">Минимальная длина пароля</Label>
                    <Input id="password-min-length" type="number" defaultValue="8" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="allowed-ips">Разрешенные IP для админ-панели</Label>
                    <Textarea 
                      id="allowed-ips" 
                      placeholder="127.0.0.1, 192.168.1.1"
                      rows={3}
                    />
                  </div>
                  <Button onClick={handleSaveSettings}>Сохранить изменения</Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}