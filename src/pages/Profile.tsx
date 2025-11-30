import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { getSession, updateUser } from '@/utils/auth';

interface ProfileProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

const USER_TYPE_LABELS: Record<string, string> = {
  individual: 'Физическое лицо',
  'self-employed': 'Самозанятый',
  entrepreneur: 'Индивидуальный предприниматель',
  'legal-entity': 'Юридическое лицо',
};

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

export default function Profile({ isAuthenticated, onLogout }: ProfileProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState(getSession());
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    firstName: currentUser?.firstName || '',
    lastName: currentUser?.lastName || '',
    middleName: currentUser?.middleName || '',
    phone: currentUser?.phone || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      navigate('/login');
    }
  }, [isAuthenticated, currentUser, navigate]);

  useEffect(() => {
    if (currentUser) {
      setFormData({
        firstName: currentUser.firstName || '',
        lastName: currentUser.lastName || '',
        middleName: currentUser.middleName || '',
        phone: currentUser.phone || '',
      });
    }
  }, [currentUser]);

  if (!currentUser) {
    return null;
  }

  const getInitials = () => {
    const firstInitial = currentUser.firstName?.charAt(0) || '';
    const lastInitial = currentUser.lastName?.charAt(0) || '';
    return `${firstInitial}${lastInitial}`.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^\+?[0-9\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Обязательное поле';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Обязательное поле';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Обязательное поле';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Некорректный номер телефона';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Введите текущий пароль';
    } else if (passwordData.currentPassword !== currentUser.password) {
      newErrors.currentPassword = 'Неверный текущий пароль';
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = 'Введите новый пароль';
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = 'Минимум 6 символов';
    }

    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Подтвердите пароль';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают';
    }

    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData({ ...passwordData, [field]: value });
    if (passwordErrors[field]) {
      setPasswordErrors({ ...passwordErrors, [field]: undefined });
    }
  };

  const handleSave = () => {
    if (!validateForm()) {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Заполните все обязательные поля корректно',
      });
      return;
    }

    setIsSaving(true);

    setTimeout(() => {
      const updatedUser = {
        ...currentUser,
        firstName: formData.firstName,
        lastName: formData.lastName,
        middleName: formData.middleName,
        phone: formData.phone,
      };

      const success = updateUser(updatedUser);

      if (success) {
        setCurrentUser(updatedUser);
        setIsEditing(false);
        toast({
          title: 'Успешно',
          description: 'Данные профиля обновлены',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Ошибка',
          description: 'Не удалось обновить профиль',
        });
      }
      setIsSaving(false);
    }, 500);
  };

  const handlePasswordSave = () => {
    if (!validatePasswordForm()) {
      return;
    }

    setIsSaving(true);

    setTimeout(() => {
      const updatedUser = {
        ...currentUser,
        password: passwordData.newPassword,
      };

      const success = updateUser(updatedUser);

      if (success) {
        setCurrentUser(updatedUser);
        setIsChangingPassword(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        toast({
          title: 'Успешно',
          description: 'Пароль успешно изменен',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Ошибка',
          description: 'Не удалось изменить пароль',
        });
      }
      setIsSaving(false);
    }, 500);
  };

  const handleCancel = () => {
    setFormData({
      firstName: currentUser.firstName || '',
      lastName: currentUser.lastName || '',
      middleName: currentUser.middleName || '',
      phone: currentUser.phone || '',
    });
    setErrors({});
    setIsEditing(false);
  };

  const handleCancelPassword = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setPasswordErrors({});
    setIsChangingPassword(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
              <Icon name="ArrowLeft" className="mr-2 h-4 w-4" />
              Назад
            </Button>
            <h1 className="text-3xl font-bold text-foreground">Мой профиль</h1>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold">
                    {getInitials()}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-2xl">
                      {currentUser.firstName} {currentUser.lastName}
                    </CardTitle>
                    <CardDescription className="text-base mt-1">
                      {currentUser.email}
                    </CardDescription>
                    <div className="mt-2">
                      <Badge variant="secondary">
                        {USER_TYPE_LABELS[currentUser.userType] || currentUser.userType}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="User" className="h-5 w-5" />
                    Личные данные
                  </CardTitle>
                  {!isEditing && (
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                      <Icon name="Pencil" className="mr-2 h-4 w-4" />
                      Редактировать
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Фамилия</Label>
                    <Input
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      disabled={!isEditing}
                      className={errors.lastName ? 'border-destructive' : ''}
                    />
                    {errors.lastName && (
                      <p className="text-sm text-destructive">{errors.lastName}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Имя</Label>
                    <Input
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      disabled={!isEditing}
                      className={errors.firstName ? 'border-destructive' : ''}
                    />
                    {errors.firstName && (
                      <p className="text-sm text-destructive">{errors.firstName}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Отчество</Label>
                  <Input
                    value={formData.middleName}
                    onChange={(e) => handleInputChange('middleName', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Не обязательно"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Тип пользователя</Label>
                  <Input
                    value={USER_TYPE_LABELS[currentUser.userType] || currentUser.userType}
                    disabled
                  />
                </div>

                {isEditing && (
                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleSave} disabled={isSaving}>
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
                    <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                      Отмена
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Phone" className="h-5 w-5" />
                  Контактная информация
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Телефон</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    disabled={!isEditing}
                    className={errors.phone ? 'border-destructive' : ''}
                  />
                  {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={currentUser.email} disabled />
                  <p className="text-xs text-muted-foreground">
                    Email нельзя изменить
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Calendar" className="h-5 w-5" />
                  Информация об аккаунте
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">Дата регистрации</span>
                  <span className="text-sm font-medium">
                    {formatDate(currentUser.registeredAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">Статус аккаунта</span>
                  <Badge variant="default" className="bg-green-500">
                    <Icon name="CheckCircle" className="mr-1 h-3 w-3" />
                    Активен
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Icon name="Key" className="h-5 w-5" />
                      Безопасность
                    </CardTitle>
                    <CardDescription>Изменение пароля</CardDescription>
                  </div>
                  {!isChangingPassword && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsChangingPassword(true)}
                    >
                      <Icon name="Key" className="mr-2 h-4 w-4" />
                      Изменить пароль
                    </Button>
                  )}
                </div>
              </CardHeader>
              {isChangingPassword && (
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Текущий пароль</Label>
                    <Input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                      className={passwordErrors.currentPassword ? 'border-destructive' : ''}
                    />
                    {passwordErrors.currentPassword && (
                      <p className="text-sm text-destructive">
                        {passwordErrors.currentPassword}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Новый пароль</Label>
                    <Input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                      className={passwordErrors.newPassword ? 'border-destructive' : ''}
                    />
                    {passwordErrors.newPassword && (
                      <p className="text-sm text-destructive">{passwordErrors.newPassword}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Подтвердите новый пароль</Label>
                    <Input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                      className={passwordErrors.confirmPassword ? 'border-destructive' : ''}
                    />
                    {passwordErrors.confirmPassword && (
                      <p className="text-sm text-destructive">
                        {passwordErrors.confirmPassword}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button onClick={handlePasswordSave} disabled={isSaving}>
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
                    <Button
                      variant="outline"
                      onClick={handleCancelPassword}
                      disabled={isSaving}
                    >
                      Отмена
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
