import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useOffers } from '@/contexts/OffersContext';
import type { Offer } from '@/types/offer';
import { getSession } from '@/utils/auth';
import { offersAPI } from '@/services/api';
import { markDataAsUpdated } from '@/utils/smartCache';
import { notifyOfferUpdated } from '@/utils/dataSync';

interface SubmitData {
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  quantity: number;
  minOrderQuantity?: number;
  unit: string;
  pricePerUnit: number;
  location?: string;
  district: string;
  fullAddress?: string;
  availableDistricts: string[];
  availableDeliveryTypes: string[];
  deliveryTime?: string;
  deliveryPeriodStart?: string;
  deliveryPeriodEnd?: string;
  noNegotiation?: boolean;
  isPremium: boolean;
  status: string;
  transportServiceType?: string;
  transportRoute?: string;
  transportType?: string;
  transportCapacity?: string;
  transportDateTime?: string;
  transportPrice?: string;
  transportPriceType?: string;
  transportNegotiable?: boolean;
  transportComment?: string;
  transportAllDistricts?: boolean;
  transportWaypoints?: unknown;
  expiryDate?: string;
  autoMake?: string;
  autoModel?: string;
  autoYear?: string;
  autoBodyType?: string;
  autoColor?: string;
  autoFuelType?: string;
  autoTransmission?: string;
  autoDriveType?: string;
  autoMileage?: string;
  autoPtsRecords?: string;
  autoDescription?: string;
}

export function useCreateOfferSubmit(editOffer?: Offer, isEditMode: boolean = false) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addOffer, updateOffer } = useOffers();
  const currentUser = getSession();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [imageUploadCurrent, setImageUploadCurrent] = useState(0);
  const [imageUploadTotal, setImageUploadTotal] = useState(0);

  const handleSubmit = async (
    formData: SubmitData,
    videoPreview: string,
    imagePreviews: string[],
  ) => {
    setIsSubmitting(true);

    try {
      // Загружаем видео
      let videoUrl: string | undefined = undefined;
      if (videoPreview) {
        // Если это уже CDN URL - используем его как есть
        if (videoPreview.startsWith('https://')) {
          videoUrl = videoPreview;
          console.log('Video already uploaded:', videoUrl);
        } else {
          try {
            setIsUploadingVideo(true);
            setVideoUploadProgress(0);
            
            toast({
              title: 'Загрузка видео...',
              description: 'Пожалуйста, подождите',
            });
            
            const progressInterval = setInterval(() => {
              setVideoUploadProgress(prev => {
                if (prev >= 90) return prev;
                return prev + 10;
              });
            }, 200);
            
            const uploadResult = await offersAPI.uploadMedia(videoPreview);
            
            clearInterval(progressInterval);
            setVideoUploadProgress(100);
            
            videoUrl = uploadResult.url;
            console.log('Video uploaded:', videoUrl);
            
            toast({
              title: 'Видео загружено',
              description: 'Загружаем фото...',
            });
            
            setIsUploadingVideo(false);
          } catch (error) {
            console.error('Failed to upload video:', error);
            setIsUploadingVideo(false);
            setVideoUploadProgress(0);
            toast({
              title: 'Ошибка загрузки видео',
              description: error instanceof Error ? error.message : 'Попробуйте более короткое видео',
              variant: 'destructive',
            });
            setIsSubmitting(false);
            return;
          }
        }
      }

      // Загружаем все изображения параллельно
      const uploadedImageUrls: string[] = [];
      if (imagePreviews.length > 0) {
        const imagesToUpload = imagePreviews.filter(img => !img.startsWith('https://'));

        if (imagesToUpload.length > 0) {
          setIsUploadingImages(true);
          setImageUploadTotal(imagesToUpload.length);
          setImageUploadCurrent(0);
        }

        const isAutoSalePhoto = formData.category === 'auto-sale';

        // Разделяем уже загруженные и новые
        const alreadyUploaded = imagePreviews
          .map((img, i) => ({ img, i }))
          .filter(({ img }) => img.startsWith('https://'));

        const toUpload = imagePreviews
          .map((img, i) => ({ img, i }))
          .filter(({ img }) => !img.startsWith('https://'));

        // Параллельная загрузка новых фото (батчами по 3)
        const results: Array<{ i: number; url: string }> = [];

        for (const already of alreadyUploaded) {
          results.push({ i: already.i, url: already.img });
        }

        const MAX_RETRIES = 2;
        let uploadFailed = false;
        for (const { img, i } of toUpload) {
          if (uploadFailed) break;
          let lastError: unknown = null;
          let uploaded = false;
          for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
              console.log(`Uploading image ${i + 1}/${imagePreviews.length} (attempt ${attempt + 1})...`);
              const uploadResult = await offersAPI.uploadMedia(img, isAutoSalePhoto);
              setImageUploadCurrent(prev => prev + 1);
              console.log(`Image ${i + 1} uploaded:`, uploadResult.url);
              results.push({ i, url: uploadResult.url });
              uploaded = true;
              break;
            } catch (error) {
              lastError = error;
              console.warn(`Image ${i + 1} attempt ${attempt + 1} failed:`, error);
              if (attempt < MAX_RETRIES) {
                await new Promise(resolve => setTimeout(resolve, 1500));
              }
            }
          }
          if (!uploaded) {
            console.error('Failed to upload image after retries:', lastError);
            const errorMessage = lastError instanceof Error ? lastError.message : 'Неизвестная ошибка';
            setIsUploadingImages(false);
            toast({
              title: 'Ошибка загрузки фото',
              description: errorMessage,
              variant: 'destructive',
            });
            setIsSubmitting(false);
            uploadFailed = true;
          }
        }
        if (uploadFailed) return;

        // Восстанавливаем порядок
        results.sort((a, b) => a.i - b.i);
        uploadedImageUrls.push(...results.map(r => r.url));

        setIsUploadingImages(false);
      }

      const isAutoSale = formData.category === 'auto-sale';
      const autoTitle = isAutoSale
        ? [formData.autoMake, formData.autoModel, formData.autoYear].filter(Boolean).join(' ')
        : formData.title;

      const offerData = {
        title: isAutoSale ? autoTitle : formData.title,
        description: isAutoSale ? (formData.autoDescription || autoTitle) : formData.description,
        category: formData.category,
        subcategory: formData.subcategory,
        quantity: formData.category === 'transport'
          ? (Number(formData.transportCapacity) || 0)
          : 1,
        minOrderQuantity: formData.minOrderQuantity ? Number(formData.minOrderQuantity) : undefined,
        unit: isAutoSale ? 'шт' : formData.unit,
        pricePerUnit: Number(formData.pricePerUnit),
        location: formData.location,
        district: formData.district || '',
        fullAddress: formData.fullAddress,
        availableDistricts: formData.availableDistricts,
        availableDeliveryTypes: formData.availableDeliveryTypes,
        deliveryTime: formData.deliveryTime,
        deliveryPeriodStart: formData.deliveryPeriodStart,
        deliveryPeriodEnd: formData.deliveryPeriodEnd,
        noNegotiation: formData.noNegotiation,
        transportServiceType: formData.transportServiceType || undefined,
        transportRoute: formData.transportRoute || undefined,
        transportType: formData.transportType || undefined,
        transportCapacity: formData.transportCapacity || undefined,
        transportPrice: formData.transportPrice || undefined,
        transportPriceType: formData.transportPriceType || undefined,
        transportNegotiable: formData.transportNegotiable || undefined,
        transportDateTime: formData.transportDateTime || undefined,
        transportComment: formData.transportComment || undefined,
        transportWaypoints: formData.transportWaypoints || undefined,
        expiryDate: formData.expiryDate || undefined,
        autoMake: formData.autoMake || undefined,
        autoModel: formData.autoModel || undefined,
        autoYear: formData.autoYear || undefined,
        autoBodyType: formData.autoBodyType || undefined,
        autoColor: formData.autoColor || undefined,
        autoFuelType: formData.autoFuelType || undefined,
        autoTransmission: formData.autoTransmission || undefined,
        autoDriveType: formData.autoDriveType || undefined,
        autoMileage: formData.autoMileage ? Number(formData.autoMileage) : undefined,
        autoPtsRecords: formData.autoPtsRecords ? parseInt(formData.autoPtsRecords) || undefined : undefined,
        autoDescription: formData.autoDescription || undefined,
        images: uploadedImageUrls.map((url, index) => ({
          url,
          alt: `${isAutoSale ? autoTitle : formData.title} - изображение ${index + 1}`,
        })),
        videoUrl: videoUrl,
        isPremium: false,
        status: 'active',
      };
      
      const dataSize = new Blob([JSON.stringify(offerData)]).size;
      console.log(`Offer data size: ${(dataSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Images uploaded: ${uploadedImageUrls.length}, Video: ${videoUrl ? 'yes' : 'no'}`);
      console.log('Offer data to submit:', JSON.stringify(offerData, null, 2));

      toast({
        title: 'Сохранение предложения...',
        description: 'Почти готово',
      });

      console.log('Sending request to backend...');
      let result;
      try {
        if (isEditMode && editOffer) {
          result = await offersAPI.updateOffer(editOffer.id, offerData);
          result.id = editOffer.id;
        } else {
          result = await offersAPI.createOffer(offerData);
        }
        console.log('Backend response:', result);
      } catch (backendError) {
        console.error('Backend request failed:', backendError);
        console.error('Error details:', {
          name: backendError instanceof Error ? backendError.name : 'unknown',
          message: backendError instanceof Error ? backendError.message : String(backendError),
          stack: backendError instanceof Error ? backendError.stack : undefined
        });
        throw backendError; // Пробросим дальше в общий catch
      }
      
      const newOffer: Offer = {
        id: result.id,
        userId: currentUser?.id || '',
        ...offerData,
        soldQuantity: 0,
        reservedQuantity: 0,
        seller: {
          id: currentUser?.id || '',
          name: `${currentUser?.firstName} ${currentUser?.lastName}`,
          type: currentUser?.userType || 'individual',
          rating: 0,
          reviewsCount: 0,
          isVerified: currentUser?.verificationStatus === 'verified',
          phone: currentUser?.phone || '',
          email: currentUser?.email || '',
          statistics: {
            totalOffers: 0,
            activeOffers: 0,
            completedOrders: 0,
            registrationDate: new Date(),
          }
        },
        views: 0,
        createdAt: new Date(),
      };
      
      // Помечаем что предложения обновились
      markDataAsUpdated('offers');
      
      // Очищаем SmartCache для немедленного обновления списка предложений
      const { SmartCache } = await import('@/utils/smartCache');
      SmartCache.invalidate('offers_list');
      
      // Уведомляем всех пользователей об изменении предложений
      notifyOfferUpdated(result.id);
      
      // Триггер для немедленного обновления страницы после публикации
      localStorage.setItem('force_offers_reload', Date.now().toString());
      window.dispatchEvent(new Event('storage'));
      
      if (isEditMode) {
        toast({
          title: 'Успешно',
          description: 'Предложение обновлено',
        });
      } else {
        addOffer(newOffer);
        toast({
          title: 'Успешно',
          description: 'Предложение опубликовано',
        });
      }
      
      setTimeout(() => {
        if (isEditMode) {
          navigate('/my-orders', { replace: true });
        } else {
          navigate('/predlozheniya', { replace: true });
        }
      }, 500);
    } catch (error: unknown) {
      console.error('Ошибка создания предложения:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
      
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
      }
      
      // Проверяем, есть ли информация о валидации количества
      let errorMessage = error instanceof Error ? error.message : 'Не удалось создать предложение';
      
      const errorObj = error as Record<string, unknown>;
      if (errorObj?.error === 'Недостаточное количество' || (typeof errorObj?.message === 'string' && errorObj.message.includes('Недостаточное количество'))) {
        const minAllowed = (errorObj?.minAllowed as number) || 0;
        const sold = (errorObj?.sold as number) || 0;
        const reserved = (errorObj?.reserved as number) || 0;
        errorMessage = `Нельзя установить количество меньше ${minAllowed} (уже продано: ${sold}, зарезервировано: ${reserved})`;
      }
      
      toast({
        title: 'Ошибка',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    videoUploadProgress,
    isUploadingVideo,
    isUploadingImages,
    imageUploadCurrent,
    imageUploadTotal,
    handleSubmit,
  };
}