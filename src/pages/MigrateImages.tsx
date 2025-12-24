import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import Header from '@/components/Header';

const OFFERS_API_URL = 'https://functions.poehali.dev/2c8bcee0-2dd9-48ab-8d0e-e8ad34c623aa';

interface MigrationStatus {
  total: number;
  base64: number;
  cdn: number;
  progress: number;
}

interface MigrateImagesProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function MigrateImages({ isAuthenticated, onLogout }: MigrateImagesProps) {
  const [status, setStatus] = useState<MigrationStatus | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const { toast } = useToast();

  const loadStatus = async () => {
    try {
      const response = await fetch(`${OFFERS_API_URL}?action=migration-status`);
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Ошибка загрузки статуса:', error);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleMigrate = async () => {
    setIsMigrating(true);
    try {
      const response = await fetch(`${OFFERS_API_URL}?action=migrate-images`);
      const data = await response.json();
      
      toast({
        title: 'Миграция завершена',
        description: `Мигрировано: ${data.migrated} изображений`,
      });
      
      await loadStatus();
      
      // Если есть еще base64 изображения, продолжаем миграцию
      if (status && status.base64 > 0) {
        setTimeout(handleMigrate, 1000);
      } else {
        setIsMigrating(false);
      }
    } catch (error) {
      console.error('Ошибка миграции:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось выполнить миграцию',
        variant: 'destructive',
      });
      setIsMigrating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
      
      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="ImageUp" className="h-6 w-6" />
              Миграция изображений в S3
            </CardTitle>
            <CardDescription>
              Перенос изображений из base64 в облачное хранилище с оптимизацией
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {status && (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Прогресс миграции</span>
                    <span className="font-semibold">{status.progress.toFixed(1)}%</span>
                  </div>
                  <Progress value={status.progress} className="h-2" />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <div className="text-3xl font-bold text-primary">{status.total}</div>
                      <div className="text-sm text-muted-foreground mt-1">Всего</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <div className="text-3xl font-bold text-orange-500">{status.base64}</div>
                      <div className="text-sm text-muted-foreground mt-1">Base64</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <div className="text-3xl font-bold text-green-500">{status.cdn}</div>
                      <div className="text-sm text-muted-foreground mt-1">CDN</div>
                    </CardContent>
                  </Card>
                </div>

                {status.base64 > 0 ? (
                  <Button
                    onClick={handleMigrate}
                    disabled={isMigrating}
                    className="w-full"
                    size="lg"
                  >
                    {isMigrating ? (
                      <>
                        <Icon name="Loader2" className="mr-2 h-5 w-5 animate-spin" />
                        Миграция... ({status.base64} осталось)
                      </>
                    ) : (
                      <>
                        <Icon name="Play" className="mr-2 h-5 w-5" />
                        Запустить миграцию
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="flex items-center justify-center gap-2 p-6 bg-green-50 dark:bg-green-950 rounded-lg text-green-700 dark:text-green-300">
                    <Icon name="CheckCircle2" className="h-6 w-6" />
                    <span className="font-semibold">Все изображения мигрированы!</span>
                  </div>
                )}

                <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
                  <p>• Миграция происходит по 10 изображений за раз</p>
                  <p>• Изображения сжимаются до 800px ширины с качеством 85%</p>
                  <p>• После миграции изображения будут загружаться быстрее</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
