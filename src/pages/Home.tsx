import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { useSiteContent } from '@/hooks/useSiteContent';

interface HomeProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

const FALLBACK_HTML = `<h2>Почему ЕРТТП — ваш надёжный партнёр?</h2>
<p>ЕРТТП — это современная онлайн‑платформа, созданная для поддержки и развития местного бизнеса. Мы объединяем производителей, поставщиков и потребителей, формируя устойчивую экосистему региональной торговли.</p>
<p>Наша цель — сделать локальный рынок более эффективным, прозрачным и доступным для всех участников.</p>`;

export default function Home({ isAuthenticated, onLogout }: HomeProps) {
  useScrollToTop();
  const { toast } = useToast();

  const content = useSiteContent(['about.page']);
  const pageHtml = content['about.page'] || FALLBACK_HTML;

  const handleJoinClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isAuthenticated) {
      e.preventDefault();
      toast({
        title: "Вы уже с нами!",
        description: "Вы авторизованы и можете пользоваться возможностями платформы",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />

      <main className="container mx-auto px-4 py-4 md:py-6 flex-1">
        <div className="max-w-4xl mx-auto">
          <div className="md:hidden mb-3">
            <BackButton />
          </div>

          <div
            className="about-rich-content text-foreground text-[15px] md:text-base leading-relaxed"
            dangerouslySetInnerHTML={{ __html: pageHtml }}
          />

          <div className="text-center py-6">
            <Link
              to="/register"
              onClick={handleJoinClick}
              className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 md:px-8 py-3 md:py-3.5 rounded-lg text-base md:text-lg font-semibold hover:bg-primary/90 transition-all shadow-md"
            >
              Зарегистрироваться бесплатно
              <Icon name="ArrowRight" className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
