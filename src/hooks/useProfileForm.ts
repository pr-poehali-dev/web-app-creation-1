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
    };

    setCurrentUser(updatedUser);
    setIsEditing(false);
    setIsSaving(true);
    try {
      const typeChanged = formData.userType !== currentUser?.userType;
      const needsVerification = ['self-employed', 'entrepreneur', 'legal-entity'].includes(formData.userType || '');
      
      // Если изменился тип на тот, который требует верификации, проверяем ИНН
      if (typeChanged && needsVerification && formData.inn) {
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
            // Проверяем, есть ли детали о несоответствии ФИО
            let errorMessage = result.error || 'Не удалось проверить ИНН через ФНС';
            let errorTitle = 'Ошибка проверки ИНН';
            
            if (result.details) {
              errorTitle = '❌ ФИО не совпадает с владельцем ИНН';
              errorMessage = `Ваши данные в профиле:\n${result.details.profile_fio}\n\nВладелец ИНН по данным ФНС:\n${result.details.inn_fio}\n\n💡 Исправьте ФИО в профиле, чтобы оно совпадало с данными ФНС, или используйте ИНН на свое имя.`;
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

          // Автозаполнение данных из ФНС
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

      if (typeChanged && needsVerification) {
        const finalUser = { ...updatedUser, isVerified: false };
        updateUser(finalUser);
        setCurrentUser(finalUser);
      } else {
        updateUser(updatedUser);
      }
      
      toast({
        title: '✅ Профиль сохранен!',
        description: typeChanged && needsVerification
          ? 'Заявка на верификацию отправлена администратору.'
          : 'Ваши изменения успешно сохранены',
        duration: 2000,
      });
    } catch (error) {
      setIsEditing(true);
      setCurrentUser(currentUser);
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