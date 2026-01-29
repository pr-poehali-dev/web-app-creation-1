import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';

interface FormData {
  firstName: string;
  lastName: string;
  middleName?: string;
  phone: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

interface ProfileEditFormProps {
  isEditing: boolean;
  isSaving: boolean;
  formData: FormData;
  errors: FormErrors;
  onInputChange: (field: keyof FormData, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onChangePassword: () => void;
}

export default function ProfileEditForm({
  isEditing,
  isSaving,
  formData,
  errors,
  onInputChange,
  onSave,
  onCancel,
  onChangePassword,
}: ProfileEditFormProps) {
  if (!isEditing) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="Edit" className="h-5 w-5" />
          Редактирование профиля
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="edit-firstName">
            Имя <span className="text-destructive">*</span>
          </Label>
          <Input
            id="edit-firstName"
            value={formData.firstName}
            onChange={(e) => onInputChange('firstName', e.target.value)}
            placeholder="Введите имя"
            className={errors.firstName ? 'border-destructive' : ''}
          />
          {errors.firstName && (
            <p className="text-sm text-destructive">{errors.firstName}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-lastName">
            Фамилия <span className="text-destructive">*</span>
          </Label>
          <Input
            id="edit-lastName"
            value={formData.lastName}
            onChange={(e) => onInputChange('lastName', e.target.value)}
            placeholder="Введите фамилию"
            className={errors.lastName ? 'border-destructive' : ''}
          />
          {errors.lastName && (
            <p className="text-sm text-destructive">{errors.lastName}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-middleName">Отчество</Label>
          <Input
            id="edit-middleName"
            value={formData.middleName}
            onChange={(e) => onInputChange('middleName', e.target.value)}
            placeholder="Введите отчество (необязательно)"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-phone">
            Телефон <span className="text-destructive">*</span>
          </Label>
          <Input
            id="edit-phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => onInputChange('phone', e.target.value)}
            placeholder="+7 (___) ___-__-__"
            className={errors.phone ? 'border-destructive' : ''}
          />
          {errors.phone && (
            <p className="text-sm text-destructive">{errors.phone}</p>
          )}
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Button onClick={onChangePassword} variant="outline" disabled={isSaving} className="w-full">
            <Icon name="Lock" className="mr-2 h-4 w-4" />
            Сменить пароль
          </Button>
          
          <div className="flex gap-2">
            <Button onClick={onSave} disabled={isSaving} className="flex-1">
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
            <Button onClick={onCancel} variant="outline" disabled={isSaving}>
              Отмена
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}