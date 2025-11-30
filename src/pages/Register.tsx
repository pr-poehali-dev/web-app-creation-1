import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

type UserType = 'individual' | 'self-employed' | 'entrepreneur' | 'legal-entity' | '';

interface FormData {
  userType: UserType;
  lastName: string;
  firstName: string;
  middleName: string;
  inn: string;
  ogrnip: string;
  ogrnLegal: string;
  companyName: string;
  position: string;
  directorName: string;
  legalAddress: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  [key: string]: string;
}

interface RegisterProps {
  onRegister: () => void;
}

export default function Register({ onRegister }: RegisterProps) {
  const [formData, setFormData] = useState<FormData>({
    userType: '',
    lastName: '',
    firstName: '',
    middleName: '',
    inn: '',
    ogrnip: '',
    ogrnLegal: '',
    companyName: '',
    position: '',
    directorName: '',
    legalAddress: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^(\+7|8)?[\s-]?\(?[0-9]{3}\)?[\s-]?[0-9]{3}[\s-]?[0-9]{2}[\s-]?[0-9]{2}$/;
    return phoneRegex.test(phone);
  };

  const validateINN = (inn: string, userType: UserType) => {
    if (userType === 'legal-entity') {
      return /^\d{10}$/.test(inn);
    }
    return /^\d{12}$/.test(inn);
  };

  const validateOGRNIP = (ogrnip: string) => {
    return /^\d{15}$/.test(ogrnip);
  };

  const validateOGRN = (ogrn: string) => {
    return /^\d{13}$/.test(ogrn);
  };

  const validatePassword = (password: string): { isValid: boolean; error: string } => {
    if (password.length < 6) {
      return { isValid: false, error: 'Минимум 6 символов' };
    }
    if (!/[A-ZА-ЯЁ]/.test(password)) {
      return { isValid: false, error: 'Должна быть хотя бы одна заглавная буква' };
    }
    if (!/[!@#$%^&*(),.?":{}|<>0-9]/.test(password)) {
      return { isValid: false, error: 'Должен быть спец символ или цифра' };
    }
    return { isValid: true, error: '' };
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const handleUserTypeChange = (value: UserType) => {
    setFormData({
      userType: value,
      lastName: '',
      firstName: '',
      middleName: '',
      inn: '',
      ogrnip: '',
      ogrnLegal: '',
      companyName: '',
      position: '',
      directorName: '',
      legalAddress: '',
      phone: '',
      email: '',
      password: '',
      confirmPassword: '',
    });
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.userType) {
      newErrors.userType = 'Выберите тип пользователя';
    }

    if (formData.userType === 'legal-entity') {
      if (!formData.companyName.trim()) newErrors.companyName = 'Обязательное поле';
      if (!formData.inn.trim()) {
        newErrors.inn = 'Обязательное поле';
      } else if (!validateINN(formData.inn, formData.userType)) {
        newErrors.inn = 'ИНН должен содержать 10 цифр';
      }
      if (!formData.ogrnLegal.trim()) {
        newErrors.ogrnLegal = 'Обязательное поле';
      } else if (!validateOGRN(formData.ogrnLegal)) {
        newErrors.ogrnLegal = 'ОГРН должен содержать 13 цифр';
      }
      if (!formData.position.trim()) newErrors.position = 'Обязательное поле';
      if (!formData.directorName.trim()) newErrors.directorName = 'Обязательное поле';
      if (!formData.legalAddress.trim()) newErrors.legalAddress = 'Обязательное поле';
    } else {
      if (!formData.lastName.trim()) newErrors.lastName = 'Обязательное поле';
      if (!formData.firstName.trim()) newErrors.firstName = 'Обязательное поле';
      if (!formData.middleName.trim()) newErrors.middleName = 'Обязательное поле';

      if (formData.userType === 'self-employed' || formData.userType === 'entrepreneur') {
        if (!formData.inn.trim()) {
          newErrors.inn = 'Обязательное поле';
        } else if (!validateINN(formData.inn, formData.userType)) {
          newErrors.inn = 'ИНН должен содержать 12 цифр';
        }
      }

      if (formData.userType === 'entrepreneur') {
        if (!formData.ogrnip.trim()) {
          newErrors.ogrnip = 'Обязательное поле';
        } else if (!validateOGRNIP(formData.ogrnip)) {
          newErrors.ogrnip = 'ОГРНИП должен содержать 15 цифр';
        }
      }
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Обязательное поле';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Некорректный номер телефона';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Обязательное поле';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Некорректный email';
    }

    if (!formData.password) {
      newErrors.password = 'Обязательное поле';
    } else {
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.error;
      }
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Обязательное поле';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Заполните все обязательные поля корректно',
      });
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      toast({
        title: 'Успешно',
        description: 'Регистрация прошла успешно',
      });
      onRegister();
      setTimeout(() => {
        navigate('/');
      }, 1500);
    }, 1000);
  };

  const renderFormFields = () => {
    if (!formData.userType) return null;

    return (
      <>
        {formData.userType === 'legal-entity' ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="companyName">Полное наименование организации</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                className={errors.companyName ? 'border-destructive' : ''}
                disabled={isSubmitting}
              />
              {errors.companyName && <p className="text-sm text-destructive">{errors.companyName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="inn">ИНН (10 цифр)</Label>
              <Input
                id="inn"
                value={formData.inn}
                onChange={(e) => handleInputChange('inn', e.target.value)}
                maxLength={10}
                className={errors.inn ? 'border-destructive' : ''}
                disabled={isSubmitting}
              />
              {errors.inn && <p className="text-sm text-destructive">{errors.inn}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ogrnLegal">ОГРН (13 цифр)</Label>
              <Input
                id="ogrnLegal"
                value={formData.ogrnLegal}
                onChange={(e) => handleInputChange('ogrnLegal', e.target.value)}
                maxLength={13}
                className={errors.ogrnLegal ? 'border-destructive' : ''}
                disabled={isSubmitting}
              />
              {errors.ogrnLegal && <p className="text-sm text-destructive">{errors.ogrnLegal}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">Должность руководителя</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => handleInputChange('position', e.target.value)}
                className={errors.position ? 'border-destructive' : ''}
                disabled={isSubmitting}
              />
              {errors.position && <p className="text-sm text-destructive">{errors.position}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="directorName">ФИО руководителя</Label>
              <Input
                id="directorName"
                value={formData.directorName}
                onChange={(e) => handleInputChange('directorName', e.target.value)}
                className={errors.directorName ? 'border-destructive' : ''}
                disabled={isSubmitting}
              />
              {errors.directorName && <p className="text-sm text-destructive">{errors.directorName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="legalAddress">Юридический адрес</Label>
              <Input
                id="legalAddress"
                value={formData.legalAddress}
                onChange={(e) => handleInputChange('legalAddress', e.target.value)}
                className={errors.legalAddress ? 'border-destructive' : ''}
                disabled={isSubmitting}
              />
              {errors.legalAddress && <p className="text-sm text-destructive">{errors.legalAddress}</p>}
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="lastName">Фамилия</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className={errors.lastName ? 'border-destructive' : ''}
                disabled={isSubmitting}
              />
              {errors.lastName && <p className="text-sm text-destructive">{errors.lastName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="firstName">Имя</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                className={errors.firstName ? 'border-destructive' : ''}
                disabled={isSubmitting}
              />
              {errors.firstName && <p className="text-sm text-destructive">{errors.firstName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="middleName">Отчество</Label>
              <Input
                id="middleName"
                value={formData.middleName}
                onChange={(e) => handleInputChange('middleName', e.target.value)}
                className={errors.middleName ? 'border-destructive' : ''}
                disabled={isSubmitting}
              />
              {errors.middleName && <p className="text-sm text-destructive">{errors.middleName}</p>}
            </div>

            {(formData.userType === 'self-employed' || formData.userType === 'entrepreneur') && (
              <div className="space-y-2">
                <Label htmlFor="inn">ИНН (12 цифр)</Label>
                <Input
                  id="inn"
                  value={formData.inn}
                  onChange={(e) => handleInputChange('inn', e.target.value)}
                  maxLength={12}
                  className={errors.inn ? 'border-destructive' : ''}
                  disabled={isSubmitting}
                />
                {errors.inn && <p className="text-sm text-destructive">{errors.inn}</p>}
              </div>
            )}

            {formData.userType === 'entrepreneur' && (
              <div className="space-y-2">
                <Label htmlFor="ogrnip">ОГРНИП (15 цифр)</Label>
                <Input
                  id="ogrnip"
                  value={formData.ogrnip}
                  onChange={(e) => handleInputChange('ogrnip', e.target.value)}
                  maxLength={15}
                  className={errors.ogrnip ? 'border-destructive' : ''}
                  disabled={isSubmitting}
                />
                {errors.ogrnip && <p className="text-sm text-destructive">{errors.ogrnip}</p>}
              </div>
            )}
          </>
        )}

        <div className="space-y-2">
          <Label htmlFor="phone">Номер телефона</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+7 (999) 999-99-99"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            className={errors.phone ? 'border-destructive' : ''}
            disabled={isSubmitting}
          />
          {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Электронная почта</Label>
          <Input
            id="email"
            type="email"
            placeholder="example@company.com"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className={errors.email ? 'border-destructive' : ''}
            disabled={isSubmitting}
          />
          {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Пароль</Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            className={errors.password ? 'border-destructive' : ''}
            disabled={isSubmitting}
          />
          {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>• Минимум 6 символов</p>
            <p>• Одна заглавная буква</p>
            <p>• Спец символ или цифра</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Повторите пароль</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            className={errors.confirmPassword ? 'border-destructive' : ''}
            disabled={isSubmitting}
          />
          {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
        </div>
      </>
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Icon name="UserPlus" className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Регистрация</CardTitle>
          <CardDescription>Создайте аккаунт для доступа к платформе</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userType">Тип пользователя</Label>
              <Select
                value={formData.userType}
                onValueChange={handleUserTypeChange}
                disabled={isSubmitting}
              >
                <SelectTrigger className={errors.userType ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Выберите тип пользователя" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Физ.лицо</SelectItem>
                  <SelectItem value="self-employed">Самозанятый</SelectItem>
                  <SelectItem value="entrepreneur">ИП</SelectItem>
                  <SelectItem value="legal-entity">Юр.лицо</SelectItem>
                </SelectContent>
              </Select>
              {errors.userType && <p className="text-sm text-destructive">{errors.userType}</p>}
            </div>

            {renderFormFields()}

            {formData.userType && (
              <>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                      Регистрация...
                    </>
                  ) : (
                    'Зарегистрироваться'
                  )}
                </Button>

                <div className="text-center text-sm">
                  <span className="text-muted-foreground">Уже есть аккаунт? </span>
                  <Button
                    type="button"
                    variant="link"
                    className="px-1"
                    onClick={() => navigate('/login')}
                    disabled={isSubmitting}
                  >
                    Войти
                  </Button>
                </div>
              </>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}