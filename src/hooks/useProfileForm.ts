import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { updateUser, getJwtToken } from '@/utils/auth';
import { FormData, FormErrors, validateForm, validatePasswordForm } from '@/utils/profileValidation';
import { User } from './useProfileData';
import func2url from '../../backend/func2url.json';

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
    notificationEmail: currentUser?.notificationEmail || '',
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
        notificationEmail: currentUser.notificationEmail || '',
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
      notificationEmail: currentUser?.notificationEmail || '',
    });
    setErrors({});
  };

  const handleSave = async () => {
    const validation = validateForm(formData);
    setErrors(validation.errors);
    
    if (!validation.isValid) return;

    setIsSaving(true);
    
    try {
      const typeChanged = formData.userType !== currentUser?.userType;
      const needsVerification = ['self-employed', 'entrepreneur', 'legal-entity'].includes(formData.userType || '');
      const innChanged = formData.inn !== currentUser?.inn;
      
      // Проверяем ИНН если: 1) тип требует верификации И 2) (изменился тип ИЛИ изменился ИНН)
      if (needsVerification && formData.inn && (typeChanged || innChanged)) {
        try {
          const response = await fetch('https://functions.poehali.dev/966b73dd-99eb-4b00-aef4-ed100a06f958', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              inn: formData.inn,
              userType: formData.userType,
              userId: currentUser?.id,
              companyName: formData.companyName,
              ogrnip: formData.ogrnip,
            }),
          });

          const result = await response.json();

          if (!response.ok) {
            let errorMessage = result.error || 'Не удалось проверить ИНН через ФНС';
            let errorTitle = 'Ошибка проверки ИНН';
            
            if (result.details && result.details.profile_fio) {
              errorTitle = 'ИНН не совпадает с именем пользователя';
              errorMessage = `Ваше ФИО в профиле: ${result.details.profile_fio}\n\n💡 Исправьте ФИО в профиле, чтобы оно совпадало с данными ФНС, или используйте ИНН на свое имя.`;
            } else if (result.error && result.error.includes('не совпадает')) {
              errorTitle = 'ИНН не совпадает с именем пользователя';
            }
            
            toast({
              title: errorTitle,
              description: errorMessage,
              variant: 'destructive',
              duration: 10000,
            });
            setIsSaving(false);
            return;
          }

          if (result.verified) {
            toast({
              title: 'ИНН проверен',
              description: `Организация: ${result.verified.name}`,
            });
          }
        } catch (error) {
          toast({
            title: 'Ошибка',
            description: 'Не удалось связаться с сервисом проверки ИНН',
            variant: 'destructive',
          });
          setIsSaving(false);
          return;
        }
      }

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
        notificationEmail: formData.notificationEmail || '',
      };

      // Сохраняем профиль на сервере для всех типов пользователей
      if (currentUser?.id) {
        const token = getJwtToken();
        const saveResp = await fetch(func2url.auth, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
          body: JSON.stringify({
            action: 'update_profile',
            user_id: currentUser.id,
            firstName: formData.firstName,
            lastName: formData.lastName,
            middleName: formData.middleName,
            phone: formData.phone,
            notificationEmail: formData.notificationEmail || '',
            userType: formData.userType || currentUser.userType,
            inn: formData.inn || '',
            ogrnip: formData.ogrnip || '',
            ogrn: formData.ogrn || '',
            companyName: formData.companyName || '',
          }),
        });
        if (!saveResp.ok) {
          const err = await saveResp.json().catch(() => ({}));
          throw new Error(err.error || 'Не удалось сохранить профиль');
        }
      }

      if (typeChanged && needsVerification) {
        const finalUser = { ...updatedUser, isVerified: false };
        updateUser(finalUser);
        setCurrentUser(finalUser);
      } else {
        updateUser(updatedUser);
        setCurrentUser(updatedUser);
      }
      
      setIsEditing(false);
      toast({
        title: '✅ Профиль сохранен!',
        description: typeChanged && needsVerification
          ? 'Заявка на верификацию отправлена администратору.'
          : 'Ваши изменения успешно сохранены',
        duration: 2000,
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