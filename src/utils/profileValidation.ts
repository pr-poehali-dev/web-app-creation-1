export interface FormData {
  firstName: string;
  lastName: string;
  middleName?: string;
  phone: string;
  userType?: string;
  inn?: string;
  ogrnip?: string;
  companyName?: string;
  ogrn?: string;
}

export interface FormErrors {
  firstName?: string;
  lastName?: string;
  phone?: string;
  inn?: string;
  ogrnip?: string;
  companyName?: string;
  ogrn?: string;
}

export const validatePhone = (phone: string): boolean => {
  const digitsOnly = phone.replace(/\D/g, '');
  return digitsOnly.length >= 10 && digitsOnly.length <= 15;
};

export const validateForm = (formData: FormData): { isValid: boolean; errors: FormErrors } => {
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

  if (formData.userType === 'self-employed') {
    if (!formData.inn || formData.inn.trim().length !== 12) {
      newErrors.inn = 'ИНН должен содержать 12 цифр';
    }
  }

  if (formData.userType === 'entrepreneur') {
    if (!formData.inn || formData.inn.trim().length !== 12) {
      newErrors.inn = 'ИНН должен содержать 12 цифр';
    }
    if (!formData.ogrnip || formData.ogrnip.trim().length !== 15) {
      newErrors.ogrnip = 'ОГРНИП должен содержать 15 цифр';
    }
  }

  if (formData.userType === 'legal-entity') {
    if (!formData.companyName || !formData.companyName.trim()) {
      newErrors.companyName = 'Обязательное поле';
    }
    if (!formData.inn || formData.inn.trim().length !== 10) {
      newErrors.inn = 'ИНН организации должен содержать 10 цифр';
    }
  }

  return {
    isValid: Object.keys(newErrors).length === 0,
    errors: newErrors,
  };
};

export const validatePasswordForm = (
  passwordData: { currentPassword: string; newPassword: string; confirmPassword: string },
  currentPassword: string
): { isValid: boolean; errors: Record<string, string> } => {
  const newErrors: Record<string, string> = {};

  if (!passwordData.currentPassword) {
    newErrors.currentPassword = 'Введите текущий пароль';
  } else if (passwordData.currentPassword !== currentPassword) {
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

  return {
    isValid: Object.keys(newErrors).length === 0,
    errors: newErrors,
  };
};