import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '@/components/BackButton';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { useDistrict } from '@/contexts/DistrictContext';
import { getSession } from '@/utils/auth';
import AuctionBasicInfoSection from '@/components/auction/AuctionBasicInfoSection';
import AuctionPricingSection from '@/components/auction/AuctionPricingSection';
import AuctionScheduleSection from '@/components/auction/AuctionScheduleSection';
import AuctionLocationSection from '@/components/auction/AuctionLocationSection';
import AuctionMediaSection from '@/components/auction/AuctionMediaSection';

interface CreateAuctionProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function CreateAuction({ isAuthenticated, onLogout }: CreateAuctionProps) {
  useScrollToTop();
  const navigate = useNavigate();
  const { toast } = useToast();
  const currentUser = getSession();
  const { districts } = useDistrict();
  const [verificationStatus, setVerificationStatus] = useState<string>('');
  const [isCheckingVerification, setIsCheckingVerification] = useState(true);

  const checkVerificationStatus = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) return;

      const response = await fetch('https://functions.poehali.dev/1c97f222-fdea-4b59-b941-223ee8bb077b', {
        headers: {
          'X-User-Id': userId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setVerificationStatus(data.verificationStatus);
      }
    } catch (error) {
      console.error('Error checking verification:', error);
    } finally {
      setIsCheckingVerification(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: 'Требуется авторизация',
        description: 'Для создания аукциона необходимо войти в систему',
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }

    checkVerificationStatus();
  }, [isAuthenticated, navigate, toast]);

  useEffect(() => {
    if (!isCheckingVerification && verificationStatus !== 'verified') {
      toast({
        title: 'Требуется верификация',
        description: verificationStatus === 'pending' 
          ? 'Верификация вашей учётной записи на рассмотрении. После одобрения верификации вам будут доступны все возможности.'
          : 'Для создания аукциона необходимо пройти верификацию. Перейдите в профиль и подайте заявку на верификацию.',
        variant: 'destructive',
        duration: 8000,
      });
      navigate('/auction');
    }
  }, [isCheckingVerification, verificationStatus, navigate, toast]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    subcategory: '',
    quantity: '',
    unit: 'шт',
    startingPrice: '',
    minBidStep: '',
    buyNowPrice: '',
    hasVAT: false,
    vatRate: '20',
    district: '',
    fullAddress: '',
    gpsCoordinates: '',
    availableDistricts: [] as string[],
    availableDeliveryTypes: [] as ('pickup' | 'delivery')[],
    startDate: '',
    startTime: '',
    duration: '3',
  });

  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Если меняется район местонахождения и у нас уже выбран способ получения
      if (field === 'district' && typeof value === 'string' && value && prev.availableDeliveryTypes.length > 0) {
        // Автоматически добавляем этот район в доступные районы если его там нет
        if (!prev.availableDistricts.includes(value)) {
          updated.availableDistricts = [...prev.availableDistricts, value];
        }
      }
      
      return updated;
    });
    
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

  const handleDeliveryTypeToggle = (type: 'pickup' | 'delivery') => {
    setFormData(prev => {
      const isAdding = !prev.availableDeliveryTypes.includes(type);
      const newDeliveryTypes = isAdding
        ? [...prev.availableDeliveryTypes, type]
        : prev.availableDeliveryTypes.filter(t => t !== type);
      
      // При выборе любого способа получения автоматически добавляем текущий район
      if (isAdding && prev.district && !prev.availableDistricts.includes(prev.district)) {
        return {
          ...prev,
          availableDeliveryTypes: newDeliveryTypes,
          availableDistricts: [...prev.availableDistricts, prev.district]
        };
      }
      
      return {
        ...prev,
        availableDeliveryTypes: newDeliveryTypes
      };
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 10) {
      toast({
        title: 'Слишком много изображений',
        description: 'Максимум 10 изображений',
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

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.category || 
        !formData.startingPrice || !formData.minBidStep || !formData.district ||
        !formData.startDate || !formData.startTime) {
      toast({
        title: 'Ошибка',
        description: 'Пожалуйста, заполните все обязательные поля',
        variant: 'destructive',
      });
      return;
    }

    if (formData.availableDeliveryTypes.length === 0) {
      toast({
        title: 'Ошибка',
        description: 'Выберите хотя бы один способ получения',
        variant: 'destructive',
      });
      return;
    }

    if (formData.availableDeliveryTypes.includes('delivery') && formData.availableDistricts.length === 0) {
      toast({
        title: 'Ошибка',
        description: 'Выберите хотя бы один район доставки',
        variant: 'destructive',
      });
      return;
    }

    if (images.length === 0) {
      toast({
        title: 'Ошибка',
        description: 'Загрузите хотя бы одно изображение',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        toast({
          title: 'Ошибка',
          description: 'Необходимо авторизоваться',
          variant: 'destructive',
        });
        navigate('/login');
        return;
      }

      // Конвертируем изображения в base64
      const imagePromises = images.map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      });
      
      const imagesBase64 = await Promise.all(imagePromises);

      const response = await fetch('https://functions.poehali.dev/54ee04cf-3428-411f-8f87-bc1f19a53f27', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
        },
        body: JSON.stringify({
          ...formData,
          images: imagesBase64,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка создания аукциона');
      }

      toast({
        title: 'Успешно',
        description: 'Аукцион создан и будет опубликован в указанное время',
      });
      
      setTimeout(() => {
        navigate('/auction');
      }, 1500);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось создать аукцион. Попробуйте позже.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCheckingVerification) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
        <main className="container mx-auto px-4 py-8 flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Создать аукцион</h1>
          <p className="text-muted-foreground">
            Создайте аукцион и получите лучшую цену за ваш товар
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <AuctionBasicInfoSection 
            formData={formData}
            onInputChange={handleInputChange}
          />

          <AuctionPricingSection 
            formData={formData}
            onInputChange={handleInputChange}
          />

          <AuctionScheduleSection 
            formData={formData}
            onInputChange={handleInputChange}
          />

          <AuctionLocationSection 
            formData={formData}
            districts={districts}
            onInputChange={handleInputChange}
            onDistrictToggle={handleDistrictToggle}
            onDeliveryTypeToggle={handleDeliveryTypeToggle}
          />

          <AuctionMediaSection 
            imagePreviews={imagePreviews}
            onImageUpload={handleImageUpload}
            onRemoveImage={removeImage}
          />

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/auction')}
              disabled={isSubmitting}
              className="flex-1"
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Создание...
                </>
              ) : (
                <>
                  <Icon name="Gavel" className="mr-2 h-4 w-4" />
                  Создать аукцион
                </>
              )}
            </Button>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}