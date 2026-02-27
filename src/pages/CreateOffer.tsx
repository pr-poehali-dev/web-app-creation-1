import { useEffect, useState, useMemo } from 'react';
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
  const { districts: contextDistricts, selectedRegion } = useDistrict();
  
  // Районы только текущего региона пользователя.
  // contextDistricts заполняется асинхронно — фоллбэк: читаем регион из localStorage напрямую.
  const allDistricts = useMemo(() => {
    if (contextDistricts.length > 0) {
      return contextDistricts.map(d => ({ id: d.id, name: d.name }));
    }
    const storedRegion = selectedRegion !== 'all' ? selectedRegion : localStorage.getItem('selectedRegion');
    if (storedRegion && storedRegion !== 'all') {
      return DISTRICTS.filter(d => d.regionId === storedRegion).map(d => ({ id: d.id, name: d.name }));
    }
    return DISTRICTS.map(d => ({ id: d.id, name: d.name }));
  }, [contextDistricts, selectedRegion]);
  
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
    transportWaypoints,
    handleInputChange,
    handleDistrictToggle,
    handleDeliveryTypeToggle,
    handleImageUpload,
    handleRemoveImage,
    handleVideoUpload,
    handleRemoveVideo,
    handleAddWaypoint,
    handleRemoveWaypoint,
    handleWaypointPriceChange,
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
    
    // Валидация периода публикации
    if (formData.publicationStartDate && formData.publicationDuration) {
      const startDate = new Date(formData.publicationStartDate);
      const endDate = new Date(formData.publicationDuration);
      
      if (endDate <= startDate) {
        toast({
          title: "Ошибка валидации",
          description: "Дата окончания публикации должна быть позже даты начала",
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
      location: formData.fullAddress,
      district: formData.district,
      fullAddress: formData.fullAddress,
      availableDistricts: formData.availableDistricts,
      availableDeliveryTypes: formData.availableDeliveryTypes,
      deliveryTime: formData.deliveryTime || undefined,
      deliveryPeriodStart: formData.deliveryPeriodStart || undefined,
      deliveryPeriodEnd: formData.deliveryPeriodEnd || undefined,
      isPremium: false,
      status: isDraft ? 'draft' : 'active',
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
      transportAllDistricts: formData.transportAllDistricts,
      transportWaypoints: transportWaypoints.length > 0 ? transportWaypoints : undefined,
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
              transportWaypoints={transportWaypoints}
              onInputChange={handleInputChange}
              onDistrictToggle={handleDistrictToggle}
              onDeliveryTypeToggle={handleDeliveryTypeToggle}
              onImageUpload={handleImageUpload}
              onRemoveImage={handleRemoveImage}
              onVideoUpload={handleVideoUpload}
              onRemoveVideo={handleRemoveVideo}
              onAddWaypoint={handleAddWaypoint}
              onRemoveWaypoint={handleRemoveWaypoint}
              onWaypointPriceChange={handleWaypointPriceChange}
              videoUploadProgress={videoUploadProgress}
              isUploadingVideo={isUploadingVideo}
            />

            <div className="flex flex-col gap-3">
              <Button
                type="submit"
                size="lg"
                disabled={
                  isSubmitting ||
                  (formData.category === 'transport'
                    ? !formData.transportServiceType || !formData.transportRoute || !formData.transportType || !formData.publicationStartDate || !formData.publicationDuration
                    : !formData.title || !formData.district)
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