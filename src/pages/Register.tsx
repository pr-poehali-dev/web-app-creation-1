import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import RegisterFormFields from './Register/RegisterFormFields';
import { validateEmail, validatePhone, validateINN, validateOGRNIP, validateOGRN, validatePassword } from './Register/validators';
import type { FormData, FormErrors, RegisterProps, UserType } from './Register/types';
import { registerUser, saveSession } from '@/utils/auth';

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
  const [isFetchingCompany, setIsFetchingCompany] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchCompanyData = async (inn: string) => {
    if (inn.length !== 10) {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'ИНН должен содержать 10 цифр',
      });
      return;
    }

    setIsFetchingCompany(true);

    try {
      const response = await fetch(
        `https://functions.poehali.dev/de7c45a6-d320-45cc-8aca-719530cc640c?inn=${inn}`
      );
      const result = await response.json();

      if (result.success && result.data) {
        setFormData({
          ...formData,
          companyName: result.data.company_name || formData.companyName,
          ogrnLegal: result.data.ogrn || formData.ogrnLegal,
          legalAddress: result.data.legal_address || formData.legalAddress,
          directorName: result.data.director_name || formData.directorName,
        });
        toast({
          title: 'Успешно',
          description: 'Данные организации загружены',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Ошибка',
          description: result.error || 'Организация не найдена',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Не удалось загрузить данные организации',
      });
    } finally {
      setIsFetchingCompany(false);
    }
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
      if (!formData.directorName.trim()) newErrors.directorName = 'Обязательное поле';
      if (!formData.legalAddress.trim()) newErrors.legalAddress = 'Обязательное поле';
      if (!formData.lastName.trim()) newErrors.lastName = 'Обязательное поле';
      if (!formData.firstName.trim()) newErrors.firstName = 'Обязательное поле';
    } else {
      if (!formData.lastName.trim()) newErrors.lastName = 'Обязательное поле';
      if (!formData.firstName.trim()) newErrors.firstName = 'Обязательное поле';

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

  const handleSubmit = async (e: React.FormEvent) => {
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

    try {
      const result = await registerUser({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName.trim() || 'Пользователь',
        lastName: formData.lastName.trim() || '',
        middleName: formData.middleName?.trim(),
        userType: formData.userType,
        phone: formData.phone,
        companyName: formData.companyName?.trim(),
        inn: formData.inn?.trim(),
        ogrnip: formData.ogrnip?.trim(),
        ogrnLegal: formData.ogrnLegal?.trim(),
        position: formData.position?.trim(),
        directorName: formData.directorName?.trim(),
        legalAddress: formData.legalAddress?.trim(),
      });

      if (result.success && result.user) {
        saveSession(result.user);
        onRegister();
        toast({
          title: 'Успешно',
          description: 'Регистрация прошла успешно! Добро пожаловать!',
        });
        setTimeout(() => {
          navigate('/');
        }, 1500);
      } else {
        toast({
          variant: 'destructive',
          title: 'Ошибка',
          description: result.error || 'Не удалось завершить регистрацию',
        });
        setIsSubmitting(false);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Произошла ошибка при регистрации',
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              disabled={isSubmitting}
            >
              <Icon name="ArrowLeft" className="h-4 w-4 mr-1" />
              Назад
            </Button>
          </div>
          <CardTitle className="text-2xl">Регистрация</CardTitle>
          <CardDescription>Создайте учетную запись для доступа к платформе</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="userType">Тип пользователя</Label>
              <Select value={formData.userType} onValueChange={handleUserTypeChange} disabled={isSubmitting}>
                <SelectTrigger className={errors.userType ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Выберите тип пользователя" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Физическое лицо</SelectItem>
                  <SelectItem value="self-employed">Самозанятый</SelectItem>
                  <SelectItem value="entrepreneur">Индивидуальный предприниматель</SelectItem>
                  <SelectItem value="legal-entity">Юридическое лицо</SelectItem>
                </SelectContent>
              </Select>
              {errors.userType && <p className="text-sm text-destructive">{errors.userType}</p>}
            </div>

            <RegisterFormFields
              formData={formData}
              errors={errors}
              isSubmitting={isSubmitting}
              showPassword={showPassword}
              showConfirmPassword={showConfirmPassword}
              onInputChange={handleInputChange}
              onTogglePassword={() => setShowPassword(!showPassword)}
              onToggleConfirmPassword={() => setShowConfirmPassword(!showConfirmPassword)}
              onFetchCompanyData={fetchCompanyData}
              isFetchingCompany={isFetchingCompany}
            />

            <div className="flex gap-4">
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                    Регистрация...
                  </>
                ) : (
                  'Зарегистрироваться'
                )}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/login')} disabled={isSubmitting}>
                Войти
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}