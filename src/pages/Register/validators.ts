import type { UserType } from './types';

export const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string) => {
  const digitsOnly = phone.replace(/\D/g, '');
  return digitsOnly.length >= 10 && digitsOnly.length <= 15;
};

export const validateINN = (inn: string, userType: UserType) => {
  if (userType === 'legal-entity') {
    return /^\d{10}$/.test(inn);
  }
  return /^\d{12}$/.test(inn);
};

export const validateOGRNIP = (ogrnip: string) => {
  return /^\d{15}$/.test(ogrnip);
};

export const validateOGRN = (ogrn: string) => {
  return /^\d{13}$/.test(ogrn);
};

export const validatePassword = (password: string): { isValid: boolean; error: string } => {
  if (password.length < 6) {
    return { isValid: false, error: 'Минимум 6 символов' };
  }
  if (!/[A-ZА-ЯЁ]/.test(password)) {
    return { isValid: false, error: 'Должна быть хотя бы одна заглавная буква' };
  }
  if (!/[!@#$%^&*(),.?":{}|<>0-9]/.test(password)) {
    return { isValid: false, error: 'Должен быть спец символ или цифра' };
  }
  return { isValid: true, error: '' };
};