import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export function useCreateRequestForm() {
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    subcategory: '',
    quantity: '',
    unit: 'шт',
    pricePerUnit: '',
    hasVAT: false,
    vatRate: '20',
    negotiableQuantity: false,
    negotiablePrice: false,
    deadline: '',
    deadlineStart: '',
    deadlineEnd: '',
    negotiableDeadline: false,
    budget: '',
    negotiableBudget: false,
    district: '',
    deliveryAddress: '',
    gpsCoordinates: '',
    availableDistricts: [] as string[],
    startDate: '',
    expiryDate: '',
    publicationDuration: '',
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
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>('');

  const handleInputChange = (field: string, value: string | boolean) => {
    if (field === 'expiryDate' && typeof value === 'string') {
      const startDate = formData.startDate;
      if (startDate && value && new Date(value) < new Date(startDate)) {
        toast({
          title: 'Некорректная дата',
          description: 'Дата окончания не может быть раньше даты начала',
          variant: 'destructive',
        });
        return;
      }
    }

    if (field === 'startDate' && typeof value === 'string') {
      const endDate = formData.expiryDate;
      if (endDate && value && new Date(value) > new Date(endDate)) {
        toast({
          title: 'Некорректная дата',
          description: 'Дата начала не может быть позже даты окончания',
          variant: 'destructive',
        });
        return;
      }
    }

    if (field === 'deadlineEnd' && typeof value === 'string') {
      const deadlineStart = formData.deadlineStart;
      if (deadlineStart && value && new Date(value) < new Date(deadlineStart)) {
        toast({
          title: 'Некорректная дата',
          description: 'Дата окончания работ не может быть раньше даты начала',
          variant: 'destructive',
        });
        return;
      }
    }

    if (field === 'deadlineStart' && typeof value === 'string') {
      const deadlineEnd = formData.deadlineEnd;
      if (deadlineEnd && value && new Date(value) > new Date(deadlineEnd)) {
        toast({
          title: 'Некорректная дата',
          description: 'Дата начала работ не может быть позже даты окончания',
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
        : [...prev.availableDistricts, districtId],
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
    handleImageUpload,
    handleRemoveImage,
    handleVideoUpload,
    handleRemoveVideo,
  };
}