import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ProfilePasswordFormProps {
  isChangingPassword: boolean;
  isSaving: boolean;
  passwordData: PasswordData;
  passwordErrors: Record<string, string>;
  onPasswordChange: (field: string, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function ProfilePasswordForm({
  isChangingPassword,
  isSaving,
  passwordData,
  passwordErrors,
  onPasswordChange,
  onSave,
  onCancel,
}: ProfilePasswordFormProps) {
  if (!isChangingPassword) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="Lock" className="h-5 w-5" />
          Смена пароля
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="current-password">
            Текущий пароль <span className="text-destructive">*</span>
          </Label>
          <Input
            id="current-password"
            type="password"
            value={passwordData.currentPassword}
            onChange={(e) => onPasswordChange('currentPassword', e.target.value)}
            placeholder="Введите текущий пароль"
            className={passwordErrors.currentPassword ? 'border-destructive' : ''}
          />
          {passwordErrors.currentPassword && (
            <p className="text-sm text-destructive">{passwordErrors.currentPassword}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="new-password">
            Новый пароль <span className="text-destructive">*</span>
          </Label>
          <Input
            id="new-password"
            type="password"
            value={passwordData.newPassword}
            onChange={(e) => onPasswordChange('newPassword', e.target.value)}
            placeholder="Минимум 6 символов"
            className={passwordErrors.newPassword ? 'border-destructive' : ''}
          />
          {passwordErrors.newPassword && (
            <p className="text-sm text-destructive">{passwordErrors.newPassword}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-password">
            Подтверждение пароля <span className="text-destructive">*</span>
          </Label>
          <Input
            id="confirm-password"
            type="password"
            value={passwordData.confirmPassword}
            onChange={(e) => onPasswordChange('confirmPassword', e.target.value)}
            placeholder="Повторите новый пароль"
            className={passwordErrors.confirmPassword ? 'border-destructive' : ''}
          />
          {passwordErrors.confirmPassword && (
            <p className="text-sm text-destructive">{passwordErrors.confirmPassword}</p>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Button onClick={onSave} disabled={isSaving} className="flex-1">
            {isSaving ? (
              <>
                <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                Сохранение...
              </>
            ) : (
              <>
                <Icon name="Check" className="mr-2 h-4 w-4" />
                Сохранить пароль
              </>
            )}
          </Button>
          <Button onClick={onCancel} variant="outline" disabled={isSaving}>
            Отмена
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
