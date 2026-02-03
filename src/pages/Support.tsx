import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Icon from '@/components/ui/icon';
import BackButton from '@/components/BackButton';

import { useScrollToTop } from '@/hooks/useScrollToTop';
import funcUrl from '../../backend/func2url.json';

interface SupportProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function Support({ isAuthenticated, onLogout }: SupportProps) {
  useScrollToTop();
  const [supportEmail, setSupportEmail] = useState('support@erttp.ru');
  const [supportPhone, setSupportPhone] = useState('+7 (984) 101-73-55');
  const [phoneContactMethod, setPhoneContactMethod] = useState<'whatsapp' | 'telegram' | 'call'>('call');

  useEffect(() => {
    const fetchSupportSettings = async () => {
      try {
        const [emailRes, phoneRes, methodRes] = await Promise.all([
          fetch(`${funcUrl['site-settings']}?key=support_email`),
          fetch(`${funcUrl['site-settings']}?key=support_phone`),
          fetch(`${funcUrl['site-settings']}?key=phone_contact_method`)
        ]);

        if (emailRes.ok) {
          const data = await emailRes.json();
          if (data.setting_value) {
            setSupportEmail(data.setting_value);
          }
        }

        if (phoneRes.ok) {
          const data = await phoneRes.json();
          if (data.setting_value) {
            setSupportPhone(data.setting_value);
          }
        }

        if (methodRes.ok) {
          const data = await methodRes.json();
          if (data.setting_value) {
            setPhoneContactMethod(data.setting_value as typeof phoneContactMethod);
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



          <div className="space-y-4 md:space-y-5">
            {/* Email контакт */}
            <div className="bg-card border rounded-lg p-4 md:p-5">
              <div className="flex items-start gap-3 md:gap-4">
                <div className="bg-primary/10 p-2 md:p-2.5 rounded-lg">
                  <Icon name="Mail" className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base md:text-lg font-semibold mb-1.5 md:mb-2">
                    Электронная почта
                  </h3>
                  <p className="text-sm md:text-base text-muted-foreground mb-2">
                    Отправьте нам сообщение, и мы ответим в ближайшее время
                  </p>
                  <a 
                    href={`mailto:${supportEmail}`}
                    className="text-primary hover:underline inline-flex items-center gap-1.5 font-medium"
                  >
                    {supportEmail}
                  </a>
                </div>
              </div>
            </div>

            {/* Телефон с выбором способа связи */}
            <div className="bg-card border rounded-lg p-4 md:p-5">
              <div className="flex items-start gap-3 md:gap-4">
                <div className="bg-primary/10 p-2 md:p-2.5 rounded-lg">
                  <Icon 
                    name={
                      phoneContactMethod === 'whatsapp' ? 'MessageSquare' :
                      phoneContactMethod === 'telegram' ? 'MessageCircle' :
                      'Phone'
                    }
                    className="h-5 w-5 md:h-6 md:w-6 text-primary" 
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-base md:text-lg font-semibold mb-1.5 md:mb-2">
                    Телефон горячей линии
                  </h3>
                  <p className="text-sm md:text-base text-muted-foreground mb-3">
                    Свяжитесь с нами удобным способом
                  </p>
                  
                  <div className="mb-3">
                    <p className="text-primary font-medium mb-2">{supportPhone}</p>
                  </div>

                  {/* Кнопки выбора способа связи */}
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={phoneContactMethod === 'call' ? `tel:${supportPhone.replace(/[^0-9+]/g, '')}` : '#'}
                      onClick={(e) => {
                        if (phoneContactMethod !== 'call') {
                          e.preventDefault();
                          setPhoneContactMethod('call');
                        }
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                        phoneContactMethod === 'call'
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background hover:bg-accent border-border'
                      }`}
                    >
                      <Icon name="Phone" className="h-4 w-4" />
                      <span className="text-sm font-medium">Позвонить</span>
                    </a>

                    <a
                      href={phoneContactMethod === 'whatsapp' ? `https://wa.me/${supportPhone.replace(/[^0-9]/g, '')}` : '#'}
                      target={phoneContactMethod === 'whatsapp' ? '_blank' : undefined}
                      rel={phoneContactMethod === 'whatsapp' ? 'noopener noreferrer' : undefined}
                      onClick={(e) => {
                        if (phoneContactMethod !== 'whatsapp') {
                          e.preventDefault();
                          setPhoneContactMethod('whatsapp');
                          // Открываем сразу после выбора
                          setTimeout(() => {
                            window.open(`https://wa.me/${supportPhone.replace(/[^0-9]/g, '')}`, '_blank');
                          }, 100);
                        }
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                        phoneContactMethod === 'whatsapp'
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background hover:bg-accent border-border'
                      }`}
                    >
                      <Icon name="MessageSquare" className="h-4 w-4" />
                      <span className="text-sm font-medium">WhatsApp</span>
                    </a>

                    <a
                      href={phoneContactMethod === 'telegram' ? `https://t.me/${supportPhone.replace(/[^0-9]/g, '')}` : '#'}
                      target={phoneContactMethod === 'telegram' ? '_blank' : undefined}
                      rel={phoneContactMethod === 'telegram' ? 'noopener noreferrer' : undefined}
                      onClick={(e) => {
                        if (phoneContactMethod !== 'telegram') {
                          e.preventDefault();
                          setPhoneContactMethod('telegram');
                          // Открываем сразу после выбора
                          setTimeout(() => {
                            window.open(`https://t.me/${supportPhone.replace(/[^0-9]/g, '')}`, '_blank');
                          }, 100);
                        }
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                        phoneContactMethod === 'telegram'
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background hover:bg-accent border-border'
                      }`}
                    >
                      <Icon name="MessageCircle" className="h-4 w-4" />
                      <span className="text-sm font-medium">Telegram</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Часы работы */}
            <div className="bg-card border rounded-lg p-4 md:p-5">
              <div className="flex items-start gap-3 md:gap-4">
                <div className="bg-primary/10 p-2 md:p-2.5 rounded-lg">
                  <Icon name="Clock" className="h-5 w-5 md:h-6 md:w-6 text-primary" />
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