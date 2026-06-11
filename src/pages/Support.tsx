import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Icon from '@/components/ui/icon';
import BackButton from '@/components/BackButton';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { getSession } from '@/utils/auth';
import SupportChatModal from '@/components/SupportChatModal';

interface SupportProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function Support({ isAuthenticated, onLogout }: SupportProps) {
  useScrollToTop();
  const session = getSession();
  const userId = session?.id ? String(session.id) : null;

  const supportEmail = 'doydum-invest@mail.ru';
  const supportPhone = '+7 (984) 101-73-55';
  const telegramLink = 'https://t.me/erttp_ru';
  const [phoneContactMethod, setPhoneContactMethod] = useState<'telegram' | 'call'>('call');
  const [chatOpen, setChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Поддержка"
        description="Служба поддержки ЕРТТП. Задайте вопрос, сообщите о проблеме или получите помощь по работе с платформой."
        keywords="поддержка ЕРТТП, помощь торговая площадка, связаться с поддержкой"
        canonical="/support"
      />
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />

      <main className="container mx-auto px-4 py-4 md:py-6 flex-1">
        <BackButton />
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4 md:mb-6">Поддержка</h1>

          {/* Чат с поддержкой — только для авторизованных */}
          {isAuthenticated && userId && (
            <>
              <div className="bg-card border rounded-lg mb-4 md:mb-5 p-4 md:p-5 flex items-center gap-4">
                <div className="bg-primary/10 p-2.5 rounded-lg shrink-0">
                  <Icon name="MessageSquare" className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-base">Чат с поддержкой</h3>
                  <p className="text-sm text-muted-foreground">Отвечаем Пн–Пт 9:00–18:00</p>
                </div>
                <Button onClick={() => setChatOpen(true)} className="shrink-0 relative">
                  <Icon name="MessageSquare" size={16} className="mr-2" />
                  Открыть чат
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </div>
              <SupportChatModal
                open={chatOpen}
                onClose={() => setChatOpen(false)}
                userId={userId}
                onUnreadChange={setUnreadCount}
              />
            </>
          )}

          <div className="space-y-4 md:space-y-5">
            {/* Email */}
            <div className="bg-card border rounded-lg p-4 md:p-5">
              <div className="flex items-start gap-3 md:gap-4">
                <div className="bg-primary/10 p-2 md:p-2.5 rounded-lg">
                  <Icon name="Mail" className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base md:text-lg font-semibold mb-1.5 md:mb-2">Электронная почта</h3>
                  <p className="text-sm md:text-base text-muted-foreground mb-2">
                    Отправьте нам сообщение, и мы ответим в ближайшее время
                  </p>
                  <a href={`mailto:${supportEmail}`} className="text-primary hover:underline inline-flex items-center gap-1.5 font-medium">
                    {supportEmail}
                  </a>
                </div>
              </div>
            </div>

            {/* Телефон */}
            <div className="bg-card border rounded-lg p-4 md:p-5">
              <div className="flex items-start gap-3 md:gap-4">
                <div className="bg-primary/10 p-2 md:p-2.5 rounded-lg">
                  <Icon name={phoneContactMethod === 'telegram' ? 'MessageCircle' : 'Phone'}
                    className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base md:text-lg font-semibold mb-1.5 md:mb-2">Телефон горячей линии</h3>
                  <p className="text-sm md:text-base text-muted-foreground mb-3">Свяжитесь с нами удобным способом</p>
                  <p className="text-primary font-medium mb-3">{supportPhone}</p>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={phoneContactMethod === 'call' ? `tel:${supportPhone.replace(/[^0-9+]/g, '')}` : '#'}
                      onClick={e => { if (phoneContactMethod !== 'call') { e.preventDefault(); setPhoneContactMethod('call'); } }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${phoneContactMethod === 'call' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-accent border-border'}`}>
                      <Icon name="Phone" className="h-4 w-4" />
                      <span className="text-sm font-medium">Позвонить</span>
                    </a>
                    <a
                      href={telegramLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setPhoneContactMethod('telegram')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${phoneContactMethod === 'telegram' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-accent border-border'}`}>
                      <Icon name="MessageCircle" className="h-4 w-4" />
                      <span className="text-sm font-medium">Telegram</span>
                    </a>
                  </div>
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