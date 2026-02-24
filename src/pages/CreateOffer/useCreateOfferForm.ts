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
  deadline: string;
  negotiableDeadline: boolean;
  budget: string;
  negotiableBudget: boolean;
  district: string;
  fullAddress: string;
  gpsCoordinates: string;
  availableDistricts: string[];
  availableDeliveryTypes: DeliveryType[];
  expiryDate: string;
  noNegotiation: boolean;
  deliveryTime: string;
  deliveryPeriodStart: string;
  deliveryPeriodEnd: string;
  publicationDuration: string;
  publicationStartDate: string;
  transportServiceType: string;
  transportRoute: string;
  transportType: string;
  transportCapacity: string;
  transportDateTime: string;
  transportPrice: string;
  transportPriceType: string;
  transportNegotiable: boolean;
  transportComment: string;
  transportAllDistricts: boolean;
}

export function useCreateOfferForm(editOffer?: Offer) {
  const { toast } = useToast();
  
  const defaultDistrict = !editOffer ? (localStorage.getItem('detectedDistrictId') || '') : '';
  
  const [formData, setFormData] = useState<FormData>(editOffer ? {
    title: editOffer.title || '',
    description: editOffer.description || '',
    category: editOffer.category || '',
    subcategory: editOffer.subcategory || '',
    quantity: String(editOffer.quantity || ''),
    minOrderQuantity: String(editOffer.minOrderQuantity || ''),
    unit: editOffer.unit || 'шт',
    pricePerUnit: String(editOffer.pricePerUnit || ''),
    deadline: '',
    negotiableDeadline: false,
    budget: '',
    negotiableBudget: false,
    district: editOffer.district || '',
    fullAddress: editOffer.fullAddress || '',
    gpsCoordinates: '',
    availableDistricts: editOffer.availableDistricts || [],
    availableDeliveryTypes: editOffer.availableDeliveryTypes || [],
    expiryDate: '',
    noNegotiation: 'noNegotiation' in editOffer ? Boolean(editOffer.noNegotiation) : false,
    deliveryTime: editOffer.deliveryTime || '',
    deliveryPeriodStart: editOffer.deliveryPeriodStart || '',
    deliveryPeriodEnd: editOffer.deliveryPeriodEnd || '',
    publicationDuration: '',
    publicationStartDate: '',
    transportServiceType: editOffer.transportServiceType || '',
    transportRoute: editOffer.transportRoute || '',
    transportType: editOffer.transportType || '',
    transportCapacity: editOffer.transportCapacity || '',
    transportDateTime: editOffer.transportDateTime || '',
    transportPrice: editOffer.transportPrice || '',
    transportPriceType: editOffer.transportPriceType || '',
    transportNegotiable: editOffer.transportNegotiable || false,
    transportComment: editOffer.transportComment || '',
    transportAllDistricts: editOffer.transportAllDistricts || false,
  } : {
    title: '',
    description: '',
    category: '',
    subcategory: '',
    quantity: '',
    minOrderQuantity: '',
    unit: 'шт',
    pricePerUnit: '',
    deadline: '',
    negotiableDeadline: false,
    budget: '',
    negotiableBudget: false,
    district: defaultDistrict,
    fullAddress: '',
    gpsCoordinates: '',
    availableDistricts: [] as string[],
    availableDeliveryTypes: [] as DeliveryType[],
    expiryDate: '',
    noNegotiation: false,
    deliveryTime: '',
    deliveryPeriodStart: '',
    deliveryPeriodEnd: '',
    publicationDuration: '',
    publicationStartDate: '',
    transportServiceType: '',
    transportRoute: '',
    transportType: '',
    transportCapacity: '',
    transportDateTime: '',
    transportPrice: '',
    transportPriceType: '',
    transportNegotiable: false,
    transportComment: '',
    transportAllDistricts: false,
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
    // Валидация дат периода поставки
    if (field === 'deliveryPeriodEnd' && typeof value === 'string') {
      const startDate = formData.deliveryPeriodStart;
      if (startDate && value && new Date(value) < new Date(startDate)) {
        toast({
          title: 'Некорректная дата',
          description: 'Дата окончания не может быть раньше даты начала',
          variant: 'destructive',
        });
        return;
      }
    }
    
    if (field === 'deliveryPeriodStart' && typeof value === 'string') {
      const endDate = formData.deliveryPeriodEnd;
      if (endDate && value && new Date(value) > new Date(endDate)) {
        toast({
          title: 'Некорректная дата',
          description: 'Дата начала не может быть позже даты окончания',
          variant: 'destructive',
        });
        return;
      }
    }
    
    // Валидация дат периода публикации
    if (field === 'publicationDuration' && typeof value === 'string') {
      const startDate = formData.publicationStartDate;
      if (startDate && value && new Date(value) <= new Date(startDate)) {
        toast({
          title: 'Некорректная дата',
          description: 'Дата окончания публикации должна быть позже даты начала',
          variant: 'destructive',
        });
        return;
      }
    }
    
    if (field === 'publicationStartDate' && typeof value === 'string') {
      const endDate = formData.publicationDuration;
      if (endDate && value && new Date(value) >= new Date(endDate)) {
        toast({
          title: 'Некорректная дата',
          description: 'Дата начала публикации должна быть раньше даты окончания',
          variant: 'destructive',
        });
        return;
      }
    }
    
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'category') {
      setFormData(prev => ({
        ...prev,
        subcategory: '',
        unit: '',
      }));
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

    // Проверка размера каждого файла (макс 5 МБ)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: 'Файл слишком большой',
          description: `Файл ${file.name} превышает 5 МБ. Пожалуйста, уменьшите размер изображения.`,
          variant: 'destructive',
        });
        return;
      }
    }

    setImages(prev => [...prev, ...files]);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.onerror = () => {
        toast({
          title: 'Ошибка чтения файла',
          description: `Не удалось прочитать файл ${file.name}`,
          variant: 'destructive',
        });
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