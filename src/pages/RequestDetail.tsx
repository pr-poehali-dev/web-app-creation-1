import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BackButton from '@/components/BackButton';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import RequestMediaGallery from '@/components/request/RequestMediaGallery';
import RequestInfoCard from '@/components/request/RequestInfoCard';
import RequestAuthorCard from '@/components/request/RequestAuthorCard';
import RequestResponseModal from '@/components/request/RequestResponseModal';

interface RequestImage {
  id: string;
  url: string;
  alt: string;
}

interface RequestVideo {
  id: string;
  url: string;
  thumbnail?: string;
}

interface Author {
  id: string;
  name: string;
  type: 'individual' | 'self-employed' | 'entrepreneur' | 'legal-entity';
  phone: string;
  email: string;
  rating: number;
  reviewsCount: number;
  isVerified: boolean;
  responsiblePerson?: {
    id: string;
    name: string;
    phone: string;
    email: string;
  };
  statistics: {
    totalRequests: number;
    activeRequests: number;
    completedOrders: number;
    registrationDate: Date;
  };
}

interface Request {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  hasVAT: boolean;
  vatRate?: number;
  deliveryAddress: string;
  district: string;
  availableDistricts: string[];
  images: RequestImage[];
  video?: RequestVideo;
  isPremium: boolean;
  author: Author;
  createdAt: Date;
  updatedAt: Date;
  expiryDate?: Date;
  viewsCount?: number;
  responsesCount?: number;
}

interface RequestDetailProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

const MOCK_REQUEST: Request = {
  id: '1',
  title: 'Требуется песок строительный 50 тонн',
  description: 'Необходим качественный строительный песок для фундамента. Требования: модуль крупности 2.0-2.5, влажность не более 5%. Доставка на строительную площадку обязательна.',
  category: 'Стройматериалы',
  subcategory: 'Песок и щебень',
  quantity: 50,
  unit: 'т',
  pricePerUnit: 450,
  hasVAT: true,
  vatRate: 20,
  deliveryAddress: 'ул. Строителей, 15, стройплощадка №3',
  district: 'Ленинский',
  availableDistricts: ['Ленинский', 'Советский', 'Октябрьский'],
  images: [
    {
      id: '1',
      url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800',
      alt: 'Строительная площадка'
    }
  ],
  isPremium: false,
  author: {
    id: '1',
    name: 'ООО "СтройДом"',
    type: 'legal-entity',
    phone: '+7 (999) 123-45-67',
    email: 'info@stroydom.ru',
    rating: 4.7,
    reviewsCount: 89,
    isVerified: true,
    responsiblePerson: {
      id: '1',
      name: 'Петров Петр Петрович',
      phone: '+7 (999) 123-45-68',
      email: 'petrov@stroydom.ru'
    },
    statistics: {
      totalRequests: 45,
      activeRequests: 12,
      completedOrders: 156,
      registrationDate: new Date('2023-01-15')
    }
  },
  createdAt: new Date('2024-02-15'),
  updatedAt: new Date('2024-02-15'),
  viewsCount: 245,
  responsesCount: 8
};

export default function RequestDetail({ isAuthenticated, onLogout }: RequestDetailProps) {
  useScrollToTop();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [request, setRequest] = useState<Request | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setRequest(MOCK_REQUEST);
      setIsLoading(false);
      
      if (MOCK_REQUEST.video) {
        setShowVideo(true);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [id]);

  const handlePrevImage = () => {
    if (!request) return;
    const totalItems = (showVideo && request.video ? 1 : 0) + request.images.length;
    setCurrentImageIndex((prev) => prev === 0 ? totalItems - 1 : prev - 1);
  };

  const handleNextImage = () => {
    if (!request) return;
    const totalItems = (showVideo && request.video ? 1 : 0) + request.images.length;
    setCurrentImageIndex((prev) => prev === totalItems - 1 ? 0 : prev + 1);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: request?.title,
          text: request?.description,
          url: url,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(url);
      alert('Ссылка скопирована в буфер обмена');
    }
  };

  const handleResponseClick = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setIsResponseModalOpen(true);
  };

  const handleResponseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsResponseModalOpen(false);
    alert('Отклик успешно отправлен! Мы свяжемся с вами в ближайшее время.');
  };

  const openGallery = (index: number) => {
    setGalleryIndex(index);
    setIsGalleryOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
        <main className="container mx-auto px-4 py-8 flex-1">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="grid gap-8 lg:grid-cols-3 mb-8">
            <div className="lg:col-span-2">
              <Skeleton className="aspect-video w-full rounded-lg mb-4" />
              <div className="grid grid-cols-4 gap-2 mb-6">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="aspect-square" />
                ))}
              </div>
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-6 w-1/2" />
                </CardContent>
              </Card>
            </div>
            <div className="space-y-6">
              <Card>
                <CardContent className="pt-6">
                  <Skeleton className="h-12 w-full" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
        <main className="container mx-auto px-4 py-8 flex-1">
          <div className="text-center py-20">
            <Icon name="AlertCircle" className="h-20 w-20 text-muted-foreground mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-3">Контент не найден</h2>
            <p className="text-muted-foreground mb-8">
              Запрос с таким ID не существует или был удален
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => navigate(-1)} className="gap-2">
                <Icon name="ArrowLeft" className="h-4 w-4" />
                Назад
              </Button>
              <Button onClick={() => navigate('/zaprosy')} variant="outline" className="gap-2">
                <Icon name="MessageSquare" className="h-4 w-4" />
                К запросам
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const totalPrice = request.pricePerUnit * request.quantity;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />

      <main className="container mx-auto px-4 py-3 flex-1">
        <BackButton />

        <div className="grid gap-3 lg:grid-cols-3 mb-3 mt-2">
          <div className="lg:col-span-2">
            <RequestMediaGallery
              images={request.images}
              video={request.video}
              isPremium={request.isPremium}
              showVideo={showVideo}
              currentImageIndex={currentImageIndex}
              isVideoPlaying={isVideoPlaying}
              isMuted={isMuted}
              onPrevImage={handlePrevImage}
              onNextImage={handleNextImage}
              onImageIndexChange={setCurrentImageIndex}
              onTogglePlayPause={() => setIsVideoPlaying(!isVideoPlaying)}
              onSkip={(seconds) => {}}
              onToggleMute={() => setIsMuted(!isMuted)}
              onOpenGallery={openGallery}
              onVideoPlay={() => setIsVideoPlaying(true)}
              onVideoPause={() => setIsVideoPlaying(false)}
            />

            <RequestInfoCard
              title={request.title}
              category={request.category}
              subcategory={request.subcategory}
              quantity={request.quantity}
              unit={request.unit}
              pricePerUnit={request.pricePerUnit}
              hasVAT={request.hasVAT}
              vatRate={request.vatRate}
              responsesCount={request.responsesCount}
              description={request.description}
              deliveryAddress={request.deliveryAddress}
              district={request.district}
              availableDistricts={request.availableDistricts}
              createdAt={request.createdAt}
              expiryDate={request.expiryDate}
              totalPrice={totalPrice}
            />
          </div>

          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6 space-y-3">
                <Button
                  onClick={handleResponseClick}
                  size="lg"
                  className="w-full gap-2"
                >
                  <Icon name="Send" className="h-5 w-5" />
                  Отправить отклик
                </Button>
                <Button
                  onClick={handleShare}
                  variant="outline"
                  size="lg"
                  className="w-full gap-2"
                >
                  <Icon name="Share2" className="h-5 w-5" />
                  Поделиться
                </Button>
              </CardContent>
            </Card>

            <RequestAuthorCard author={request.author} />
          </div>
        </div>
      </main>

      <RequestResponseModal
        isOpen={isResponseModalOpen}
        onClose={() => setIsResponseModalOpen(false)}
        onSubmit={handleResponseSubmit}
        quantity={request.quantity}
        unit={request.unit}
        pricePerUnit={request.pricePerUnit}
      />

      <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
        <DialogContent className="max-w-4xl p-0">
          <div className="relative">
            {request.images[galleryIndex] && (
              <img
                src={request.images[galleryIndex].url}
                alt={request.images[galleryIndex].alt}
                className="w-full h-auto max-h-[80vh] object-contain"
              />
            )}
            {request.images.length > 1 && (
              <>
                <button
                  onClick={() => setGalleryIndex((prev) => prev === 0 ? request.images.length - 1 : prev - 1)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-background/90 hover:bg-background shadow-lg"
                >
                  <Icon name="ChevronLeft" className="h-6 w-6" />
                </button>
                <button
                  onClick={() => setGalleryIndex((prev) => prev === request.images.length - 1 ? 0 : prev + 1)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-background/90 hover:bg-background shadow-lg"
                >
                  <Icon name="ChevronRight" className="h-6 w-6" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-background/90 text-sm font-medium">
                  {galleryIndex + 1} / {request.images.length}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}