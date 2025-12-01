import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ProfileSecurityCardProps {
  isChangingPassword: boolean;
  passwordData: PasswordData;
  passwordErrors: Record<string, string>;
  isSaving: boolean;
  lastLoginDate: string;
  formatDate: (date: string) => string;
  onChangePassword: () => void;
  onPasswordSave: () => void;
  onCancelPassword: () => void;
  onPasswordChange: (field: string, value: string) => void;
}

export default function ProfileSecurityCard({
  isChangingPassword,
  passwordData,
  passwordErrors,
  isSaving,
  lastLoginDate,
  formatDate,
  onChangePassword,
  onPasswordSave,
  onCancelPassword,
  onPasswordChange,
}: ProfileSecurityCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Безопасность</CardTitle>
        <CardDescription>Управление паролем и безопасностью аккаунта</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isChangingPassword ? (
          <>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Icon name="Lock" className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Пароль</p>
                  <p className="text-sm text-muted-foreground">••••••••</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={onChangePassword}>
                Изменить
              </Button>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <h3 className="font-semibold">Активные сессии</h3>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
                    <Icon name="Monitor" className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="font-medium">Текущее устройство</p>
                    <p className="text-sm text-muted-foreground">
                      Последний вход: {formatDate(lastLoginDate)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-green-500">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm">Активна</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">
                Текущий пароль <span className="text-destructive">*</span>
              </Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => onPasswordChange('currentPassword', e.target.value)}
                placeholder="Введите текущий пароль"
              />
              {passwordErrors.currentPassword && (
                <p className="text-sm text-destructive">{passwordErrors.currentPassword}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">
                Новый пароль <span className="text-destructive">*</span>
              </Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => onPasswordChange('newPassword', e.target.value)}
                placeholder="Минимум 6 символов"
              />
              {passwordErrors.newPassword && (
                <p className="text-sm text-destructive">{passwordErrors.newPassword}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                Подтвердите новый пароль <span className="text-destructive">*</span>
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => onPasswordChange('confirmPassword', e.target.value)}
                placeholder="Повторите новый пароль"
              />
              {passwordErrors.confirmPassword && (
                <p className="text-sm text-destructive">{passwordErrors.confirmPassword}</p>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={onPasswordSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Icon name="Check" className="mr-2 h-4 w-4" />
                    Сохранить
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={onCancelPassword} disabled={isSaving}>
                Отмена
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
