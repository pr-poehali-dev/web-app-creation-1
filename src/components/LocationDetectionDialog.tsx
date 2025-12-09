import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useDistrict } from '@/contexts/DistrictContext';

export default function LocationDetectionDialog() {
  const [open, setOpen] = useState(false);
  const { isDetecting, requestGeolocation, selectedRegion } = useDistrict();
  const location = useLocation();

  useEffect(() => {
    const hasShownDialog = localStorage.getItem('geolocationDialogShown');
    
    const excludedPaths = ['/login', '/register', '/reset-password', '/new-password', '/admin'];
    const isExcludedPath = excludedPaths.some(path => location.pathname.startsWith(path));
    
    if (!hasShownDialog && selectedRegion === 'all' && !isExcludedPath) {
      const timer = setTimeout(() => {
        setOpen(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [selectedRegion, location.pathname]);

  const handleAccept = async () => {
    try {
      localStorage.setItem('geolocationDialogShown', 'true');
      setOpen(false);
      await requestGeolocation();
    } catch (error) {
      console.error('Geolocation error:', error);
    }
  };

  const handleDecline = () => {
    localStorage.setItem('geolocationDialogShown', 'true');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => !isDetecting && setOpen(newOpen)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="relative h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon name="MapPin" className="h-6 w-6 text-primary" />
              {isDetecting && (
                <div className="absolute inset-0 rounded-full border-3 border-primary border-t-transparent animate-spin" />
              )}
            </div>
            <DialogTitle className="text-xl">
              {isDetecting ? 'Определяем регион...' : 'Определить ваш регион?'}
            </DialogTitle>
          </div>
          <DialogDescription className="text-base space-y-3 pt-2">
            {isDetecting ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Пожалуйста, подождите. Идет определение вашего местоположения...
                </p>
                <div className="flex justify-center items-center gap-2 text-xs text-muted-foreground">
                  <div className="h-2 w-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                  <div className="h-2 w-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
                  <div className="h-2 w-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '400ms' }} />
                </div>
              </div>
            ) : (
              <>
                <p>
                  Мы можем автоматически определить ваше местоположение, чтобы показывать
                  предложения и услуги, доступные в вашем регионе.
                </p>
                <div className="bg-muted p-3 rounded-lg space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <Icon name="Shield" className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Ваши координаты не передаются третьим лицам</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Icon name="MapPin" className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Используется только для определения региона</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Icon name="Settings" className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Вы можете изменить регион в любое время</span>
                  </div>
                </div>
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        {!isDetecting && (
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleDecline}
              className="w-full sm:w-auto"
            >
              Нет, спасибо
            </Button>
            <Button
              onClick={handleAccept}
              className="w-full sm:w-auto"
            >
              <Icon name="MapPin" className="mr-2 h-4 w-4" />
              Разрешить
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}