import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';

interface FormData {
  firstName: string;
  lastName: string;
  middleName?: string;
  phone: string;
  userType?: string;
  inn?: string;
  ogrnip?: string;
  companyName?: string;
  ogrn?: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  phone?: string;
  inn?: string;
  ogrnip?: string;
  companyName?: string;
  ogrn?: string;
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
  currentUserType?: string;
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
  currentUserType,
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

        <div className="space-y-2">
          <Label htmlFor="edit-userType">
            Тип пользователя <span className="text-destructive">*</span>
          </Label>
          <Select
            value={formData.userType || currentUserType}
            onValueChange={(value) => onInputChange('userType', value)}
          >
            <SelectTrigger id="edit-userType">
              <SelectValue placeholder="Выберите тип" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="individual">Физическое лицо</SelectItem>
              <SelectItem value="self-employed">Самозанятый</SelectItem>
              <SelectItem value="entrepreneur">Индивидуальный предприниматель</SelectItem>
              <SelectItem value="legal-entity">Юридическое лицо</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Поля для самозанятого */}
        {(formData.userType || currentUserType) === 'self-employed' && (
          <div className="space-y-2">
            <Label htmlFor="edit-inn">
              ИНН <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-inn"
              value={formData.inn || ''}
              onChange={(e) => onInputChange('inn', e.target.value)}
              placeholder="Введите ИНН"
              maxLength={12}
              className={errors.inn ? 'border-destructive' : ''}
            />
            {errors.inn && (
              <p className="text-sm text-destructive">{errors.inn}</p>
            )}
            <p className="text-xs text-muted-foreground">
              ИНН самозанятого (12 цифр)
            </p>
          </div>
        )}

        {/* Поля для ИП */}
        {(formData.userType || currentUserType) === 'entrepreneur' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="edit-inn">
                ИНН <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-inn"
                value={formData.inn || ''}
                onChange={(e) => onInputChange('inn', e.target.value)}
                placeholder="Введите ИНН"
                maxLength={12}
                className={errors.inn ? 'border-destructive' : ''}
              />
              {errors.inn && (
                <p className="text-sm text-destructive">{errors.inn}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-ogrnip">
                ОГРНИП <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-ogrnip"
                value={formData.ogrnip || ''}
                onChange={(e) => onInputChange('ogrnip', e.target.value)}
                placeholder="Введите ОГРНИП"
                maxLength={15}
                className={errors.ogrnip ? 'border-destructive' : ''}
              />
              {errors.ogrnip && (
                <p className="text-sm text-destructive">{errors.ogrnip}</p>
              )}
              <p className="text-xs text-muted-foreground">
                ОГРНИП (15 цифр)
              </p>
            </div>
          </>
        )}

        {/* Поля для юридического лица */}
        {(formData.userType || currentUserType) === 'legal-entity' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="edit-companyName">
                Название организации <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-companyName"
                value={formData.companyName || ''}
                onChange={(e) => onInputChange('companyName', e.target.value)}
                placeholder="Введите полное название организации"
                className={errors.companyName ? 'border-destructive' : ''}
              />
              {errors.companyName && (
                <p className="text-sm text-destructive">{errors.companyName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-inn-legal">
                ИНН организации <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-inn-legal"
                value={formData.inn || ''}
                onChange={(e) => onInputChange('inn', e.target.value)}
                placeholder="Введите ИНН организации"
                maxLength={10}
                className={errors.inn ? 'border-destructive' : ''}
              />
              {errors.inn && (
                <p className="text-sm text-destructive">{errors.inn}</p>
              )}
              <p className="text-xs text-muted-foreground">
                ИНН организации (10 цифр)
              </p>
            </div>
          </>
        )}

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