import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';

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
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  
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

  useEffect(() => {
    if (videoRef.current && showVideo && request?.video) {
      videoRef.current.play().catch(() => {
        console.log('Autoplay prevented');
      });
      setIsVideoPlaying(true);
    }
  }, [showVideo, request]);

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    
    if (isVideoPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsVideoPlaying(!isVideoPlaying);
  };

  const handleSkip = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime += seconds;
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

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
              <Button onClick={() => navigate('/')} className="gap-2">
                <Icon name="Home" className="h-4 w-4" />
                На главную
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
  const totalMediaItems = (showVideo && request.video ? 1 : 0) + request.images.length;
  const isShowingVideo = showVideo && request.video && currentImageIndex === 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />

      <main className="container mx-auto px-4 py-8 flex-1">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 gap-2"
        >
          <Icon name="ArrowLeft" className="h-4 w-4" />
          Назад
        </Button>

        <div className="grid gap-8 lg:grid-cols-3 mb-8">
          <div className="lg:col-span-2">
            <Card className="overflow-hidden mb-6">
              <div className="relative aspect-video bg-muted">
                {isShowingVideo ? (
                  <div className="relative w-full h-full">
                    <video
                      ref={videoRef}
                      src={request.video!.url}
                      poster={request.video!.thumbnail}
                      className="w-full h-full object-cover"
                      onPlay={() => setIsVideoPlaying(true)}
                      onPause={() => setIsVideoPlaying(false)}
                    />
                    
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      {!isVideoPlaying && (
                        <button
                          onClick={togglePlayPause}
                          className="pointer-events-auto p-4 rounded-full bg-background/80 hover:bg-background shadow-lg transition-all"
                        >
                          <Icon name="Play" className="h-8 w-8" />
                        </button>
                      )}
                    </div>

                    <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2">
                      <button
                        onClick={togglePlayPause}
                        className="p-2 rounded-full bg-background/80 hover:bg-background shadow-lg transition-all"
                      >
                        <Icon name={isVideoPlaying ? 'Pause' : 'Play'} className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => handleSkip(-10)}
                        className="p-2 rounded-full bg-background/80 hover:bg-background shadow-lg transition-all"
                      >
                        <Icon name="RotateCcw" className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => handleSkip(10)}
                        className="p-2 rounded-full bg-background/80 hover:bg-background shadow-lg transition-all"
                      >
                        <Icon name="RotateCw" className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={toggleMute}
                        className="p-2 rounded-full bg-background/80 hover:bg-background shadow-lg transition-all ml-auto"
                      >
                        <Icon name={isMuted ? 'VolumeX' : 'Volume2'} className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : request.images.length > 0 ? (
                  <>
                    <img
                      src={request.images[showVideo && request.video ? currentImageIndex - 1 : currentImageIndex].url}
                      alt={request.images[showVideo && request.video ? currentImageIndex - 1 : currentImageIndex].alt}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => openGallery(showVideo && request.video ? currentImageIndex - 1 : currentImageIndex)}
                    />
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Icon name="MessageSquare" className="h-24 w-24 text-muted-foreground" />
                  </div>
                )}

                {totalMediaItems > 1 && (
                  <>
                    <button
                      onClick={handlePrevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 hover:bg-background shadow-lg transition-all"
                    >
                      <Icon name="ChevronLeft" className="h-6 w-6" />
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 hover:bg-background shadow-lg transition-all"
                    >
                      <Icon name="ChevronRight" className="h-6 w-6" />
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {[...Array(totalMediaItems)].map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            index === currentImageIndex
                              ? 'bg-white w-6'
                              : 'bg-white/50 hover:bg-white/75'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}

                {request.isPremium && (
                  <Badge className="absolute top-4 right-4 gap-1 bg-primary">
                    <Icon name="Star" className="h-3 w-3" />
                    Премиум
                  </Badge>
                )}
              </div>
            </Card>

            {(request.images.length > 0 || (showVideo && request.video)) && (
              <div className="grid grid-cols-5 gap-2 mb-6">
                {showVideo && request.video && (
                  <button
                    onClick={() => setCurrentImageIndex(0)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      currentImageIndex === 0
                        ? 'border-primary scale-95'
                        : 'border-transparent hover:border-muted-foreground/30'
                    }`}
                  >
                    <img
                      src={request.video.thumbnail || '/placeholder-video.jpg'}
                      alt="Video thumbnail"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <Icon name="Play" className="h-6 w-6 text-white" />
                    </div>
                  </button>
                )}
                {request.images.slice(0, showVideo && request.video ? 9 : 10).map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setCurrentImageIndex((showVideo && request.video ? 1 : 0) + index)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      (showVideo && request.video ? index + 1 : index) === currentImageIndex
                        ? 'border-primary scale-95'
                        : 'border-transparent hover:border-muted-foreground/30'
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={image.alt}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            <Card className="mb-6">
              <CardContent className="pt-6 space-y-6">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{request.title}</h1>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{request.category}</Badge>
                    <Badge variant="outline">{request.subcategory}</Badge>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Требуемое количество</p>
                      <p className="font-semibold">{request.quantity} {request.unit}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Цена за единицу</p>
                      <p className="font-semibold">{request.pricePerUnit.toLocaleString('ru-RU')} ₽</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Откликов</p>
                      <p className="font-semibold">{request.responsesCount || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">НДС</p>
                      <p className="font-semibold">
                        {request.hasVAT ? `${request.vatRate}%` : 'Без НДС'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Общий бюджет</p>
                    <p className="text-2xl font-bold text-primary">
                      {totalPrice.toLocaleString('ru-RU')} ₽
                    </p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-2">Описание запроса</h3>
                  <p className="text-muted-foreground whitespace-pre-line">{request.description}</p>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Адрес доставки</p>
                    <p className="font-medium">{request.deliveryAddress}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Район</p>
                    <p className="font-medium">{request.district}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Принимаются отклики из районов</p>
                  <div className="flex flex-wrap gap-2">
                    {request.availableDistricts.map((district) => (
                      <Badge key={district} variant="outline">{district}</Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div>
                    <p>Дата создания</p>
                    <p className="font-medium text-foreground">
                      {request.createdAt.toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                  {request.expiryDate && (
                    <div>
                      <p>Срок актуальности</p>
                      <p className="font-medium text-foreground">
                        {request.expiryDate.toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
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

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="User" className="h-5 w-5" />
                  Автор запроса
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{request.author.name}</h3>
                    {request.author.isVerified && (
                      <Badge className="gap-1 bg-green-500">
                        <Icon name="BadgeCheck" className="h-3 w-3" />
                        Верифицирован
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Icon
                          key={i}
                          name="Star"
                          className={`h-4 w-4 ${
                            i < Math.floor(request.author.rating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-muted-foreground'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {request.author.rating} ({request.author.reviewsCount} отзывов)
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  {request.author.responsiblePerson && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Ответственный</p>
                      <p className="font-medium">{request.author.responsiblePerson.name}</p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Телефон</p>
                    <a
                      href={`tel:${request.author.phone}`}
                      className="font-medium hover:text-primary transition-colors flex items-center gap-1"
                    >
                      <Icon name="Phone" className="h-4 w-4" />
                      {request.author.phone}
                    </a>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Email</p>
                    <a
                      href={`mailto:${request.author.email}`}
                      className="font-medium hover:text-primary transition-colors flex items-center gap-1"
                    >
                      <Icon name="Mail" className="h-4 w-4" />
                      {request.author.email}
                    </a>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <p className="text-sm font-semibold">Статистика</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Всего запросов</p>
                      <p className="font-semibold">{request.author.statistics.totalRequests}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Активных</p>
                      <p className="font-semibold">{request.author.statistics.activeRequests}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Выполнено заказов</p>
                      <p className="font-semibold">{request.author.statistics.completedOrders}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">На платформе с</p>
                      <p className="font-semibold">
                        {request.author.statistics.registrationDate.toLocaleDateString('ru-RU', {
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate(`/seller/${request.author.id}`)}
                >
                  Перейти к профилю
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Dialog open={isResponseModalOpen} onOpenChange={setIsResponseModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Отправить отклик</DialogTitle>
            <DialogDescription>
              Заполните форму отклика, и автор запроса свяжется с вами
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResponseSubmit} className="space-y-4">
            <div>
              <Label htmlFor="response-quantity">Количество ({request.unit})</Label>
              <Input
                id="response-quantity"
                type="number"
                min="1"
                max={request.quantity}
                defaultValue={request.quantity}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="response-price">Ваша цена за единицу (₽)</Label>
              <Input
                id="response-price"
                type="number"
                min="1"
                defaultValue={request.pricePerUnit}
                required
              />
            </div>

            <div>
              <Label htmlFor="response-delivery">Срок поставки (дней)</Label>
              <Input
                id="response-delivery"
                type="number"
                min="1"
                placeholder="Укажите срок поставки"
                required
              />
            </div>

            <div>
              <Label htmlFor="response-comment">Комментарий</Label>
              <Textarea
                id="response-comment"
                placeholder="Дополнительная информация о вашем предложении"
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1">
                Отправить отклик
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsResponseModalOpen(false)}
              >
                Отмена
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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
