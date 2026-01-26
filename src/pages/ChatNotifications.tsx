import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface ChatNotificationsProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function ChatNotifications({ isAuthenticated, onLogout }: ChatNotificationsProps) {
  useScrollToTop();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />

      <main className="container mx-auto px-4 py-6 flex-1">
        <BackButton />

        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Уведомления</h1>
          <p className="text-muted-foreground">
            Здесь будут отображаться ваши уведомления
          </p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Icon name="Bell" className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Нет уведомлений</h3>
            <p className="text-muted-foreground text-center">
              У вас пока нет новых уведомлений
            </p>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
