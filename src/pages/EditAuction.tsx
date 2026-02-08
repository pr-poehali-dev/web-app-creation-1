import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BackButton from '@/components/BackButton';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { useDistrict } from '@/contexts/DistrictContext';
import { getSession } from '@/utils/auth';
import { auctionsAPI } from '@/services/api';
import type { Auction } from '@/types/auction';
import AuctionBasicInfoSection from '@/components/auction/AuctionBasicInfoSection';
import AuctionPricingSection from '@/components/auction/AuctionPricingSection';
import AuctionMediaSection from '@/components/auction/AuctionMediaSection';
import { notifyAuctionUpdated } from '@/utils/dataSync';

interface EditAuctionProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function EditAuction({ isAuthenticated, onLogout }: EditAuctionProps) {
  useScrollToTop();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const currentUser = getSession();
  const { districts } = useDistrict();

  const [auction, setAuction] = useState<Auction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startingPrice: '',
    minBidStep: '',
    buyNowPrice: '',
  });

  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: 'Требуется авторизация',
        description: 'Для редактирования аукциона необходимо войти в систему',
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }

    loadAuction();
  }, [isAuthenticated, id]);

  const loadAuction = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      const loadedAuction = await auctionsAPI.getAuctionById(id);
      
      if (loadedAuction.userId !== currentUser?.id) {
        toast({
          title: 'Ошибка',
          description: 'Вы не можете редактировать этот аукцион',
          variant: 'destructive',
        });
        navigate('/my-auctions');
        return;
      }

      const start = loadedAuction.startDate ? new Date(loadedAuction.startDate) : null;
      if (start && start <= new Date()) {
        toast({
          title: 'Ошибка',
          description: 'Нельзя редактировать аукцион после его начала',
          variant: 'destructive',
        });
        navigate('/my-auctions');
        return;
      }

      setAuction(loadedAuction);
      setFormData({
        title: loadedAuction.title,
        description: loadedAuction.description,
        startingPrice: loadedAuction.startingPrice?.toString() || '',
        minBidStep: loadedAuction.minBidStep?.toString() || '',
        buyNowPrice: loadedAuction.buyNowPrice?.toString() || '',
      });
      
      if (loadedAuction.images && loadedAuction.images.length > 0) {
        setImagePreviews(loadedAuction.images.map(img => img.url));
      }
    } catch (error) {
      console.error('Error loading auction:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить аукцион',
        variant: 'destructive',
      });
      navigate('/my-auctions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!id) return;

    if (!formData.title || !formData.description || !formData.startingPrice) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все обязательные поля',
        variant: 'destructive',
      });
      return;
    }

    const startingPrice = parseFloat(formData.startingPrice);
    if (isNaN(startingPrice) || startingPrice <= 0) {
      toast({
        title: 'Ошибка',
        description: 'Введите корректную стартовую цену',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const updateData: any = {
        auctionId: id,
        action: 'update',
        title: formData.title,
        description: formData.description,
        startingPrice: startingPrice,
      };

      if (formData.minBidStep) {
        updateData.minBidStep = parseFloat(formData.minBidStep);
      }

      if (formData.buyNowPrice) {
        updateData.buyNowPrice = parseFloat(formData.buyNowPrice);
      }

      if (images.length > 0) {
        const uploadedImages = await uploadImages();
        updateData.images = uploadedImages;
      } else if (imagePreviews.length > 0 && auction?.images) {
        updateData.images = auction.images;
      }

      await auctionsAPI.updateAuction(updateData);

      // Уведомляем все открытые страницы об обновлении
      notifyAuctionUpdated(id);

      toast({
        title: 'Успешно',
        description: 'Аукцион обновлен',
      });

      navigate('/my-auctions');
    } catch (error: any) {
      console.error('Error updating auction:', error);
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось обновить аукцион',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const uploadImages = async (): Promise<Array<{ url: string; alt: string }>> => {
    const uploaded: Array<{ url: string; alt: string }> = [];

    for (const file of images) {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64 = reader.result as string;
          resolve(base64.split(',')[1]);
        };
        reader.readAsDataURL(file);
      });

      const base64Data = await base64Promise;

      const response = await fetch('https://functions.poehali.dev/db1be6b0-2dfa-47ab-a06f-cd37d0e66f30', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileData: base64Data,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        uploaded.push({ url: data.url, alt: file.name });
      }
    }

    return uploaded;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
        <main className="container mx-auto px-4 py-8 flex-1">
          <div className="flex justify-center items-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!auction) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-4xl mx-auto">
          <BackButton className="mb-6" />

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Редактировать аукцион</h1>
            <p className="text-muted-foreground">
              Измените информацию об аукционе до его начала
            </p>
          </div>

          <div className="space-y-8">
            <AuctionBasicInfoSection
              title={formData.title}
              description={formData.description}
              category={auction.category}
              subcategory={auction.subcategory}
              quantity={auction.quantity?.toString() || ''}
              unit={auction.unit}
              onInputChange={handleInputChange}
              disabled={false}
            />

            <AuctionPricingSection
              startingPrice={formData.startingPrice}
              minBidStep={formData.minBidStep}
              buyNowPrice={formData.buyNowPrice}
              hasVAT={auction.hasVAT}
              vatRate={auction.vatRate?.toString() || '20'}
              onInputChange={handleInputChange}
            />

            <AuctionMediaSection
              images={images}
              imagePreviews={imagePreviews}
              onImagesChange={setImages}
              onImagePreviewsChange={setImagePreviews}
            />
          </div>

          <div className="mt-8 flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/my-auctions')}
              disabled={isSubmitting}
            >
              Отмена
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Сохранение...
                </>
              ) : (
                <>
                  <Icon name="Save" className="h-4 w-4" />
                  Сохранить изменения
                </>
              )}
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}