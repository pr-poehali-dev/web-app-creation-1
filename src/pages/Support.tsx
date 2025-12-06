import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Icon from '@/components/ui/icon';
import BackButton from '@/components/BackButton';
import { useScrollToTop } from '@/hooks/useScrollToTop';

interface SupportProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function Support({ isAuthenticated, onLogout }: SupportProps) {
  useScrollToTop();
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />

      <main className="container mx-auto px-4 py-8 flex-1">
        <BackButton />
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-8">
            Поддержка
          </h1>

          <div className="space-y-6">
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Icon name="Mail" className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Свяжитесь с нами по email</h3>
                  <p className="text-muted-foreground mb-2">
                    Отправьте нам сообщение, и мы ответим в ближайшее время
                  </p>
                  <a href="mailto:support@ertp.ru" className="text-primary hover:underline">
                    support@ertp.ru
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Icon name="Phone" className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Телефон горячей линии</h3>
                  <p className="text-muted-foreground mb-2">
                    Позвоните нам в рабочее время
                  </p>
                  <a href="tel:+78001234567" className="text-primary hover:underline">
                    8 (800) 123-45-67
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Icon name="MessageCircle" className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Онлайн-чат</h3>
                  <p className="text-muted-foreground">
                    Скоро появится возможность общения через онлайн-чат
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}