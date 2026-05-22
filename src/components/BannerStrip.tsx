import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { useLocation } from 'react-router-dom';
import func2url from '../../backend/func2url.json';

interface Banner {
  id: number;
  title: string;
  message: string;
  background_color?: string;
  text_color?: string;
  icon?: string;
  show_on_pages?: string[];
}

const CONTENT_API = func2url['content-management'];

const PAGE_MAP: Record<string, string> = {
  '/': 'home',
  '/zaprosy': 'requests',
  '/auction': 'auctions',
};

export default function BannerStrip() {
  const location = useLocation();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    const cached = sessionStorage.getItem('active_banners');
    if (cached) {
      try { setBanners(JSON.parse(cached)); return; } catch { /* ignore */ }
    }
    fetch(`${CONTENT_API}?banners=true`)
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setBanners(list);
        sessionStorage.setItem('active_banners', JSON.stringify(list));
      })
      .catch(() => {});
  }, []);

  const currentPage = PAGE_MAP[location.pathname] || location.pathname.replace('/', '') || 'home';

  const visible = banners.filter(b => {
    if (dismissed.has(b.id)) return false;
    if (!b.show_on_pages || b.show_on_pages.length === 0) return true;
    return b.show_on_pages.includes(currentPage);
  });

  if (visible.length === 0) return null;

  return (
    <div className="w-full">
      {visible.map(banner => {
        const bg = banner.background_color || '#4F46E5';
        const color = banner.text_color || '#FFFFFF';
        const isOpen = expanded === banner.id;

        return (
          <div key={banner.id} style={{ backgroundColor: bg, color }}>
            <div className="container mx-auto px-4">
              <div
                className="flex items-center gap-3 py-2.5 cursor-pointer select-none"
                onClick={() => setExpanded(isOpen ? null : banner.id)}
              >
                {banner.icon && (
                  <span className="text-lg shrink-0">{banner.icon}</span>
                )}
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-sm">{banner.title}</span>
                  {!isOpen && (
                    <span className="text-sm opacity-80 ml-2 truncate hidden sm:inline">
                      {banner.message}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-xs opacity-70 hidden sm:inline">
                    {isOpen ? 'Свернуть' : 'Подробнее'}
                  </span>
                  <Icon
                    name={isOpen ? 'ChevronUp' : 'ChevronDown'}
                    size={16}
                    className="opacity-80"
                  />
                  <button
                    onClick={e => { e.stopPropagation(); setDismissed(prev => new Set(prev).add(banner.id)); }}
                    className="ml-1 p-1 rounded hover:opacity-70 transition-opacity"
                    aria-label="Закрыть"
                  >
                    <Icon name="X" size={15} />
                  </button>
                </div>
              </div>

              {isOpen && (
                <div className="pb-3 text-sm leading-relaxed opacity-90 whitespace-pre-wrap">
                  {banner.message}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
