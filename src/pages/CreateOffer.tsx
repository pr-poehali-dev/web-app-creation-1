import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { useDistrict } from '@/contexts/DistrictContext';
import { useOffers } from '@/contexts/OffersContext';
import type { DeliveryType, Offer } from '@/types/offer';
import { getSession } from '@/utils/auth';
import OfferBasicInfoSection from '@/components/offer/OfferBasicInfoSection';
import OfferPricingSection from '@/components/offer/OfferPricingSection';
import OfferLocationSection from '@/components/offer/OfferLocationSection';
import OfferMediaSection from '@/components/offer/OfferMediaSection';

import { canCreateListing } from '@/utils/permissions';

interface CreateOfferProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function CreateOffer({ isAuthenticated, onLogout }: CreateOfferProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addOffer } = useOffers();
  const currentUser = getSession();
  const accessCheck = canCreateListing(isAuthenticated);

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
  const { districts } = useDistrict();

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
    district: '',
    fullAddress: '',
    availableDistricts: [] as string[],
    availableDeliveryTypes: [] as DeliveryType[],
    expiryDate: '',
  });

  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent, isDraft: boolean = false) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newOffer: Offer = {
        id: `offer-${Date.now()}`,
        userId: currentUser?.id || 'unknown',
        type: 'offer',
        title: formData.title,
        description: formData.description,
        category: formData.category,
        subcategory: formData.subcategory || undefined,
        quantity: parseFloat(formData.quantity) || 0,
        unit: formData.unit,
        pricePerUnit: parseFloat(formData.pricePerUnit) || 0,
        hasVAT: formData.hasVAT,
        vatRate: parseFloat(formData.vatRate) || 20,
        district: formData.district,
        fullAddress: formData.fullAddress,
        availableDistricts: formData.availableDistricts,
        availableDeliveryTypes: formData.availableDeliveryTypes,
        createdAt: new Date(),
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate) : undefined,
        views: 0,
        responses: 0,
        isPremium: false,
        images: imagePreviews.map((url, index) => ({
          id: `img-${Date.now()}-${index}`,
          url,
          alt: `${formData.title} - изображение ${index + 1}`,
        })),
        video: videoPreview ? {
          id: `video-${Date.now()}`,
          url: videoPreview,
          thumbnail: videoPreview,
        } : undefined,
        status: isDraft ? 'draft' : 'pending',
      };

      addOffer(newOffer);
      
      toast({
        title: 'Успешно',
        description: isDraft 
          ? 'Предложение сохранено как черновик'
          : 'Предложение опубликовано',
      });
      
      navigate('/my-offers');
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать предложение',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate('/my-offers')}
            className="mb-6 gap-2"
          >
            <Icon name="ArrowLeft" className="h-4 w-4" />
            Назад к предложениям
          </Button>

          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Создание предложения</h1>
            <p className="text-muted-foreground">
              Заполните информацию о товаре или услуге
            </p>
          </div>

          <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
            <OfferBasicInfoSection
              formData={{
                title: formData.title,
                description: formData.description,
                category: formData.category,
                subcategory: formData.subcategory,
              }}
              onInputChange={handleInputChange}
            />

            <OfferPricingSection
              formData={{
                quantity: formData.quantity,
                unit: formData.unit,
                pricePerUnit: formData.pricePerUnit,
                hasVAT: formData.hasVAT,
                vatRate: formData.vatRate,
              }}
              onInputChange={handleInputChange}
            />

            <OfferLocationSection
              formData={{
                district: formData.district,
                fullAddress: formData.fullAddress,
                availableDistricts: formData.availableDistricts,
                availableDeliveryTypes: formData.availableDeliveryTypes,
              }}
              districts={districts}
              onInputChange={handleInputChange}
              onDistrictToggle={handleDistrictToggle}
              onDeliveryTypeToggle={handleDeliveryTypeToggle}
            />

            <OfferMediaSection
              images={images}
              imagePreviews={imagePreviews}
              video={video}
              videoPreview={videoPreview}
              onImageUpload={handleImageUpload}
              onRemoveImage={handleRemoveImage}
              onVideoUpload={handleVideoUpload}
              onRemoveVideo={handleRemoveVideo}
            />

            <Card>
              <CardHeader>
                <CardTitle>Дополнительно</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="expiryDate">Срок годности (необязательно)</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button
                type="submit"
                size="lg"
                disabled={
                  isSubmitting || 
                  !formData.title || 
                  !formData.category || 
                  !formData.district
                }
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                    Отправка...
                  </>
                ) : (
                  <>
                    <Icon name="Send" className="mr-2 h-4 w-4" />
                    Отправить на модерацию
                  </>
                )}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={(e) => handleSubmit(e, true)}
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