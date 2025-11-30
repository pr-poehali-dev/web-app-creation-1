export type UserType = 'individual' | 'self-employed' | 'entrepreneur' | 'legal-entity' | '';

export interface FormData {
  userType: UserType;
  lastName: string;
  firstName: string;
  middleName: string;
  inn: string;
  ogrnip: string;
  ogrnLegal: string;
  companyName: string;
  position: string;
  directorName: string;
  legalAddress: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface FormErrors {
  [key: string]: string;
}

export interface RegisterProps {
  onRegister: () => void;
}
