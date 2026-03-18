import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { contentAPI } from '@/services/api';
import Icon from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';
import {
  type ContentItem,
  type BannerItem,
  type BannerFormState,
  EMPTY_BANNER,
  isBannerActive,
} from './content-management/types';
import ContentTextsTab from './content-management/ContentTextsTab';
import BannersTab from './content-management/BannersTab';

export default function AdminContentManagement() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'texts' | 'banners'>('texts');
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showBannerForm, setShowBannerForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerItem | null>(null);
  const [bannerForm, setBannerForm] = useState<BannerFormState>({ ...EMPTY_BANNER });
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadData();
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'texts') {
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
      } else {
        const data = await contentAPI.getAllBannersAdmin();
        const arr: BannerItem[] = [];
        if (Array.isArray(data)) {
          (data as Record<string, unknown>[]).forEach((item) => {
            if (item) {
              arr.push({
                id: Number(item.id) || 0,
                title: String(item.title || ''),
                message: String(item.message || ''),
                type: String(item.type || 'info'),
                start_date: item.start_date ? String(item.start_date) : null,
                end_date: item.end_date ? String(item.end_date) : null,
                is_active: Boolean(item.is_active),
                background_color: item.background_color ? String(item.background_color) : undefined,
                text_color: item.text_color ? String(item.text_color) : undefined,
                icon: item.icon ? String(item.icon) : undefined,
                show_on_pages: Array.isArray(item.show_on_pages) ? item.show_on_pages.map(String) : undefined,
              });
            }
          });
        }
        setBanners(arr);
      }
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
      showSuccess('Текст сохранён');
    } catch (error) {
      console.error('Failed to update content:', error);
      alert('Ошибка при сохранении: ' + (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBanner = async () => {
    if (!bannerForm.title.trim() || !bannerForm.message.trim()) {
      alert('Заполните заголовок и сообщение');
      return;
    }
    if (!bannerForm.startDate || !bannerForm.endDate) {
      alert('Укажите период показа баннера');
      return;
    }
    try {
      setSaving(true);
      if (editingBanner) {
        await contentAPI.updateBannerAdmin(editingBanner.id, bannerForm);
        showSuccess('Баннер обновлён');
      } else {
        await contentAPI.createBannerAdmin(bannerForm);
        showSuccess('Баннер создан');
      }
      setShowBannerForm(false);
      setEditingBanner(null);
      setBannerForm({ ...EMPTY_BANNER });
      await loadData();
    } catch (error) {
      console.error('Failed to save banner:', error);
      alert('Ошибка при сохранении баннера: ' + (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleEditBanner = (banner: BannerItem) => {
    setEditingBanner(banner);
    setBannerForm({
      title: banner.title,
      message: banner.message,
      type: banner.type,
      startDate: banner.start_date || '',
      endDate: banner.end_date || '',
      isActive: banner.is_active,
      backgroundColor: banner.background_color || '#4F46E5',
      textColor: banner.text_color || '#FFFFFF',
      icon: banner.icon || '',
      showOnPages: banner.show_on_pages || ['home'],
    });
    setShowBannerForm(true);
  };

  const handleToggleBanner = async (banner: BannerItem) => {
    try {
      await contentAPI.updateBannerAdmin(banner.id, { isActive: !banner.is_active });
      setBanners(banners.map(b => b.id === banner.id ? { ...b, is_active: !b.is_active } : b));
      showSuccess(banner.is_active ? 'Баннер отключён' : 'Баннер включён');
    } catch (error) {
      alert('Ошибка: ' + (error as Error).message);
    }
  };

  const handleDeleteBanner = async (bannerId: number) => {
    if (!confirm('Удалить этот баннер? Это действие нельзя отменить.')) return;
    try {
      await contentAPI.deleteBannerAdmin(bannerId);
      setBanners(banners.filter(b => b.id !== bannerId));
      showSuccess('Баннер удалён');
    } catch (error) {
      alert('Ошибка: ' + (error as Error).message);
    }
  };

  const handleCancelBannerForm = () => {
    setShowBannerForm(false);
    setEditingBanner(null);
    setBannerForm({ ...EMPTY_BANNER });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 md:p-6">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/admin/panel')}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <Icon name="ArrowLeft" size={22} />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Управление контентом</h1>
            <p className="text-sm text-muted-foreground">Редактирование текстов и баннеров сайта</p>
          </div>
        </div>

        {/* Success message */}
        {successMsg && (
          <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-800">
            <Icon name="CheckCircle" size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg mb-6 w-fit">
          <button
            onClick={() => setActiveTab('texts')}
            className={`px-5 py-2 rounded-md font-medium text-sm transition-colors ${
              activeTab === 'texts'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="flex items-center gap-2">
              <Icon name="FileText" size={16} />
              Тексты сайта
            </span>
          </button>
          <button
            onClick={() => setActiveTab('banners')}
            className={`px-5 py-2 rounded-md font-medium text-sm transition-colors ${
              activeTab === 'banners'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="flex items-center gap-2">
              <Icon name="Megaphone" size={16} />
              Баннеры
              {banners.filter(b => isBannerActive(b)).length > 0 && (
                <Badge className="ml-1 bg-green-500 text-white text-xs px-1.5 py-0">
                  {banners.filter(b => isBannerActive(b)).length}
                </Badge>
              )}
            </span>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
          </div>
        ) : activeTab === 'texts' ? (
          <ContentTextsTab
            contentItems={contentItems}
            editingKey={editingKey}
            editValue={editValue}
            saving={saving}
            onStartEdit={(key, value) => { setEditingKey(key); setEditValue(value); }}
            onCancelEdit={() => { setEditingKey(null); setEditValue(''); }}
            onChangeValue={setEditValue}
            onSave={handleSaveText}
          />
        ) : (
          <BannersTab
            banners={banners}
            showBannerForm={showBannerForm}
            editingBanner={editingBanner}
            bannerForm={bannerForm}
            saving={saving}
            onShowForm={() => setShowBannerForm(true)}
            onChangeBannerForm={setBannerForm}
            onSaveBanner={handleSaveBanner}
            onCancelBannerForm={handleCancelBannerForm}
            onEditBanner={handleEditBanner}
            onToggleBanner={handleToggleBanner}
            onDeleteBanner={handleDeleteBanner}
          />
        )}
      </div>
    </div>
  );
}
