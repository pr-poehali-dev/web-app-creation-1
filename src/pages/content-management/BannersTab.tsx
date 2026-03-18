import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { type BannerItem, type BannerFormState, PAGE_OPTIONS, isBannerActive, formatDate } from './types';
import BannerForm from './BannerForm';

interface BannersTabProps {
  banners: BannerItem[];
  showBannerForm: boolean;
  editingBanner: BannerItem | null;
  bannerForm: BannerFormState;
  saving: boolean;
  onShowForm: () => void;
  onChangeBannerForm: (form: BannerFormState) => void;
  onSaveBanner: () => void;
  onCancelBannerForm: () => void;
  onEditBanner: (banner: BannerItem) => void;
  onToggleBanner: (banner: BannerItem) => void;
  onDeleteBanner: (bannerId: number) => void;
}

export default function BannersTab({
  banners,
  showBannerForm,
  editingBanner,
  bannerForm,
  saving,
  onShowForm,
  onChangeBannerForm,
  onSaveBanner,
  onCancelBannerForm,
  onEditBanner,
  onToggleBanner,
  onDeleteBanner,
}: BannersTabProps) {
  return (
    <div className="space-y-4">
      {showBannerForm ? (
        <BannerForm
          bannerForm={bannerForm}
          editingBanner={editingBanner}
          saving={saving}
          onChange={onChangeBannerForm}
          onSave={onSaveBanner}
          onCancel={onCancelBannerForm}
        />
      ) : (
        <Button onClick={onShowForm} className="flex items-center gap-2">
          <Icon name="Plus" size={18} />
          Создать баннер
        </Button>
      )}

      {!showBannerForm && (
        banners.length === 0 ? (
          <div className="bg-card rounded-xl border p-10 text-center text-muted-foreground">
            <Icon name="Megaphone" size={40} className="mx-auto mb-3 opacity-40" />
            <p>Нет созданных баннеров</p>
            <p className="text-sm mt-1">Создайте праздничный баннер — он появится на выбранных страницах</p>
          </div>
        ) : (
          <div className="space-y-3">
            {banners.map((banner) => {
              const active = isBannerActive(banner);
              return (
                <div key={banner.id} className="bg-card rounded-xl border overflow-hidden">
                  <div
                    className="h-1.5"
                    style={{ backgroundColor: banner.background_color || '#4F46E5' }}
                  />
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{banner.title}</h3>
                          <Badge
                            variant={active ? 'default' : 'secondary'}
                            className={active ? 'bg-green-500 text-white' : ''}
                          >
                            {active ? 'Активен' : banner.is_active ? 'По датам неактивен' : 'Выключен'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{banner.message}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Icon name="Calendar" size={12} />
                            {formatDate(banner.start_date)} — {formatDate(banner.end_date)}
                          </span>
                          {banner.show_on_pages && banner.show_on_pages.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Icon name="Globe" size={12} />
                              {banner.show_on_pages.map(p => PAGE_OPTIONS.find(o => o.value === p)?.label || p).join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => onToggleBanner(banner)}
                          title={banner.is_active ? 'Выключить' : 'Включить'}
                          className={`p-2 rounded-lg transition-colors ${
                            banner.is_active
                              ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          <Icon name={banner.is_active ? 'PauseCircle' : 'PlayCircle'} size={18} />
                        </button>
                        <button
                          onClick={() => onEditBanner(banner)}
                          className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                        >
                          <Icon name="Pencil" size={18} />
                        </button>
                        <button
                          onClick={() => onDeleteBanner(banner.id)}
                          className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                        >
                          <Icon name="Trash2" size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
