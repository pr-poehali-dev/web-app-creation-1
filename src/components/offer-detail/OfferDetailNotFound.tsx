import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface OfferDetailNotFoundProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function OfferDetailNotFound({ isAuthenticated, onLogout }: OfferDetailNotFoundProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="text-center py-20">
          <Icon name="AlertCircle" className="h-20 w-20 text-muted-foreground mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-3">Контент не найден</h2>
          <p className="text-muted-foreground mb-8">
            Предложение с таким ID не существует или было удалено
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => navigate('/')} className="gap-2">
              <Icon name="Home" className="h-4 w-4" />
              На главную
            </Button>
            <Button onClick={() => navigate('/predlozheniya')} variant="outline" className="gap-2">
              <Icon name="Package" className="h-4 w-4" />
              К предложениям
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
