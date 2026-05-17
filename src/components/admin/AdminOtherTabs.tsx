import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';

interface AdminOtherTabsProps {
  autoModeration: boolean;
  setAutoModeration: (value: boolean) => void;
  emailNotifications: boolean;
  setEmailNotifications: (value: boolean) => void;
  handleSaveSettings: () => void;
}

export default function AdminOtherTabs({
  autoModeration,
  setAutoModeration,
  emailNotifications,
  setEmailNotifications,
  handleSaveSettings
}: AdminOtherTabsProps) {
  return (
    <>
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
                Использовать ИИ для предварительной проверки контента
              </p>
            </div>
            <Switch
              id="auto-moderation"
              checked={autoModeration}
              onCheckedChange={setAutoModeration}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="banned-words">Запрещенные слова</Label>
            <Textarea
              id="banned-words"
              placeholder="Введите слова через запятую"
              className="min-h-[100px]"
            />
          </div>
          <Button onClick={handleSaveSettings}>Сохранить изменения</Button>
        </CardContent>
      </Card>

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
                Отправлять уведомления на email пользователям
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notification-template">Шаблон уведомлений</Label>
            <Textarea
              id="notification-template"
              placeholder="Введите шаблон"
              className="min-h-[100px]"
            />
          </div>
          <Button onClick={handleSaveSettings}>Сохранить изменения</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Безопасность</CardTitle>
          <CardDescription>Настройки безопасности и защиты</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="session-timeout">Время сеанса (минуты)</Label>
            <Input
              id="session-timeout"
              type="number"
              defaultValue="30"
            />
            <p className="text-sm text-muted-foreground">
              Через сколько минут неактивности пользователь будет автоматически выйден
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="max-login-attempts">Максимум попыток входа</Label>
            <Input
              id="max-login-attempts"
              type="number"
              defaultValue="5"
            />
            <p className="text-sm text-muted-foreground">
              После превышения лимита аккаунт будет временно заблокирован
            </p>
          </div>
          <Button onClick={handleSaveSettings}>Сохранить изменения</Button>
        </CardContent>
      </Card>
    </>
  );
}