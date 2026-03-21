import { useSearchParams, useNavigate } from 'react-router-dom';
import BackButton from '@/components/BackButton';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const viewingUserId = searchParams.get('userId');

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
          <BackButton />
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

          {isViewingOwnProfile && <ProfileVerificationCard />}

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

          {isViewingOwnProfile && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Car" className="h-5 w-5" />
                  Авто продажа
                </CardTitle>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="justify-start gap-2 h-auto py-3"
                  onClick={() => navigate('/my-auto-sales')}
                >
                  <Icon name="CarFront" className="h-4 w-4 text-primary flex-shrink-0" />
                  <div className="text-left">
                    <div className="font-medium">Мои продажи авто</div>
                    <div className="text-xs text-muted-foreground">Управление объявлениями о продаже</div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start gap-2 h-auto py-3"
                  onClick={() => navigate('/my-auto-requests')}
                >
                  <Icon name="Search" className="h-4 w-4 text-primary flex-shrink-0" />
                  <div className="text-left">
                    <div className="font-medium">Мои запросы авто</div>
                    <div className="text-xs text-muted-foreground">Запросы на покупку автомобилей</div>
                  </div>
                </Button>
              </CardContent>
            </Card>
          )}

          {isViewingOwnProfile && (
            <>
              <NotificationSettings userId={String(currentUser?.id ?? '')} />
              <EmailNotificationSettings />
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}