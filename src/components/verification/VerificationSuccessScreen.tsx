import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Icon from '@/components/ui/icon';

interface VerificationSuccessScreenProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function VerificationSuccessScreen({ 
  isAuthenticated, 
  onLogout 
}: VerificationSuccessScreenProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
          <CardContent className="pt-8 pb-8 text-center space-y-6">
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-full bg-green-500 flex items-center justify-center animate-bounce">
                <Icon name="Check" className="h-10 w-10 text-white" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-green-700 dark:text-green-400">
                Документы успешно отправлены!
              </h2>
              <p className="text-muted-foreground">
                Ваша заявка принята и ожидает проверки модератором
              </p>
            </div>
            
            <Alert className="bg-white dark:bg-slate-900 border-green-300">
              <Icon name="Clock" className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-left">
                <p className="font-medium mb-2">Что дальше?</p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>✓ Модератор проверит ваши документы в течение 24 часов</li>
                  <li>✓ Вы получите уведомление на email о результатах проверки</li>
                  <li>✓ Статус заявки можно отслеживать в личном кабинете</li>
                </ul>
              </AlertDescription>
            </Alert>
            
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground animate-pulse">
              <Icon name="Loader2" className="h-4 w-4 animate-spin" />
              <span>Переход в профиль через несколько секунд...</span>
            </div>
          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
}
