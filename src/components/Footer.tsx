import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { useTimezone } from '@/contexts/TimezoneContext';


const TIMEZONE_NAMES: Record<string, string> = {
  'Asia/Yakutsk': 'UTC+9 (Якутск)',
  'Asia/Vladivostok': 'UTC+10 (Владивосток)',
  'Asia/Irkutsk': 'UTC+8 (Иркутск)',
  'Asia/Krasnoyarsk': 'UTC+7 (Красноярск)',
  'Asia/Novosibirsk': 'UTC+7 (Новосибирск)',
  'Asia/Omsk': 'UTC+6 (Омск)',
  'Asia/Yekaterinburg': 'UTC+5 (Екатеринбург)',
  'Europe/Moscow': 'UTC+3 (Москва)',
  'Europe/Samara': 'UTC+4 (Самара)',
  'Asia/Sakhalin': 'UTC+11 (Сахалин)',
  'Asia/Magadan': 'UTC+11 (Магадан)',
  'Asia/Kamchatka': 'UTC+12 (Камчатка)',
};

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { timezone } = useTimezone();
  
  // Получаем красивое название часового пояса
  const getTimezoneName = (tz: string): string => {
    if (TIMEZONE_NAMES[tz]) {
      return TIMEZONE_NAMES[tz];
    }
    // Если часовой пояс неизвестен, показываем его название
    const cityName = tz.split('/')[1]?.replace(/_/g, ' ') || tz;
    try {
      const offset = new Intl.DateTimeFormat('ru-RU', { 
        timeZone: tz, 
        timeZoneName: 'shortOffset' 
      }).formatToParts(new Date()).find(p => p.type === 'timeZoneName')?.value || '';
      return `${offset} (${cityName})`;
    } catch {
      return cityName;
    }
  };
  
  const timezoneName = getTimezoneName(timezone);

  return (
    <footer className="border-t bg-muted/30 mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="h-8 w-8 overflow-hidden rounded-lg flex items-center justify-center">
                <img 
                  src="https://cdn.poehali.dev/projects/1a60f89a-b726-4c33-8dad-d42db554ed3e/bucket/33aebfb8-14a4-47db-8883-2c74b62cdba4.png" 
                  alt="ЕРТТП" 
                  className="h-full w-full object-contain"
                />
              </div>
              <span className="font-bold text-primary">ЕРТТП</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Единая Региональная Товарно-Торговая Площадка
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Основные разделы</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/predlozheniya" className="text-muted-foreground hover:text-primary transition-colors">
                  Предложения
                </Link>
              </li>
              <li>
                <Link to="/zaprosy" className="text-muted-foreground hover:text-primary transition-colors">
                  Запросы
                </Link>
              </li>
              <li>
                <Link to="/auction" className="text-muted-foreground hover:text-primary transition-colors">
                  Аукцион
                </Link>
              </li>
              <li>
                <Link to="/support" className="text-muted-foreground hover:text-primary transition-colors">
                  Поддержка
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Юридическая информация</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                  Пользовательское соглашение
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                  Политика конфиденциальности
                </Link>
              </li>
              <li>
                <Link to="/offer-agreement" className="text-muted-foreground hover:text-primary transition-colors">
                  Публичная оферта
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Реквизиты оператора</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <span className="font-medium">ООО "Дойдум-Инвест"</span>
              </p>
              <p>ИНН: 1400022716</p>
              <p>ОГРН: 1231400005682</p>
              <p className="text-xs">
                Юридический адрес: г. Нюрба, ул. Степана Васильева, д. 15
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t space-y-6">
          <div className="bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-300 dark:border-amber-700 rounded-lg p-4 md:p-6">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Icon name="AlertCircle" className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-3 flex-1">
                  <h4 className="font-semibold text-foreground text-base">Внимание!</h4>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    Сайт/веб-приложение находится на стадии активной начальной разработки. В связи с этим возможны временные некорректности в работе, изменения в функционале и появление тестовых заявок. Приносим извинения за возможные неудобства.
                  </p>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    Мы верим в потенциал этого проекта и приглашаем вас стать частью его успеха! Проект нуждается в финансировании для дальнейшего развития и реализации перспективных возможностей. По вопросам спонсорства и инвестиций просим обращаться к разработчику по контактам, указанным ниже.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-col items-center md:items-start gap-1">
              <p className="text-sm text-muted-foreground">
                © {currentYear} Единая Региональная Товарно-Торговая Площадка. Все права защищены.
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Icon name="Clock" className="h-3 w-3" />
                Часовой пояс: {timezoneName}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="mailto:doydum-invest@mail.ru"
                className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
              >
                <Icon name="Mail" className="h-4 w-4" />
                doydum-invest@mail.ru
              </a>
              <a
                href="tel:+79841017355"
                className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
              >
                <Icon name="Phone" className="h-4 w-4" />
                +7 (984) 101-73-55
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}