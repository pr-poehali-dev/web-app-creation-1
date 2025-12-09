import { useState, useEffect } from 'react';
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

  useEffect(() => {
    const hasShownDialog = localStorage.getItem('geolocationDialogShown');
    
    if (!hasShownDialog && selectedRegion === 'all') {
      const timer = setTimeout(() => {
        setOpen(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [selectedRegion]);

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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon name="MapPin" className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-xl">Определить ваш регион?</DialogTitle>
          </div>
          <DialogDescription className="text-base space-y-3 pt-2">
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
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleDecline}
            disabled={isDetecting}
            className="w-full sm:w-auto"
          >
            Нет, спасибо
          </Button>
          <Button
            onClick={handleAccept}
            disabled={isDetecting}
            className="w-full sm:w-auto"
          >
            {isDetecting ? (
              <>
                <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                Определяем...
              </>
            ) : (
              <>
                <Icon name="MapPin" className="mr-2 h-4 w-4" />
                Разрешить
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}