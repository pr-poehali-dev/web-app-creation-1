import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useToast } from '@/hooks/use-toast';
import { getSession, updateUser } from '@/utils/auth';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileInfoCard from '@/components/profile/ProfileInfoCard';
import ProfileSecurityCard from '@/components/profile/ProfileSecurityCard';
import ProfileStatsCard from '@/components/profile/ProfileStatsCard';
import ProfileVerificationCard from '@/components/profile/ProfileVerificationCard';
import NotificationSettings from '@/components/profile/NotificationSettings';
import TelegramNotificationSettings from '@/components/profile/TelegramNotificationSettings';
import EmailNotificationSettings from '@/components/profile/EmailNotificationSettings';
import ProfileListingsSection from '@/components/profile/ProfileListingsSection';
import ProfileQuickActions from '@/components/profile/ProfileQuickActions';
import ProfileEditForm from '@/components/profile/ProfileEditForm';
import ProfilePasswordForm from '@/components/profile/ProfilePasswordForm';

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
  userType?: string;
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
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    firstName: currentUser?.firstName || '',
    lastName: currentUser?.lastName || '',
    middleName: currentUser?.middleName || '',
    phone: currentUser?.phone || '',
    userType: currentUser?.userType || 'individual',
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
    } else {
      setCurrentUser(sessionUser);
      setIsLoadingProfile(false);
    }
  }, [viewingUserId, isAuthenticated]);

  const fetchUserProfile = async (userId: string) => {
    setIsLoadingProfile(true);
    setCurrentUser(null);
    
    try {
      const url = `https://functions.poehali.dev/f20975b5-cf6f-4ee6-9127-53f3d552589f?id=${userId}`;
      const response = await fetch(url, {
        headers: {
          'X-User-Id': String(sessionUser?.id || 'anonymous'),
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend error:', errorText);
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
        createdAt: data.created_at,
        isVerified: false,
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить профиль пользователя',
        variant: 'destructive',
      });
      navigate(-1);
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
        userType: currentUser.userType || 'individual',
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

  const handleEdit = () => {
    setIsEditing(true);
    setIsChangingPassword(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData({
      firstName: currentUser?.firstName || '',
      lastName: currentUser?.lastName || '',
      middleName: currentUser?.middleName || '',
      phone: currentUser?.phone || '',
      userType: currentUser?.userType || 'individual',
    });
    setErrors({});
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const updatedUser = {
        ...currentUser,
        firstName: formData.firstName,
        lastName: formData.lastName,
        middleName: formData.middleName,
        phone: formData.phone,
        userType: formData.userType || currentUser.userType,
      };

      updateUser(updatedUser);
      setCurrentUser(updatedUser);
      setIsEditing(false);
      toast({
        title: 'Успешно',
        description: 'Профиль обновлён',
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить профиль',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = () => {
    setIsChangingPassword(true);
    setIsEditing(false);
  };

  const handleCancelChangePassword = () => {
    setIsChangingPassword(false);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setPasswordErrors({});
  };

  const handleSavePassword = async () => {
    if (!validatePasswordForm()) return;

    setIsSaving(true);
    try {
      const updatedUser = {
        ...currentUser,
        password: passwordData.newPassword,
      };

      updateUser(updatedUser);
      setCurrentUser(updatedUser);
      setIsChangingPassword(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      toast({
        title: 'Успешно',
        description: 'Пароль изменён',
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось изменить пароль',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-4xl mx-auto space-y-6">
          <ProfileHeader
            firstName={currentUser.firstName || ''}
            lastName={currentUser.lastName || ''}
            userType={currentUser.userType || ''}
            isVerified={currentUser.isVerified || false}
            companyName={currentUser.companyName}
            directorName={`${currentUser.firstName || ''} ${currentUser.lastName || ''}`}
            getInitials={getInitials}
            getUserTypeLabel={getUserTypeLabel}
            isViewingOwnProfile={isViewingOwnProfile}
            onEdit={handleEdit}
          />

          <ProfileEditForm
            isEditing={isEditing}
            isSaving={isSaving}
            formData={formData}
            errors={errors}
            onInputChange={handleInputChange}
            onSave={handleSave}
            onCancel={handleCancelEdit}
            onChangePassword={handleChangePassword}
            currentUserType={currentUser.userType}
          />

          <ProfilePasswordForm
            isChangingPassword={isChangingPassword}
            isSaving={isSaving}
            passwordData={passwordData}
            passwordErrors={passwordErrors}
            onPasswordChange={handlePasswordChange}
            onSave={handleSavePassword}
            onCancel={handleCancelChangePassword}
          />

          {!isEditing && (
            <ProfileInfoCard
              email={currentUser.email || ''}
              isEditing={false}
              formData={formData}
              errors={errors}
              isSaving={isSaving}
              userType={currentUser.userType}
              onEdit={handleEdit}
              onSave={handleSave}
              onCancel={handleCancelEdit}
              onInputChange={handleInputChange}
            />
          )}

          {isViewingOwnProfile && !isChangingPassword && (
            <ProfileSecurityCard
              isChangingPassword={false}
              passwordData={passwordData}
              passwordErrors={passwordErrors}
              isSaving={isSaving}
              lastLoginDate={currentUser.createdAt || ''}
              formatDate={formatDate}
              onChangePassword={handleChangePassword}
              onPasswordSave={handleSavePassword}
              onCancelPassword={handleCancelChangePassword}
              onPasswordChange={handlePasswordChange}
            />
          )}

          <ProfileStatsCard
            registrationDate={currentUser.createdAt || ''}
            formatDate={formatDate}
          />

          {isViewingOwnProfile && <ProfileVerificationCard />}

          {isViewingOwnProfile && (
            <>
              <NotificationSettings />
              <TelegramNotificationSettings />
              <EmailNotificationSettings />
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}