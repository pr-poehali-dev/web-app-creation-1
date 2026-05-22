import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { contentAPI } from '@/services/api';
import { invalidateSiteContentCache } from '@/hooks/useSiteContent';
import Icon from '@/components/ui/icon';
import {
  type ContentItem,
  type BannerItem,
  type BannerFormState,
  EMPTY_BANNER,
  isBannerActive,
} from './content-management/types';
import ContentTextsTab from './content-management/ContentTextsTab';
import BannersTab from './content-management/BannersTab';

type Tab = 'texts' | 'banners';

export default function AdminContentManagement() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('texts');

  // Тексты
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Баннеры
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [showBannerForm, setShowBannerForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerItem | null>(null);
  const [bannerForm, setBannerForm] = useState<BannerFormState>(EMPTY_BANNER);
  const [bannerSaving, setBannerSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await contentAPI.getContent();
      const arr: ContentItem[] = [];
      if (data && Array.isArray(data.content)) {
        (data.content as Record<string, unknown>[]).forEach((item) => {
          if (item && item.key) {
            arr.push({
              id: Number(item.id) || 0,
              key: String(item.key),
              value: String(item.value || ''),
              description: item.description ? String(item.description) : undefined,
              category: item.category ? String(item.category) : undefined,
            });
          }
        });
      }
      setContentItems(arr);

      // Загружаем баннеры
      const rawBanners = data.banners || [];
      setBanners(rawBanners.map((b: Record<string, unknown>) => b as unknown as BannerItem));
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveText = async (key: string) => {
    try {
      setSaving(true);
      await contentAPI.updateContent(key, editValue);
      setContentItems(contentItems.map(item =>
        item.key === key ? { ...item, value: editValue } : item
      ));
      setEditingKey(null);
      setEditValue('');
      invalidateSiteContentCache();
      showSuccess('Текст сохранён');
    } catch (error) {
      console.error('Failed to update content:', error);
      alert('Ошибка при сохранении: ' + (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveValue = async (key: string, value: string) => {
    try {
      setSaving(true);
      await contentAPI.updateContent(key, value);
      setContentItems(contentItems.map(item =>
        item.key === key ? { ...item, value } : item
      ));
      invalidateSiteContentCache();
      showSuccess('Сохранено');
    } catch (error) {
      console.error('Failed to update content:', error);
      alert('Ошибка: ' + (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  // --- Баннеры ---

  const handleShowBannerForm = () => {
    setEditingBanner(null);
    setBannerForm(EMPTY_BANNER);
    setShowBannerForm(true);
  };

  const handleEditBanner = (banner: BannerItem) => {
    setEditingBanner(banner);
    setBannerForm({
      title: banner.title,
      message: banner.message,
      type: banner.type || 'info',
      startDate: banner.start_date ? banner.start_date.slice(0, 10) : '',
      endDate: banner.end_date ? banner.end_date.slice(0, 10) : '',
      isActive: banner.is_active,
      backgroundColor: banner.background_color || '#4F46E5',
      textColor: banner.text_color || '#FFFFFF',
      icon: banner.icon || '',
      showOnPages: banner.show_on_pages || ['home'],
      showRegions: banner.show_regions || [],
      showDistricts: banner.show_districts || [],
    });
    setShowBannerForm(true);
  };

  const handleSaveBanner = async () => {
    if (!bannerForm.title.trim()) { alert('Введите заголовок'); return; }
    if (!bannerForm.message.trim()) { alert('Введите текст баннера'); return; }
    if (!bannerForm.startDate || !bannerForm.endDate) { alert('Укажите даты показа'); return; }
    try {
      setBannerSaving(true);
      if (editingBanner) {
        await contentAPI.updateBannerAdmin(editingBanner.id, {
          title: bannerForm.title,
          message: bannerForm.message,
          type: bannerForm.type,
          start_date: bannerForm.startDate,
          end_date: bannerForm.endDate,
          is_active: bannerForm.isActive,
          background_color: bannerForm.backgroundColor,
          text_color: bannerForm.textColor,
          icon: bannerForm.icon,
          show_on_pages: bannerForm.showOnPages,
          show_regions: bannerForm.showRegions.length > 0 ? bannerForm.showRegions : null,
          show_districts: bannerForm.showDistricts.length > 0 ? bannerForm.showDistricts : null,
        });
        showSuccess('Баннер обновлён');
      } else {
        await contentAPI.createBannerAdmin({
          title: bannerForm.title,
          message: bannerForm.message,
          type: bannerForm.type,
          startDate: bannerForm.startDate,
          endDate: bannerForm.endDate,
          isActive: bannerForm.isActive,
          backgroundColor: bannerForm.backgroundColor,
          textColor: bannerForm.textColor,
          icon: bannerForm.icon,
          showOnPages: bannerForm.showOnPages,
          showRegions: bannerForm.showRegions.length > 0 ? bannerForm.showRegions : null,
          showDistricts: bannerForm.showDistricts.length > 0 ? bannerForm.showDistricts : null,
        });
        showSuccess('Баннер создан и опубликован');
      }
      sessionStorage.removeItem('active_banners');
      setShowBannerForm(false);
      setEditingBanner(null);
      await loadData();
    } catch (error) {
      alert('Ошибка: ' + (error as Error).message);
    } finally {
      setBannerSaving(false);
    }
  };

  const handleToggleBanner = async (banner: BannerItem) => {
    try {
      await contentAPI.updateBannerAdmin(banner.id, { is_active: !banner.is_active });
      sessionStorage.removeItem('active_banners');
      showSuccess(banner.is_active ? 'Баннер выключен' : 'Баннер включён');
      await loadData();
    } catch (error) {
      alert('Ошибка: ' + (error as Error).message);
    }
  };

  const handleDeleteBanner = async (bannerId: number) => {
    if (!confirm('Удалить баннер?')) return;
    try {
      await contentAPI.deleteBannerAdmin(bannerId);
      sessionStorage.removeItem('active_banners');
      showSuccess('Баннер удалён');
      await loadData();
    } catch (error) {
      alert('Ошибка: ' + (error as Error).message);
    }
  };

  const activeBannersCount = banners.filter(isBannerActive).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 md:p-6">

        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/admin/panel')}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <Icon name="ArrowLeft" size={22} />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Управление контентом</h1>
            <p className="text-sm text-muted-foreground">Тексты сайта и праздничные баннеры</p>
          </div>
        </div>

        {successMsg && (
          <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-800">
            <Icon name="CheckCircle" size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Табы */}
        <div className="flex gap-1 mb-6 bg-muted p-1 rounded-lg w-fit">
          <button
            onClick={() => setTab('texts')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === 'texts'
                ? 'bg-background shadow text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="flex items-center gap-2">
              <Icon name="FileText" size={15} />
              Тексты сайта
            </span>
          </button>
          <button
            onClick={() => setTab('banners')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === 'banners'
                ? 'bg-background shadow text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="flex items-center gap-2">
              <Icon name="Megaphone" size={15} />
              Баннеры
              {activeBannersCount > 0 && (
                <span className="bg-green-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                  {activeBannersCount}
                </span>
              )}
            </span>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
          </div>
        ) : tab === 'texts' ? (
          <ContentTextsTab
            contentItems={contentItems}
            editingKey={editingKey}
            editValue={editValue}
            saving={saving}
            onStartEdit={(key, value) => { setEditingKey(key); setEditValue(value); }}
            onCancelEdit={() => { setEditingKey(null); setEditValue(''); }}
            onChangeValue={setEditValue}
            onSave={handleSaveText}
            onSaveValue={handleSaveValue}
          />
        ) : (
          <BannersTab
            banners={banners}
            showBannerForm={showBannerForm}
            editingBanner={editingBanner}
            bannerForm={bannerForm}
            saving={bannerSaving}
            onShowForm={handleShowBannerForm}
            onChangeBannerForm={setBannerForm}
            onSaveBanner={handleSaveBanner}
            onCancelBannerForm={() => { setShowBannerForm(false); setEditingBanner(null); }}
            onEditBanner={handleEditBanner}
            onToggleBanner={handleToggleBanner}
            onDeleteBanner={handleDeleteBanner}
          />
        )}
      </div>
    </div>
  );
}