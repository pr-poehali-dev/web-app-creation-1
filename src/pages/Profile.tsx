import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { getSession, updateUser } from '@/utils/auth';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileInfoCard from '@/components/profile/ProfileInfoCard';
import ProfileSecurityCard from '@/components/profile/ProfileSecurityCard';
import ProfileStatsCard from '@/components/profile/ProfileStatsCard';

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
    if (!dateString) return 'Не указана';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Не указана';
      }
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return 'Не указана';
    }
  };

  const getUserTypeLabel = (type: string) => {
    return USER_TYPE_LABELS[type] || type;
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

  const handleSave = async () => {
    if (!validateForm()) {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Заполните все обязательные поля корректно',
      });
      return;
    }

    setIsSaving(true);

    try {
      const updatedUser = {
        ...currentUser,
        firstName: formData.firstName,
        lastName: formData.lastName,
        middleName: formData.middleName,
        phone: formData.phone,
      };

      const result = await updateUser(updatedUser);

      if (result.success && result.user) {
        setCurrentUser(result.user);
        setIsEditing(false);
        toast({
          title: 'Успешно',
          description: 'Данные профиля обновлены',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Ошибка',
          description: result.error || 'Не удалось обновить профиль',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Произошла ошибка при обновлении профиля',
      });
    } finally {
      setIsSaving(false);
    }
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
                <ProfileHeader
                  firstName={currentUser.firstName}
                  lastName={currentUser.lastName}
                  userType={currentUser.userType}
                  isVerified={currentUser.isVerified}
                  companyName={currentUser.companyName}
                  directorName={currentUser.directorName}
                  getInitials={getInitials}
                  getUserTypeLabel={getUserTypeLabel}
                />
              </CardHeader>
            </Card>

            <ProfileInfoCard
              email={currentUser.email}
              isEditing={isEditing}
              formData={formData}
              errors={errors}
              isSaving={isSaving}
              userType={currentUser.userType}
              onEdit={() => setIsEditing(true)}
              onSave={handleSave}
              onCancel={handleCancel}
              onInputChange={handleInputChange}
            />

            <ProfileSecurityCard
              isChangingPassword={isChangingPassword}
              passwordData={passwordData}
              passwordErrors={passwordErrors}
              isSaving={isSaving}
              lastLoginDate={currentUser.createdAt || ''}
              formatDate={formatDate}
              onChangePassword={() => setIsChangingPassword(true)}
              onPasswordSave={handlePasswordSave}
              onCancelPassword={handleCancelPassword}
              onPasswordChange={handlePasswordChange}
            />

            <ProfileStatsCard
              registrationDate={currentUser.createdAt || ''}
              formatDate={formatDate}
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}