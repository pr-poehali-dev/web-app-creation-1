import { useState } from 'react';
import type { DeliveryType, Offer } from '@/types/offer';
import { useToast } from '@/hooks/use-toast';

interface FormData {
  title: string;
  description: string;
  category: string;
  subcategory: string;
  quantity: string;
  minOrderQuantity: string;
  unit: string;
  pricePerUnit: string;
  hasVAT: boolean;
  vatRate: string;
  district: string;
  fullAddress: string;
  gpsCoordinates: string;
  availableDistricts: string[];
  availableDeliveryTypes: DeliveryType[];
  expiryDate: string;
}

export function useCreateOfferForm(editOffer?: Offer) {
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<FormData>(editOffer ? {
    title: editOffer.title || '',
    description: editOffer.description || '',
    category: editOffer.category || '',
    subcategory: editOffer.subcategory || '',
    quantity: String(editOffer.quantity || ''),
    minOrderQuantity: String(editOffer.minOrderQuantity || ''),
    unit: editOffer.unit || 'шт',
    pricePerUnit: String(editOffer.pricePerUnit || ''),
    hasVAT: editOffer.hasVAT || false,
    vatRate: String(editOffer.vatRate || '20'),
    district: editOffer.district || '',
    fullAddress: editOffer.fullAddress || '',
    gpsCoordinates: '',
    availableDistricts: editOffer.availableDistricts || [],
    availableDeliveryTypes: editOffer.availableDeliveryTypes || [],
    expiryDate: '',
  } : {
    title: '',
    description: '',
    category: '',
    subcategory: '',
    quantity: '',
    minOrderQuantity: '',
    unit: 'шт',
    pricePerUnit: '',
    hasVAT: false,
    vatRate: '20',
    district: '',
    fullAddress: '',
    gpsCoordinates: '',
    availableDistricts: [] as string[],
    availableDeliveryTypes: [] as DeliveryType[],
    expiryDate: '',
  });

  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>(
    editOffer?.images?.map(img => img.url) || []
  );
  const [video, setVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>(
    editOffer?.video?.url || ''
  );

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'category') {
      setFormData(prev => ({ ...prev, subcategory: '' }));
    }
  };

  const handleDistrictToggle = (districtId: string) => {
    setFormData(prev => ({
      ...prev,
      availableDistricts: prev.availableDistricts.includes(districtId)
        ? prev.availableDistricts.filter(d => d !== districtId)
        : [...prev.availableDistricts, districtId]
    }));
  };

  const handleDeliveryTypeToggle = (type: DeliveryType) => {
    setFormData(prev => ({
      ...prev,
      availableDeliveryTypes: prev.availableDeliveryTypes.includes(type)
        ? prev.availableDeliveryTypes.filter(t => t !== type)
        : [...prev.availableDeliveryTypes, type]
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (images.length + files.length > 10) {
      toast({
        title: 'Ошибка',
        description: 'Максимум 10 фотографий',
        variant: 'destructive',
      });
      return;
    }

    setImages(prev => [...prev, ...files]);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (video) {
      toast({
        title: 'Ошибка',
        description: 'Можно загрузить только одно видео',
        variant: 'destructive',
      });
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: 'Видео слишком большое',
        description: `Размер видео: ${(file.size / 1024 / 1024).toFixed(1)} МБ. Максимум: 10 МБ. Сожмите видео или снимите более короткое.`,
        variant: 'destructive',
      });
      return;
    }
    
    console.log(`Video size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);

    setVideo(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setVideoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveVideo = () => {
    setVideo(null);
    setVideoPreview('');
  };

  return {
    formData,
    images,
    imagePreviews,
    video,
    videoPreview,
    handleInputChange,
    handleDistrictToggle,
    handleDeliveryTypeToggle,
    handleImageUpload,
    handleRemoveImage,
    handleVideoUpload,
    handleRemoveVideo,
  };
}