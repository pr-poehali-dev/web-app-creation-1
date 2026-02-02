import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';

interface AdminSupportSettingsProps {
  isLoadingSupport: boolean;
  supportType: 'email' | 'phone' | 'telegram' | 'whatsapp' | 'url';
  setSupportType: (value: 'email' | 'phone' | 'telegram' | 'whatsapp' | 'url') => void;
  supportContact: string;
  setSupportContact: (value: string) => void;
  isSavingSupport: boolean;
  handleSaveSupportSettings: () => void;
}

export default function AdminSupportSettings({
  isLoadingSupport,
  supportType,
  setSupportType,
  supportContact,
  setSupportContact,
  isSavingSupport,
  handleSaveSupportSettings
}: AdminSupportSettingsProps) {
  return (
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
                    className="h-3.5 w-3.5"
                  />
                  {supportContact || 'Контакт не указан'}
                </span>
              </div>
            </div>

            <Button 
              onClick={handleSaveSupportSettings} 
              disabled={isSavingSupport || !supportContact.trim()}
              className="w-full"
            >
              {isSavingSupport ? (
                <>
                  <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                  Сохранение...
                </>
              ) : (
                'Сохранить настройки техподдержки'
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
