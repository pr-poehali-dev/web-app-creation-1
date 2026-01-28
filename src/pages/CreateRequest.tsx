import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import BackButton from '@/components/BackButton';
import { useScrollToTop } from '@/hooks/useScrollToTop';
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
import type { Request as RequestType } from '@/types/offer';
import { getSession } from '@/utils/auth';
import RequestBasicInfoSection from '@/components/request/RequestBasicInfoSection';
import RequestPricingSection from '@/components/request/RequestPricingSection';
import RequestDeliverySection from '@/components/request/RequestDeliverySection';
import RequestMediaSection from '@/components/request/RequestMediaSection';
import { requestsAPI } from '@/services/api';
import { markDataAsUpdated } from '@/utils/smartCache';
import { canCreateListing } from '@/utils/permissions';

interface CreateRequestProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function CreateRequest({ isAuthenticated, onLogout }: CreateRequestProps) {
  useScrollToTop();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { addRequest, updateRequest } = useOffers();
  const currentUser = getSession();
  const accessCheck = canCreateListing(isAuthenticated);
  
  const editRequest = location.state?.editRequest as RequestType | undefined;
  const isEditMode = !!editRequest;

  useEffect(() => {
    console.log('CreateRequest: проверка верификации ОТКЛЮЧЕНА, требуется только авторизация');
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
    deliveryAddress: '',
    gpsCoordinates: '',
    availableDistricts: [] as string[],
    startDate: '',
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
      const requestData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        subcategory: formData.subcategory || undefined,
        quantity: parseFloat(formData.quantity) || 0,
        unit: formData.unit,
        pricePerUnit: parseFloat(formData.pricePerUnit) || 0,
        hasVAT: formData.hasVAT,
        vatRate: formData.hasVAT ? parseFloat(formData.vatRate) || 20 : undefined,
        district: formData.district,
        deliveryAddress: formData.deliveryAddress,
        availableDistricts: formData.availableDistricts,
        images: imagePreviews.map((url, index) => ({
          url,
          alt: `${formData.title} - изображение ${index + 1}`,
        })),
        isPremium: false,
        status: isDraft ? 'draft' : 'active',
      };

      const result = await requestsAPI.createRequest(requestData);
      
      // Помечаем что запросы обновились
      markDataAsUpdated('requests');
      
      toast({
        title: 'Успешно',
        description: isDraft 
          ? 'Запрос сохранен как черновик'
          : 'Запрос опубликован',
      });
      
      navigate('/zaprosy');
    } catch (error) {
      console.error('Ошибка создания запроса:', error);
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось создать запрос',
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
        <BackButton />
        <div className="max-w-4xl mx-auto">

          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Создание запроса</h1>
            <p className="text-muted-foreground">
              Опишите что вам нужно, и поставщики пришлют свои предложения
            </p>
          </div>

          <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
            <RequestBasicInfoSection
              formData={{
                title: formData.title,
                description: formData.description,
                category: formData.category,
                subcategory: formData.subcategory,
              }}
              onInputChange={handleInputChange}
            />

            <RequestPricingSection
              formData={{
                quantity: formData.quantity,
                unit: formData.unit,
                pricePerUnit: formData.pricePerUnit,
                hasVAT: formData.hasVAT,
                vatRate: formData.vatRate,
              }}
              onInputChange={handleInputChange}
            />

            <RequestDeliverySection
              formData={{
                district: formData.district,
                deliveryAddress: formData.deliveryAddress,
                gpsCoordinates: formData.gpsCoordinates,
                availableDistricts: formData.availableDistricts,
              }}
              districts={districts}
              onInputChange={handleInputChange}
              onDistrictToggle={handleDistrictToggle}
            />

            <RequestMediaSection
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
              <CardContent className="space-y-4">
                <div>
                  <Label>Срок актуальности запроса (необязательно)</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                    <div>
                      <Label htmlFor="startDate" className="text-sm text-muted-foreground">Дата начала</Label>
                      <div className="flex gap-2">
                        <Input
                          id="startDate"
                          type="date"
                          value={formData.startDate}
                          onChange={(e) => handleInputChange('startDate', e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                        />
                        {formData.startDate && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleInputChange('startDate', '')}
                          >
                            <Icon name="X" className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="expiryDate" className="text-sm text-muted-foreground">Дата окончания</Label>
                      <div className="flex gap-2">
                        <Input
                          id="expiryDate"
                          type="date"
                          value={formData.expiryDate}
                          onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                          min={formData.startDate || new Date().toISOString().split('T')[0]}
                        />
                        {formData.expiryDate && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleInputChange('expiryDate', '')}
                          >
                            <Icon name="X" className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-3">
              <Button
                type="submit"
                size="lg"
                disabled={
                  isSubmitting || 
                  !formData.title || 
                  !formData.category || 
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
                    Опубликовать запрос
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
                onClick={() => navigate('/my-requests')}
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