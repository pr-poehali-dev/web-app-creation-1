import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Icon from '@/components/ui/icon';
import BackButton from '@/components/BackButton';
import SupportCard from '@/components/SupportCard';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import funcUrl from '../../backend/func2url.json';

interface SupportProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function Support({ isAuthenticated, onLogout }: SupportProps) {
  useScrollToTop();
  const [supportContact, setSupportContact] = useState('support@erttp.ru');
  const [supportType, setSupportType] = useState<'email' | 'phone' | 'telegram' | 'whatsapp' | 'url'>('email');

  useEffect(() => {
    const fetchSupportSettings = async () => {
      try {
        const [contactRes, typeRes] = await Promise.all([
          fetch(`${funcUrl['site-settings']}?key=support_contact`),
          fetch(`${funcUrl['site-settings']}?key=support_type`)
        ]);

        if (contactRes.ok) {
          const data = await contactRes.json();
          if (data.setting_value) {
            setSupportContact(data.setting_value);
          }
        }

        if (typeRes.ok) {
          const data = await typeRes.json();
          if (data.setting_value) {
            setSupportType(data.setting_value as typeof supportType);
          }
        }
      } catch (error) {
        console.error('Ошибка загрузки настроек техподдержки:', error);
      }
    };

    fetchSupportSettings();
  }, []);
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />

      <main className="container mx-auto px-4 py-4 md:py-6 flex-1">
        <BackButton />
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4 md:mb-6">
            Поддержка
          </h1>

          <SupportCard className="mb-6" />

          <div className="space-y-4 md:space-y-5">
            <div className="bg-card border rounded-lg p-4 md:p-5">
              <div className="flex items-start gap-3 md:gap-4">
                <div className="bg-primary/10 p-2 md:p-2.5 rounded-lg">
                  <Icon 
                    name={
                      supportType === 'email' ? 'Mail' :
                      supportType === 'phone' ? 'Phone' :
                      supportType === 'telegram' ? 'MessageCircle' :
                      supportType === 'whatsapp' ? 'MessageSquare' :
                      'ExternalLink'
                    } 
                    className="h-5 w-5 md:h-6 md:w-6 text-primary" 
                  />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-semibold mb-1.5 md:mb-2">
                    {supportType === 'email' && 'Свяжитесь с нами по email'}
                    {supportType === 'phone' && 'Телефон горячей линии'}
                    {supportType === 'telegram' && 'Напишите нам в Telegram'}
                    {supportType === 'whatsapp' && 'Напишите нам в WhatsApp'}
                    {supportType === 'url' && 'Форма обратной связи'}
                  </h3>
                  <p className="text-sm md:text-base text-muted-foreground mb-1.5 md:mb-2">
                    {supportType === 'email' && 'Отправьте нам сообщение, и мы ответим в ближайшее время'}
                    {supportType === 'phone' && 'Позвоните нам в рабочее время'}
                    {supportType === 'telegram' && 'Быстрый и удобный способ связи через мессенджер'}
                    {supportType === 'whatsapp' && 'Свяжитесь с нами через WhatsApp'}
                    {supportType === 'url' && 'Заполните форму обратной связи на нашем сайте'}
                  </p>
                  <a 
                    href={
                      supportType === 'email' ? `mailto:${supportContact}` :
                      supportType === 'phone' ? `tel:${supportContact.replace(/[^0-9+]/g, '')}` :
                      supportType === 'telegram' ? (supportContact.startsWith('http') ? supportContact : `https://t.me/${supportContact}`) :
                      supportType === 'whatsapp' ? (supportContact.startsWith('http') ? supportContact : `https://wa.me/${supportContact.replace(/[^0-9]/g, '')}`) :
                      supportContact
                    }
                    target={supportType === 'url' || supportType === 'telegram' || supportType === 'whatsapp' ? '_blank' : undefined}
                    rel={supportType === 'url' || supportType === 'telegram' || supportType === 'whatsapp' ? 'noopener noreferrer' : undefined}
                    className="text-primary hover:underline inline-flex items-center gap-1.5"
                  >
                    {supportContact}
                    {(supportType === 'url' || supportType === 'telegram' || supportType === 'whatsapp') && (
                      <Icon name="ExternalLink" className="h-3.5 w-3.5" />
                    )}
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-card border rounded-lg p-4 md:p-5">
              <div className="flex items-start gap-3 md:gap-4">
                <div className="bg-primary/10 p-2 md:p-2.5 rounded-lg">
                  <Icon name="Info" className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-semibold mb-1.5 md:mb-2">Часы работы поддержки</h3>
                  <p className="text-sm md:text-base text-muted-foreground">
                    Понедельник - Пятница: 9:00 - 18:00 (МСК)<br />
                    Суббота - Воскресенье: выходной
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