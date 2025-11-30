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
import { 
  detectLocationByIP, 
  detectLocationByBrowser, 
  saveLocationToStorage,
  isFirstVisit,
  markLocationDetected,
  type LocationData 
} from '@/utils/geolocation';

interface LocationDetectionDialogProps {
  onLocationDetected: (location: LocationData) => void;
}

export default function LocationDetectionDialog({ onLocationDetected }: LocationDetectionDialogProps) {
  const [open, setOpen] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [ipLocation, setIpLocation] = useState<LocationData | null>(null);
  const [step, setStep] = useState<'initial' | 'browser-permission'>('initial');

  useEffect(() => {
    const checkAndDetect = async () => {
      if (isFirstVisit()) {
        setIsDetecting(true);
        const location = await detectLocationByIP();
        setIpLocation(location);
        setIsDetecting(false);
        setOpen(true);
      }
    };

    checkAndDetect();
  }, []);

  const handleUseBrowserLocation = async () => {
    setStep('browser-permission');
    setIsDetecting(true);
    
    const location = await detectLocationByBrowser();
    saveLocationToStorage(location);
    markLocationDetected();
    onLocationDetected(location);
    setIsDetecting(false);
    setOpen(false);
  };

  const handleUseIPLocation = () => {
    if (ipLocation) {
      saveLocationToStorage(ipLocation);
      markLocationDetected();
      onLocationDetected(ipLocation);
    }
    setOpen(false);
  };

  const handleSkip = () => {
    const defaultLocation: LocationData = {
      city: 'Не определен',
      district: 'Все районы',
      source: 'default'
    };
    saveLocationToStorage(defaultLocation);
    markLocationDetected();
    onLocationDetected(defaultLocation);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        {step === 'initial' ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Icon name="MapPin" className="h-5 w-5 text-primary" />
                Определение местоположения
              </DialogTitle>
              <DialogDescription>
                Мы определили ваше примерное местоположение по IP-адресу
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {isDetecting ? (
                <div className="flex items-center justify-center py-8">
                  <Icon name="Loader2" className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : ipLocation ? (
                <div className="rounded-lg border bg-muted/50 p-4">
                  <div className="flex items-start gap-3">
                    <Icon name="MapPin" className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium">{ipLocation.city}</p>
                      <p className="text-sm text-muted-foreground">{ipLocation.district}</p>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Для более точного определения местоположения разрешите доступ к геолокации браузера
                </p>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-col gap-2">
              <Button
                onClick={handleUseBrowserLocation}
                disabled={isDetecting}
                className="w-full"
              >
                <Icon name="Navigation" className="h-4 w-4 mr-2" />
                Использовать точную геолокацию
              </Button>
              <Button
                onClick={handleUseIPLocation}
                variant="outline"
                disabled={isDetecting}
                className="w-full"
              >
                Оставить определение по IP
              </Button>
              <Button
                onClick={handleSkip}
                variant="ghost"
                disabled={isDetecting}
                className="w-full"
              >
                Пропустить
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Icon name="Navigation" className="h-5 w-5 text-primary" />
                Запрос геолокации
              </DialogTitle>
              <DialogDescription>
                Браузер запросит разрешение на доступ к вашему местоположению. Пожалуйста, разрешите доступ для точного определения.
              </DialogDescription>
            </DialogHeader>

            <div className="flex items-center justify-center py-8">
              <Icon name="Loader2" className="h-8 w-8 animate-spin text-primary" />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
