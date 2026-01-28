import { useEffect, useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import BackButton from '@/components/BackButton';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { useDistrict } from '@/contexts/DistrictContext';
import { DISTRICTS } from '@/data/districts';
import type { Offer } from '@/types/offer';
import { canCreateListing } from '@/utils/permissions';
import { useCreateOfferForm } from './CreateOffer/useCreateOfferForm';
import { useCreateOfferSubmit } from './CreateOffer/useCreateOfferSubmit';
import CreateOfferFormFields from './CreateOffer/CreateOfferFormFields';

interface CreateOfferProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function CreateOffer({ isAuthenticated, onLogout }: CreateOfferProps) {
  useScrollToTop();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const accessCheck = canCreateListing(isAuthenticated);
  const { districts: contextDistricts } = useDistrict();
  
  // Используем все районы для автозаполнения при выборе на карте
  const allDistricts = DISTRICTS.map(d => ({ id: d.id, name: d.name }));
  
  const [editOffer, setEditOffer] = useState<Offer | undefined>(location.state?.editOffer as Offer | undefined);
  const [isLoadingOffer, setIsLoadingOffer] = useState(false);
  const isEditMode = !!editOffer;

  useEffect(() => {
    const editOfferId = searchParams.get('edit');
    if (editOfferId && !editOffer) {
      loadOfferForEdit(editOfferId);
    }
  }, [searchParams]);

  const loadOfferForEdit = async (offerId: string) => {
    try {
      setIsLoadingOffer(true);
      const { offersAPI } = await import('@/services/api');
      const offer = await offersAPI.getOfferById(offerId);
      setEditOffer(offer);
    } catch (error) {
      console.error('Error loading offer:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить предложение',
        variant: 'destructive',
      });
      navigate('/my-orders');
    } finally {
      setIsLoadingOffer(false);
    }
  };

  useEffect(() => {
    console.log('CreateOffer: проверка верификации ОТКЛЮЧЕНА, требуется только авторизация');
    if (!accessCheck.allowed) {
      toast({
        title: "Доступ ограничен",
        description: accessCheck.message,
        variant: "destructive",
      });
      navigate('/login');
    }
  }, [accessCheck.allowed, accessCheck.message, navigate, toast]);

  const {
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
  } = useCreateOfferForm(editOffer);

  const {
    isSubmitting,
    videoUploadProgress,
    isUploadingVideo,
    handleSubmit: submitOffer,
  } = useCreateOfferSubmit(editOffer, isEditMode);

  const handleSubmit = (e: React.FormEvent, isDraft: boolean = false) => {
    e.preventDefault();
    
    // Валидация периода поставки
    if (formData.deliveryPeriodStart && formData.deliveryPeriodEnd) {
      const startDate = new Date(formData.deliveryPeriodStart);
      const endDate = new Date(formData.deliveryPeriodEnd);
      
      if (endDate <= startDate) {
        toast({
          title: "Ошибка валидации",
          description: "Дата окончания периода поставки должна быть позже даты начала",
          variant: "destructive",
        });
        return;
      }
    }
    
    const submitData = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      subcategory: formData.subcategory || undefined,
      quantity: parseFloat(formData.quantity) || 0,
      minOrderQuantity: formData.minOrderQuantity ? parseFloat(formData.minOrderQuantity) : undefined,
      unit: formData.unit,
      pricePerUnit: parseFloat(formData.pricePerUnit) || 0,
      hasVAT: formData.hasVAT,
      vatRate: formData.hasVAT ? parseFloat(formData.vatRate) || 20 : undefined,
      location: formData.fullAddress,
      district: formData.district,
      fullAddress: formData.fullAddress,
      availableDistricts: formData.availableDistricts,
      availableDeliveryTypes: formData.availableDeliveryTypes,
      deliveryTime: formData.deliveryTime || undefined,
      deliveryPeriodStart: formData.deliveryPeriodStart || undefined,
      deliveryPeriodEnd: formData.deliveryPeriodEnd || undefined,
      images: [],
      isPremium: false,
      status: isDraft ? 'draft' : 'active',
      noNegotiation: formData.noNegotiation,
    };

    submitOffer(submitData, videoPreview, imagePreviews, isDraft);
  };

  if (isLoadingOffer) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
        <main className="container mx-auto px-4 py-8 flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Загрузка предложения...</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />

      <main className="container mx-auto px-4 py-8 flex-1">
        <BackButton />
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">
              {isEditMode ? 'Редактирование предложения' : 'Создание предложения'}
            </h1>
            <p className="text-muted-foreground">
              {isEditMode ? 'Внесите необходимые изменения' : 'Заполните информацию о товаре или услуге'}
            </p>
          </div>

          <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
            <CreateOfferFormFields
              formData={formData}
              images={images}
              imagePreviews={imagePreviews}
              video={video}
              videoPreview={videoPreview}
              districts={allDistricts}
              onInputChange={handleInputChange}
              onDistrictToggle={handleDistrictToggle}
              onDeliveryTypeToggle={handleDeliveryTypeToggle}
              onImageUpload={handleImageUpload}
              onRemoveImage={handleRemoveImage}
              onVideoUpload={handleVideoUpload}
              onRemoveVideo={handleRemoveVideo}
              videoUploadProgress={videoUploadProgress}
              isUploadingVideo={isUploadingVideo}
            />

            <div className="flex flex-col gap-3">
              <Button
                type="submit"
                size="lg"
                disabled={
                  isSubmitting || 
                  !formData.title || 
                  !formData.district
                }
              >
                {isSubmitting ? (
                  <>
                    <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                    Отправка...
                  </>
                ) : (
                  <>
                    <Icon name="Send" className="mr-2 h-4 w-4" />
                    Отправить на публикацию
                  </>
                )}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={(e) => handleSubmit(e as unknown as React.FormEvent, true)}
                disabled={isSubmitting}
              >
                <Icon name="Save" className="mr-2 h-4 w-4" />
                Сохранить черновик
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                size="lg"
                onClick={() => navigate('/my-offers')}
                disabled={isSubmitting}
              >
                Отмена
              </Button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}