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
}

export function useCreateOfferSubmit(editOffer?: Offer, isEditMode: boolean = false) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addOffer, updateOffer } = useOffers();
  const currentUser = getSession();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);

  const handleSubmit = async (
    formData: SubmitData,
    videoPreview: string,
    imagePreviews: string[],
    isDraft: boolean = false
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

      // Загружаем все изображения
      const uploadedImageUrls: string[] = [];
      if (imagePreviews.length > 0) {
        // Считаем сколько изображений нужно загрузить (только base64, не CDN URL)
        const imagesToUpload = imagePreviews.filter(img => !img.startsWith('https://'));
        
        if (imagesToUpload.length > 0) {
          toast({
            title: 'Загрузка фото...',
            description: `Загружаем ${imagesToUpload.length} фото`,
          });
        }

        for (let i = 0; i < imagePreviews.length; i++) {
          const imagePreview = imagePreviews[i];
          
          // Если это уже CDN URL - используем его как есть
          if (imagePreview.startsWith('https://')) {
            uploadedImageUrls.push(imagePreview);
            console.log(`Image ${i + 1}/${imagePreviews.length} already uploaded:`, imagePreview);
            continue;
          }
          
          try {
            console.log(`Uploading image ${i + 1}/${imagePreviews.length}...`);
            
            // Обновляем прогресс
            if (imagesToUpload.length > 1) {
              const uploadIndex = uploadedImageUrls.filter(url => url.startsWith('https://')).length + 1;
              toast({
                title: 'Загрузка фото...',
                description: `Загружаем ${uploadIndex} из ${imagesToUpload.length}`,
              });
            }
            
            const uploadResult = await offersAPI.uploadMedia(imagePreview);
            uploadedImageUrls.push(uploadResult.url);
            console.log(`Image ${i + 1}/${imagePreviews.length} uploaded:`, uploadResult.url);
            
            // Небольшая задержка между загрузками (кроме последнего)
            if (i < imagePreviews.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 300));
            }
          } catch (error) {
            console.error(`Failed to upload image ${i + 1}:`, error);
            const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
            toast({
              title: 'Ошибка загрузки фото',
              description: `Не удалось загрузить фото ${i + 1}: ${errorMessage}`,
              variant: 'destructive',
            });
            setIsSubmitting(false);
            return;
          }
        }
      }

      const offerData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        subcategory: formData.subcategory,
        quantity: Number(formData.quantity),
        minOrderQuantity: formData.minOrderQuantity ? Number(formData.minOrderQuantity) : undefined,
        unit: formData.unit,
        pricePerUnit: Number(formData.pricePerUnit),
        location: formData.location,
        district: formData.district,
        fullAddress: formData.fullAddress,
        availableDistricts: formData.availableDistricts,
        availableDeliveryTypes: formData.availableDeliveryTypes,
        deliveryTime: formData.deliveryTime,
        deliveryPeriodStart: formData.deliveryPeriodStart,
        deliveryPeriodEnd: formData.deliveryPeriodEnd,
        noNegotiation: formData.noNegotiation,
        images: uploadedImageUrls.map((url, index) => ({
          url,
          alt: `${formData.title} - изображение ${index + 1}`,
        })),
        videoUrl: videoUrl,
        isPremium: false,
        status: isDraft ? 'draft' : 'active',
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
      
      // Уведомляем всех пользователей об изменении предложений
      notifyOfferUpdated(result.id);
      
      if (isEditMode) {
        toast({
          title: 'Успешно',
          description: 'Предложение обновлено',
        });
      } else {
        addOffer(newOffer);
        toast({
          title: 'Успешно',
          description: isDraft 
            ? 'Предложение сохранено как черновик'
            : 'Предложение опубликовано',
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
    handleSubmit,
  };
}