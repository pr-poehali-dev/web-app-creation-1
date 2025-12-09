import { useDistrict } from '@/contexts/DistrictContext';
import Icon from '@/components/ui/icon';

export default function GeolocationLoadingOverlay() {
  const { isDetecting } = useDistrict();

  if (!isDetecting) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-card border rounded-lg shadow-lg p-6 max-w-sm mx-4">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon name="MapPin" className="h-8 w-8 text-primary" />
            </div>
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
          
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">Определяем ваше местоположение</h3>
            <p className="text-sm text-muted-foreground">
              Это займет всего несколько секунд...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
