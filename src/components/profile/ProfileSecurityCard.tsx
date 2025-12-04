import { useState } from 'react';
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
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={(e) => onPasswordChange('currentPassword', e.target.value)}
                  placeholder="Введите текущий пароль"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  <Icon name={showCurrentPassword ? 'EyeOff' : 'Eye'} className="h-4 w-4" />
                </button>
              </div>
              {passwordErrors.currentPassword && (
                <p className="text-sm text-destructive">{passwordErrors.currentPassword}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">
                Новый пароль <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => onPasswordChange('newPassword', e.target.value)}
                  placeholder="Минимум 6 символов"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  <Icon name={showNewPassword ? 'EyeOff' : 'Eye'} className="h-4 w-4" />
                </button>
              </div>
              {passwordErrors.newPassword && (
                <p className="text-sm text-destructive">{passwordErrors.newPassword}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                Подтвердите новый пароль <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) => onPasswordChange('confirmPassword', e.target.value)}
                  placeholder="Повторите новый пароль"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  <Icon name={showConfirmPassword ? 'EyeOff' : 'Eye'} className="h-4 w-4" />
                </button>
              </div>
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