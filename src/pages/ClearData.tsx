import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface ClearDataProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function ClearData({ isAuthenticated, onLogout }: ClearDataProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isClearing, setIsClearing] = useState(false);

  const handleClearAll = () => {
    setIsClearing(true);
    
    try {
      // Очистка заказов
      localStorage.removeItem('orders');
      
      // Очистка всех сообщений заказов
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('order_messages_')) {
          localStorage.removeItem(key);
        }
      });
      
      // Очистка уведомлений
      localStorage.removeItem('notifications');
      
      // Очистка истории поиска
      localStorage.removeItem('searchHistory');
      
      toast({
        title: 'Данные очищены',
        description: 'Все заказы, сообщения и уведомления удалены',
      });
      
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } catch (error) {
      console.error('Ошибка очистки:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось очистить данные',
        variant: 'destructive',
      });
      setIsClearing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
      
      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-2xl mx-auto">
          <Card className="border-destructive/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <Icon name="AlertTriangle" className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <CardTitle>Очистка тестовых данных</CardTitle>
                  <CardDescription>
                    Удалить все заказы, сообщения и уведомления
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium">Будут удалены:</p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• Все заказы (из localStorage)</li>
                  <li>• Все сообщения в чатах</li>
                  <li>• Все уведомления</li>
                  <li>• История поиска</li>
                </ul>
              </div>
              
              <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg">
                <div className="flex gap-2">
                  <Icon name="Info" className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    Это действие нельзя отменить. Данные из базы (предложения, запросы, аукционы) уже архивированы.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="flex-1"
                >
                  <Icon name="ArrowLeft" className="mr-2 h-4 w-4" />
                  Отмена
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleClearAll}
                  disabled={isClearing}
                  className="flex-1"
                >
                  {isClearing ? (
                    <>
                      <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                      Очистка...
                    </>
                  ) : (
                    <>
                      <Icon name="Trash2" className="mr-2 h-4 w-4" />
                      Очистить все
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
