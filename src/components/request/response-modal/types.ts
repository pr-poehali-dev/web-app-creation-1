import type { ExistingResponse } from '@/pages/RequestDetail/useRequestResponse';

export interface UploadedFile {
  url: string;
  name: string;
}

export interface ParsedComment {
  deliveryDays: string;
  comment: string;
}

export interface ServiceFormFieldsProps {
  isEditMode: boolean;
  existingParsed: ParsedComment;
  priceValue: string;
  onPriceChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  budget?: number;
  education: string;
  onEducationChange: (value: string) => void;
  uploadedDiploma: UploadedFile | null;
  diplomaFile: File | null;
  onDiplomaChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveUploadedDiploma: () => void;
  onRemoveDiplomaFile: () => void;
}

export interface GoodsFormFieldsProps {
  isEditMode: boolean;
  existingParsed: ParsedComment;
  existingResponse?: ExistingResponse | null;
  unit: string;
  quantity: number;
  pricePerUnit: number;
  uploadedCertificate: UploadedFile | null;
  certificateFile: File | null;
  onCertificateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveUploadedCertificate: () => void;
  onRemoveCertificateFile: () => void;
}

export interface FileAttachmentsProps {
  uploadedFiles: UploadedFile[];
  newFiles: File[];
  isUploading: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveNewFile: (index: number) => void;
  onRemoveUploadedFile: (index: number) => void;
}
