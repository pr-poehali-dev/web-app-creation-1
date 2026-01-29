import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { updateUser } from '@/utils/auth';
import { FormData, FormErrors, validateForm, validatePasswordForm } from '@/utils/profileValidation';
import { User } from './useProfileData';

export const useProfileForm = (
  currentUser: User | null,
  setCurrentUser: (user: User) => void
) => {
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    firstName: currentUser?.firstName || '',
    lastName: currentUser?.lastName || '',
    middleName: currentUser?.middleName || '',
    phone: currentUser?.phone || '',
    userType: currentUser?.userType || 'individual',
    inn: currentUser?.inn || '',
    ogrnip: currentUser?.ogrnip || '',
    companyName: currentUser?.companyName || '',
    ogrn: currentUser?.ogrn || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (currentUser) {
      setFormData({
        firstName: currentUser.firstName || '',
        lastName: currentUser.lastName || '',
        middleName: currentUser.middleName || '',
        phone: currentUser.phone || '',
        userType: currentUser.userType || 'individual',
        inn: currentUser.inn || '',
        ogrnip: currentUser.ogrnip || '',
        companyName: currentUser.companyName || '',
        ogrn: currentUser.ogrn || '',
      });
    }
  }, [currentUser]);

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
      inn: currentUser?.inn || '',
      ogrnip: currentUser?.ogrnip || '',
      companyName: currentUser?.companyName || '',
      ogrn: currentUser?.ogrn || '',
    });
    setErrors({});
  };

  const handleSave = async () => {
    const validation = validateForm(formData);
    setErrors(validation.errors);
    
    if (!validation.isValid) return;

    setIsSaving(true);
    try {
      const updatedUser = {
        ...currentUser,
        firstName: formData.firstName,
        lastName: formData.lastName,
        middleName: formData.middleName,
        phone: formData.phone,
        userType: formData.userType || currentUser?.userType,
        inn: formData.inn,
        ogrnip: formData.ogrnip,
        companyName: formData.companyName,
        ogrn: formData.ogrn,
        isVerified: false,
      };

      updateUser(updatedUser);
      setCurrentUser(updatedUser);
      setIsEditing(false);
      
      const typeChanged = formData.userType !== currentUser?.userType;
      
      toast({
        title: 'Успешно',
        description: typeChanged 
          ? 'Профиль обновлён. Требуется повторная верификация для нового типа аккаунта.'
          : 'Профиль обновлён',
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
    const validation = validatePasswordForm(passwordData, currentUser?.password || '');
    setPasswordErrors(validation.errors);
    
    if (!validation.isValid) return;

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

  return {
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
  };
};
