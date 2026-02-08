import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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

interface ProfileInfoCardProps {
  email: string;
  isEditing: boolean;
  formData: FormData;
  errors: FormErrors;
  isSaving: boolean;
  userType?: string;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onInputChange: (field: keyof FormData, value: string) => void;
}

export default function ProfileInfoCard({
  email,
  isEditing,
  formData,
  errors,
  isSaving,
  userType,
  onEdit,
  onSave,
  onCancel,
  onInputChange,
}: ProfileInfoCardProps) {
  const isLegalEntity = userType === 'legal-entity';
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{isLegalEntity ? 'Должностное лицо и контакты' : 'Основная информация'}</CardTitle>
            {!isLegalEntity && (
              <CardDescription>
                Личные данные вашего профиля
              </CardDescription>
            )}
          </div>
          {!isEditing && (
            <Button variant="outline" onClick={onEdit}>
              <Icon name="Pencil" className="mr-2 h-4 w-4" />
              Редактировать
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="lastName">
              Фамилия <span className="text-destructive">*</span>
            </Label>
            {isEditing ? (
              <>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => onInputChange('lastName', e.target.value)}
                  placeholder="Введите фамилию"
                />
                {errors.lastName && (
                  <p className="text-sm text-destructive">{errors.lastName}</p>
                )}
              </>
            ) : (
              <p className="text-sm py-2">{formData.lastName || '—'}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="firstName">
              Имя <span className="text-destructive">*</span>
            </Label>
            {isEditing ? (
              <>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => onInputChange('firstName', e.target.value)}
                  placeholder="Введите имя"
                />
                {errors.firstName && (
                  <p className="text-sm text-destructive">{errors.firstName}</p>
                )}
              </>
            ) : (
              <p className="text-sm py-2">{formData.firstName || '—'}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="middleName">Отчество</Label>
          {isEditing ? (
            <Input
              id="middleName"
              value={formData.middleName}
              onChange={(e) => onInputChange('middleName', e.target.value)}
              placeholder="Введите отчество"
            />
          ) : (
            <p className="text-sm py-2">{formData.middleName || '—'}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="flex items-center gap-2">
            <Input id="email" value={email} disabled />
            <Icon name="Lock" className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">
            Email нельзя изменить
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">
            Телефон <span className="text-destructive">*</span>
          </Label>
          {isEditing ? (
            <>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => onInputChange('phone', e.target.value)}
                placeholder="+7 (999) 999-99-99"
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone}</p>
              )}
            </>
          ) : (
            <p className="text-sm py-2">{formData.phone || '—'}</p>
          )}
        </div>

        {isEditing && (
          <div className="flex gap-2 pt-4">
            <Button onClick={onSave} disabled={isSaving}>
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
            <Button variant="outline" onClick={onCancel} disabled={isSaving}>
              Отмена
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}