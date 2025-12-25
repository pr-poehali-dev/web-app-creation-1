import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useScrollToTop } from '@/hooks/useScrollToTop';
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
import ProfileVerificationCard from '@/components/profile/ProfileVerificationCard';

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
  useScrollToTop();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const viewingUserId = searchParams.get('userId');
  const sessionUser = getSession();
  const isViewingOwnProfile = !viewingUserId || viewingUserId === String(sessionUser?.id);
  
  const [currentUser, setCurrentUser] = useState(sessionUser);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(!!viewingUserId && viewingUserId !== String(sessionUser?.id));
  
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
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (viewingUserId && viewingUserId !== String(sessionUser?.id)) {
      fetchUserProfile(viewingUserId);
    } else if (sessionUser) {
      setCurrentUser(sessionUser);
      setIsLoadingProfile(false);
    }
  }, [viewingUserId]);

  const fetchUserProfile = async (userId: string) => {
    setIsLoadingProfile(true);
    try {
      const response = await fetch(`https://functions.poehali.dev/f20975b5-cf6f-4ee6-9127-53f3d552589f?id=${userId}`, {
        headers: {
          'X-User-Id': sessionUser?.id || 'anonymous',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }
      
      const data = await response.json();
      setCurrentUser({
        id: data.id,
        email: data.email,
        firstName: data.first_name,
        lastName: data.last_name,
        middleName: data.middle_name,
        companyName: data.company_name,
        userType: data.user_type,
        phone: data.phone,
        inn: data.inn,
        ogrnip: data.ogrnip,
        ogrn: data.ogrn,
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить профиль пользователя',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingProfile(false);
    }
  };

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

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
        <main className="container mx-auto px-4 py-8 flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Загрузка профиля...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

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
            <h1 className="text-3xl font-bold text-foreground">
              {isViewingOwnProfile ? 'Мой профиль' : 'Профиль пользователя'}
            </h1>
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

            {isViewingOwnProfile && <ProfileVerificationCard />}

            {isViewingOwnProfile && (
              <Card>
                <CardHeader>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Быстрые действия</h3>
                      <p className="text-sm text-muted-foreground">Создавайте предложения и запросы</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Link to="/create-offer">
                        <Button className="w-full flex items-center justify-center gap-2">
                          <Icon name="Plus" className="h-4 w-4" />
                          Создать предложение
                        </Button>
                      </Link>
                      <Link to="/create-request">
                        <Button className="w-full flex items-center justify-center gap-2">
                          <Icon name="Plus" className="h-4 w-4" />
                          Создать запрос
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            )}

            <ProfileInfoCard
              email={currentUser.email}
              isEditing={isViewingOwnProfile && isEditing}
              formData={formData}
              errors={errors}
              isSaving={isSaving}
              userType={currentUser.userType}
              onEdit={isViewingOwnProfile ? () => setIsEditing(true) : undefined}
              onSave={handleSave}
              onCancel={handleCancel}
              onInputChange={handleInputChange}
            />

            {isViewingOwnProfile && (
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
            )}

            <ProfileStatsCard
              registrationDate={currentUser.createdAt || ''}
              formatDate={formatDate}
            />

            {isViewingOwnProfile && currentUser.email === 'doydum-invest@mail.ru' && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Администрирование</h3>
                      <p className="text-sm text-muted-foreground">Доступ к панели управления системой</p>
                    </div>
                    <Link to="/admin">
                      <Button variant="outline" className="flex items-center gap-2">
                        <Icon name="Shield" className="h-4 w-4" />
                        Админ-панель
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
              </Card>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}