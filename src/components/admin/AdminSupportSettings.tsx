import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';

interface AdminSupportSettingsProps {
  isLoadingSupport: boolean;
  supportEmail: string;
  setSupportEmail: (value: string) => void;
  supportPhone: string;
  setSupportPhone: (value: string) => void;
  phoneContactMethod: 'whatsapp' | 'telegram' | 'call';
  setPhoneContactMethod: (value: 'whatsapp' | 'telegram' | 'call') => void;
  isSavingSupport: boolean;
  handleSaveSupportSettings: () => void;
}

export default function AdminSupportSettings({
  isLoadingSupport,
  supportEmail,
  setSupportEmail,
  supportPhone,
  setSupportPhone,
  phoneContactMethod,
  setPhoneContactMethod,
  isSavingSupport,
  handleSaveSupportSettings
}: AdminSupportSettingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Настройки техподдержки</CardTitle>
        <CardDescription>
          Укажите контакты для связи, которые будут отображаться на странице поддержки и в формах
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
              <Label htmlFor="support-email">Email для связи</Label>
              <Input
                id="support-email"
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                placeholder="support@example.com"
              />
              <p className="text-sm text-muted-foreground">
                Email для обращений пользователей
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="support-phone">Телефон горячей линии</Label>
              <Input
                id="support-phone"
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                placeholder="+7 (800) 555-35-35"
              />
              <p className="text-sm text-muted-foreground">
                Номер телефона для связи с поддержкой
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone-method">Способ связи по телефону</Label>
              <Select value={phoneContactMethod} onValueChange={(v) => setPhoneContactMethod(v as typeof phoneContactMethod)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">
                    <div className="flex items-center gap-2">
                      <Icon name="Phone" className="h-4 w-4" />
                      Звонок
                    </div>
                  </SelectItem>
                  <SelectItem value="whatsapp">
                    <div className="flex items-center gap-2">
                      <Icon name="MessageSquare" className="h-4 w-4" />
                      WhatsApp
                    </div>
                  </SelectItem>
                  <SelectItem value="telegram">
                    <div className="flex items-center gap-2">
                      <Icon name="MessageCircle" className="h-4 w-4" />
                      Telegram
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Основной способ связи, который будет выбран по умолчанию
              </p>
            </div>

            <div className="p-4 bg-primary/5 rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Icon name="Info" className="h-4 w-4" />
                Предпросмотр
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Icon name="Mail" className="h-4 w-4 text-primary" />
                  <span className="text-primary font-medium">{supportEmail || 'Email не указан'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon 
                    name={
                      phoneContactMethod === 'whatsapp' ? 'MessageSquare' :
                      phoneContactMethod === 'telegram' ? 'MessageCircle' :
                      'Phone'
                    }
                    className="h-4 w-4 text-primary" 
                  />
                  <span className="text-primary font-medium">{supportPhone || 'Телефон не указан'}</span>
                  <span className="text-muted-foreground">
                    ({phoneContactMethod === 'call' ? 'Звонок' : phoneContactMethod === 'whatsapp' ? 'WhatsApp' : 'Telegram'})
                  </span>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleSaveSupportSettings} 
              disabled={isSavingSupport || !supportEmail.trim() || !supportPhone.trim()}
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
