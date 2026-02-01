import { useParams } from 'react-router-dom';
import { getSession } from '@/utils/auth';
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
import { useRequestData } from './RequestDetail/useRequestData';
import { useRequestGallery } from './RequestDetail/useRequestGallery';
import { useRequestResponse } from './RequestDetail/useRequestResponse';

interface RequestDetailProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function RequestDetail({ isAuthenticated, onLogout }: RequestDetailProps) {
  useScrollToTop();
  const { id } = useParams<{ id: string }>();
  
  const { request, isLoading, showVideo, handlePublish } = useRequestData(id);
  
  const {
    currentImageIndex,
    isVideoPlaying,
    setIsVideoPlaying,
    isMuted,
    setIsMuted,
    isGalleryOpen,
    setIsGalleryOpen,
    galleryIndex,
    handlePrevImage,
    handleNextImage,
    openGallery,
    handleShare,
  } = useRequestGallery(request, showVideo);
  
  const {
    isResponseModalOpen,
    setIsResponseModalOpen,
    handleResponseClick,
    handleResponseSubmit,
  } = useRequestResponse(request, isAuthenticated);

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
            <div>
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
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
          <BackButton />
          <p className="text-center text-muted-foreground">Запрос не найден</p>
        </main>
        <Footer />
      </div>
    );
  }

  const totalItems = (showVideo && request.video ? 1 : 0) + request.images.length;
  const isVideoIndex = showVideo && request.video && currentImageIndex === 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />

      <main className="container mx-auto px-4 py-8 flex-1">
        <BackButton />

        <div className="grid gap-8 lg:grid-cols-3 mb-8">
          <div className="lg:col-span-2">
            <div className="relative mb-4">
              {isVideoIndex && request.video ? (
                <div className="aspect-video bg-black rounded-lg overflow-hidden relative group">
                  <video
                    src={request.video.url}
                    className="w-full h-full object-contain"
                    controls
                    autoPlay={isVideoPlaying}
                    muted={isMuted}
                    onPlay={() => setIsVideoPlaying(true)}
                    onPause={() => setIsVideoPlaying(false)}
                  />
                  
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() => setIsMuted(!isMuted)}
                      className="bg-black/50 hover:bg-black/70"
                    >
                      <Icon name={isMuted ? "VolumeX" : "Volume2"} className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={handleShare}
                      className="bg-black/50 hover:bg-black/70"
                    >
                      <Icon name="Share2" className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div 
                  className="aspect-video bg-muted rounded-lg overflow-hidden relative group cursor-pointer"
                  onClick={() => {
                    const imageIndex = showVideo && request.video ? currentImageIndex - 1 : currentImageIndex;
                    openGallery(imageIndex);
                  }}
                >
                  {request.images.length > 0 && (
                    <>
                      <img
                        src={request.images[showVideo && request.video ? currentImageIndex - 1 : currentImageIndex]?.url}
                        alt={request.images[showVideo && request.video ? currentImageIndex - 1 : currentImageIndex]?.alt}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 hover:bg-black/70"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShare();
                        }}
                      >
                        <Icon name="Share2" className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              )}

              {totalItems > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70"
                    onClick={handlePrevImage}
                  >
                    <Icon name="ChevronLeft" className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70"
                    onClick={handleNextImage}
                  >
                    <Icon name="ChevronRight" className="h-6 w-6" />
                  </Button>
                </>
              )}
            </div>

            {(request.images.length > 0 || (showVideo && request.video)) && (
              <div className="grid grid-cols-4 gap-2 mb-6">
                {showVideo && request.video && (
                  <button
                    onClick={() => currentImageIndex !== 0 && handlePrevImage()}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                      currentImageIndex === 0 ? 'border-primary' : 'border-transparent hover:border-primary/50'
                    }`}
                  >
                    <div className="w-full h-full bg-black flex items-center justify-center">
                      <Icon name="Play" className="h-8 w-8 text-white" />
                    </div>
                  </button>
                )}
                {request.images.slice(0, showVideo && request.video ? 3 : 4).map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => {
                      const targetIndex = showVideo && request.video ? index + 1 : index;
                      while (currentImageIndex !== targetIndex) {
                        if (currentImageIndex < targetIndex) handleNextImage();
                        else handlePrevImage();
                      }
                    }}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                      currentImageIndex === (showVideo && request.video ? index + 1 : index)
                        ? 'border-primary'
                        : 'border-transparent hover:border-primary/50'
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

            <RequestInfoCard request={request} />
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold">
                      {request.pricePerUnit.toLocaleString('ru-RU')} ₽
                    </h3>
                    <p className="text-sm text-muted-foreground">за {request.unit}</p>
                  </div>
                  {request.hasVAT && (
                    <div className="px-2 py-1 bg-primary/10 rounded text-xs text-primary">
                      НДС {request.vatRate}%
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {(() => {
                  const currentUser = getSession();
                  const isOwner = currentUser && currentUser.id?.toString() === request.author.id?.toString();
                  
                  return isOwner ? (
                    <>
                      {request.status === 'draft' && (
                        <Button 
                          className="w-full" 
                          size="lg"
                          onClick={handlePublish}
                        >
                          <Icon name="Send" className="mr-2 h-4 w-4" />
                          Опубликовать
                        </Button>
                      )}
                      <Button 
                        className="w-full" 
                        size="lg"
                        variant={request.status === 'draft' ? 'outline' : 'default'}
                        onClick={handleResponseClick}
                      >
                        <Icon name="Edit" className="mr-2 h-4 w-4" />
                        Редактировать запрос
                      </Button>
                    </>
                  ) : (
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={handleResponseClick}
                    >
                      <Icon name="Send" className="mr-2 h-4 w-4" />
                      Отправить отклик
                    </Button>
                  );
                })()}
                {request.status !== 'draft' && (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleShare}
                  >
                    <Icon name="Share2" className="mr-2 h-4 w-4" />
                    Поделиться
                  </Button>
                )}
              </CardContent>
            </Card>

            <RequestAuthorCard author={request.author} />
          </div>
        </div>
      </main>

      <Footer />

      <RequestResponseModal
        isOpen={isResponseModalOpen}
        onClose={() => setIsResponseModalOpen(false)}
        onSubmit={handleResponseSubmit}
        quantity={request.quantity}
        unit={request.unit}
        pricePerUnit={request.pricePerUnit}
      />

      <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
        <DialogContent className="max-w-7xl w-full p-0 bg-black/95">
          <RequestMediaGallery
            images={request.images}
            currentIndex={galleryIndex}
            onClose={() => setIsGalleryOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}