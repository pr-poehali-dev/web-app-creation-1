import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileInfoCard from '@/components/profile/ProfileInfoCard';
import ProfileSecurityCard from '@/components/profile/ProfileSecurityCard';
import ProfileStatsCard from '@/components/profile/ProfileStatsCard';
import ProfileVerificationCard from '@/components/profile/ProfileVerificationCard';
import NotificationSettings from '@/components/profile/NotificationSettings';
import EmailNotificationSettings from '@/components/profile/EmailNotificationSettings';
import TelegramNotificationSettings from '@/components/profile/TelegramNotificationSettings';
import ProfileEditForm from '@/components/profile/ProfileEditForm';
import ProfilePasswordForm from '@/components/profile/ProfilePasswordForm';
import { useProfileData } from '@/hooks/useProfileData';
import { useProfileForm } from '@/hooks/useProfileForm';

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

export default function Profile({ isAuthenticated, onLogout }: ProfileProps) {
  useScrollToTop();
  const [searchParams] = useSearchParams();
  const viewingUserId = searchParams.get('userId');
  const section = searchParams.get('section');
  const telegramRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (section === 'telegram' && telegramRef.current) {
      setTimeout(() => {
        telegramRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 400);
    }
  }, [section]);
  
  const {
    currentUser,
    setCurrentUser,
    isLoadingProfile,
    isViewingOwnProfile,
  } = useProfileData(isAuthenticated, viewingUserId);

  const {
    isEditing,
    isSaving,
    isChangingPassword,
    formData,
    passwordData,
    errors,
    passwordErrors,
    handleInputChange,
    handlePasswordChange,
    handleEdit,
    handleCancelEdit,
    handleSave,
    handleChangePassword,
    handleCancelChangePassword,
    handleSavePassword,
  } = useProfileForm(currentUser, setCurrentUser);

  const getInitials = () => {
    const firstInitial = currentUser?.firstName?.charAt(0) || '';
    const lastInitial = currentUser?.lastName?.charAt(0) || '';
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
              <EmailNotificationSettings />
              <div ref={telegramRef}>
                <TelegramNotificationSettings userId={String(currentUser.id)} />
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}