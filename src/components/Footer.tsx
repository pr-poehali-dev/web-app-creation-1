import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/30 mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Icon name="Building2" className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-primary">ЕРТТ</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Единая Региональная Торговая Площадка
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Основные разделы</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/home" className="text-muted-foreground hover:text-primary transition-colors">
                  Предложения
                </Link>
              </li>
              <li>
                <Link to="/requests" className="text-muted-foreground hover:text-primary transition-colors">
                  Запросы
                </Link>
              </li>
              <li>
                <Link to="/auction" className="text-muted-foreground hover:text-primary transition-colors">
                  Аукцион
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-primary transition-colors">
                  О площадке
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
                <span className="font-medium">ООО "Региональная Торговая Площадка"</span>
              </p>
              <p>ИНН: 1234567890</p>
              <p>ОГРН: 1231234567890</p>
              <p className="text-xs">
                Юридический адрес: г. Нюрба, ул. Степана Васильева, д. 15
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <p className="text-sm text-muted-foreground">
                © {currentYear} Единая Региональная Торговая Площадка. Все права защищены.
              </p>
              <Link 
                to="/admin" 
                className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Icon name="Shield" className="h-3 w-3" />
                админ.ертп
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="mailto:support@example.com"
                className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
              >
                <Icon name="Mail" className="h-4 w-4" />
                support@erttp.ru
              </a>
              <a
                href="tel:+78001234567"
                className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
              >
                <Icon name="Phone" className="h-4 w-4" />
                8 (800) 123-45-67
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}