import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useOffers } from '@/contexts/OffersContext';
import type { Offer } from '@/types/offer';
import { getSession } from '@/utils/auth';
import { offersAPI } from '@/services/api';

interface SubmitData {
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  quantity: number;
  minOrderQuantity?: number;
  unit: string;
  pricePerUnit: number;
  hasVAT: boolean;
  vatRate?: number;
  location?: string;
  district: string;
  fullAddress?: string;
  availableDistricts: string[];
  availableDeliveryTypes: string[];
  images: Array<{ url: string; alt: string }>;
  videoUrl?: string;
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
          
          const uploadResult = await offersAPI.uploadVideo(videoPreview);
          
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

      // Загружаем все изображения
      const uploadedImageUrls: string[] = [];
      if (imagePreviews.length > 0) {
        toast({
          title: 'Загрузка фото...',
          description: `Загружаем ${imagePreviews.length} фото`,
        });

        for (let i = 0; i < imagePreviews.length; i++) {
          try {
            const uploadResult = await offersAPI.uploadVideo(imagePreviews[i]);
            uploadedImageUrls.push(uploadResult.url);
            console.log(`Image ${i + 1}/${imagePreviews.length} uploaded:`, uploadResult.url);
          } catch (error) {
            console.error(`Failed to upload image ${i + 1}:`, error);
            toast({
              title: 'Ошибка загрузки фото',
              description: `Не удалось загрузить фото ${i + 1}`,
              variant: 'destructive',
            });
            setIsSubmitting(false);
            return;
          }
        }
      }

      const offerData = {
        ...formData,
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

      toast({
        title: 'Сохранение предложения...',
        description: 'Почти готово',
      });

      let result;
      if (isEditMode && editOffer) {
        result = { id: editOffer.id };
        updateOffer(editOffer.id, offerData);
      } else {
        console.log('Sending offer data:', JSON.stringify(offerData, null, 2));
        result = await offersAPI.createOffer(offerData);
        console.log('Create offer result:', result);
      }
      
      const newOffer: Offer = {
        id: result.id,
        userId: currentUser?.id || '',
        ...offerData,
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
        navigate('/predlozheniya', { replace: true });
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Ошибка создания предложения:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
      
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
      }
      
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось создать предложение',
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