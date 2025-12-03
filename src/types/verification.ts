export type VerificationType = 'legal_entity' | 'individual' | 'self_employed';
export type VerificationStatus = 'not_verified' | 'pending' | 'verified' | 'rejected';

export interface UserVerification {
  id: number;
  userId: number;
  verificationType: VerificationType;
  status: VerificationStatus;
  phone: string | null;
  phoneVerified: boolean;
  registrationAddress: string | null;
  actualAddress: string | null;
  passportScanUrl: string | null;
  utilityBillUrl: string | null;
  registrationCertUrl: string | null;
  agreementFormUrl: string | null;
  companyName: string | null;
  inn: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  verifiedAt: string | null;
}

export interface VerificationFormData {
  verificationType: VerificationType;
  phone: string;
  
  // Для физических лиц и самозанятых
  registrationAddress?: string;
  actualAddress?: string;
  addressesMatch?: boolean;
  passportScan?: File | null;
  passportRegistration?: File | null;
  utilityBill?: File | null;
  
  // Для юридических лиц
  companyName?: string;
  inn?: string;
  registrationCert?: File | null;
  agreementForm?: File | null;
}