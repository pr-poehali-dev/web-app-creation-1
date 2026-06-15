import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { useLocation } from 'react-router-dom';
import { useDistrict } from '@/contexts/DistrictContext';
import func2url from '../../backend/func2url.json';

interface Banner {
  id: number;
  title: string;
  message: string;
  background_color?: string;
  text_color?: string;
  icon?: string;
  show_on_pages?: string[];
  show_regions?: string[];
  show_districts?: string[];
}

const CONTENT_API = func2url['content-management'];

const PAGE_MAP: Record<string, string> = {
  '/': 'home',
  '/zaprosy': 'requests',
  '/auction': 'auctions',
};

export default function BannerStrip() {
  const location = useLocation();
  const { selectedRegion, selectedDistricts } = useDistrict();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    const TTL = 60_000; // 1 минута
    try {
      const raw = sessionStorage.getItem('active_banners');
      if (raw) {
        const { ts, data } = JSON.parse(raw);
        if (Date.now() - ts < TTL) { setBanners(data); return; }
      }
    } catch { /* ignore */ }
    fetch(`${CONTENT_API}?banners=true`)
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setBanners(list);
        sessionStorage.setItem('active_banners', JSON.stringify({ ts: Date.now(), data: list }));
      })
      .catch(() => {});
  }, []);

  const currentPage = PAGE_MAP[location.pathname] || location.pathname.replace('/', '') || 'home';

  const visible = banners.filter(b => {
    if (dismissed.has(b.id)) return false;

    // Фильтр по странице
    if (b.show_on_pages && b.show_on_pages.length > 0) {
      if (!b.show_on_pages.includes(currentPage)) return false;
    }

    // Фильтр по региону
    if (b.show_regions && b.show_regions.length > 0) {
      if (selectedRegion === 'all') return false;
      if (!b.show_regions.includes(selectedRegion)) return false;

      // Фильтр по районам — если указаны, хотя бы один должен совпасть
      if (b.show_districts && b.show_districts.length > 0) {
        const hasMatchingDistrict = selectedDistricts.some(d => b.show_districts!.includes(d));
        if (!hasMatchingDistrict) return false;
      }
    }

    return true;
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
                className="flex items-center gap-3 py-2 cursor-pointer select-none"
                onClick={() => setExpanded(isOpen ? null : banner.id)}
              >
                {banner.icon && (
                  <span className="text-base shrink-0">{banner.icon}</span>
                )}

                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <span className="font-semibold text-sm shrink-0">{banner.title}</span>
                  {/* На десктопе — текст в одну строку, только когда свёрнут */}
                  {!isOpen && (
                    <span className="hidden md:block text-sm opacity-75 truncate">
                      {banner.message}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <span className="text-xs opacity-70 hidden sm:inline">
                    {isOpen ? 'Свернуть' : 'Подробнее'}
                  </span>
                  <Icon name={isOpen ? 'ChevronUp' : 'ChevronDown'} size={15} className="opacity-80" />
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setDismissed(prev => new Set(prev).add(banner.id));
                    }}
                    className="ml-1 p-1 rounded hover:opacity-60 transition-opacity"
                    aria-label="Закрыть"
                  >
                    <Icon name="X" size={14} />
                  </button>
                </div>
              </div>

              {/* Раскрытый полный текст */}
              {isOpen && (
                <div className="pb-3 text-sm leading-relaxed opacity-90 whitespace-pre-wrap border-t border-white/20 pt-2">
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