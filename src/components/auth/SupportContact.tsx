import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import funcUrl from '../../../backend/func2url.json';

interface SupportContactProps {
  className?: string;
}

interface SupportSettings {
  contact: string;
  type: 'email' | 'phone' | 'telegram' | 'whatsapp' | 'url';
}

export default function SupportContact({ className = '' }: SupportContactProps) {
  const [support, setSupport] = useState<SupportSettings>({
    contact: 'support@example.com',
    type: 'email'
  });

  useEffect(() => {
    const fetchSupportSettings = async () => {
      try {
        const response = await fetch(`${funcUrl['site-settings']}?key=support_contact`);
        if (response.ok) {
          const data = await response.json();
          if (data.setting_value) {
            setSupport(prev => ({ ...prev, contact: data.setting_value }));
          }
        }

        const typeResponse = await fetch(`${funcUrl['site-settings']}?key=support_type`);
        if (typeResponse.ok) {
          const typeData = await typeResponse.json();
          if (typeData.setting_value) {
            setSupport(prev => ({ ...prev, type: typeData.setting_value as SupportSettings['type'] }));
          }
        }
      } catch (error) {
        console.error('Ошибка загрузки настроек техподдержки:', error);
      }
    };

    fetchSupportSettings();
  }, []);

  const getIcon = () => {
    switch (support.type) {
      case 'email':
        return 'Mail';
      case 'phone':
        return 'Phone';
      case 'telegram':
        return 'MessageCircle';
      case 'whatsapp':
        return 'MessageSquare';
      case 'url':
        return 'ExternalLink';
      default:
        return 'HelpCircle';
    }
  };

  const getHref = () => {
    switch (support.type) {
      case 'email':
        return `mailto:${support.contact}`;
      case 'phone':
        return `tel:${support.contact}`;
      case 'telegram':
        return support.contact.startsWith('http') ? support.contact : `https://t.me/${support.contact}`;
      case 'whatsapp':
        return support.contact.startsWith('http') ? support.contact : `https://wa.me/${support.contact.replace(/[^0-9]/g, '')}`;
      case 'url':
        return support.contact;
      default:
        return '#';
    }
  };

  const getLabel = () => {
    switch (support.type) {
      case 'email':
        return 'Написать в техподдержку';
      case 'phone':
        return 'Позвонить в техподдержку';
      case 'telegram':
        return 'Написать в Telegram';
      case 'whatsapp':
        return 'Написать в WhatsApp';
      case 'url':
        return 'Связаться с техподдержкой';
      default:
        return 'Техподдержка';
    }
  };

  return (
    <div className={`flex items-center justify-center gap-2 text-sm ${className}`}>
      <span className="text-muted-foreground">Нужна помощь?</span>
      <a
        href={getHref()}
        target={support.type === 'url' || support.type === 'telegram' || support.type === 'whatsapp' ? '_blank' : undefined}
        rel={support.type === 'url' || support.type === 'telegram' || support.type === 'whatsapp' ? 'noopener noreferrer' : undefined}
        className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 transition-colors font-medium"
      >
        <Icon name={getIcon()} className="h-4 w-4" />
        {getLabel()}
      </a>
    </div>
  );
}
