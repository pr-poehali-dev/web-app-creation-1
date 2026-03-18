import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { contentAPI } from '@/services/api';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface ContentItem {
  id: number;
  key: string;
  value: string;
  description?: string;
  category?: string;
}

interface BannerItem {
  id: number;
  title: string;
  message: string;
  type: string;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  background_color?: string;
  text_color?: string;
  icon?: string;
  show_on_pages?: string[];
}

const CONTENT_LABELS: Record<string, { label: string; hint: string }> = {
  'home.hero.title': { label: 'Заголовок главной страницы', hint: 'Крупный заголовок баннера на главной странице' },
  'home.hero.subtitle': { label: 'Подзаголовок главной страницы', hint: 'Описание под главным заголовком' },
  'home.cta.button': { label: 'Текст кнопки призыва к действию', hint: 'Кнопка под главным баннером' },
  'offers.empty.title': { label: 'Заголовок пустого списка предложений', hint: 'Показывается когда нет предложений' },
  'offers.empty.description': { label: 'Описание пустого списка предложений', hint: 'Пояснение когда нет предложений' },
  'about.title': { label: 'Заголовок "О нас"', hint: 'Заголовок страницы или блока "О нас"' },
  'about.content': { label: 'Текст "О нас"', hint: 'Основной текст раздела "О нас"' },
  'about.description': { label: 'Краткое описание "О нас"', hint: 'Краткое описание компании' },
  'footer.description': { label: 'Описание в подвале сайта', hint: 'Текст в нижней части сайта' },
};

function getContentLabel(key: string): { label: string; hint: string } {
  return CONTENT_LABELS[key] || { label: key, hint: '' };
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function isBannerActive(banner: BannerItem): boolean {
  if (!banner.is_active) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (banner.start_date) {
    const start = new Date(banner.start_date);
    if (start > today) return false;
  }
  if (banner.end_date) {
    const end = new Date(banner.end_date);
    if (end < today) return false;
  }
  return true;
}

const EMPTY_BANNER = {
  title: '',
  message: '',
  type: 'info',
  startDate: '',
  endDate: '',
  isActive: true,
  backgroundColor: '#4F46E5',
  textColor: '#FFFFFF',
  icon: '',
  showOnPages: ['home'] as string[],
};

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
  const [bannerForm, setBannerForm] = useState({ ...EMPTY_BANNER });
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadData();
  }, [activeTab]);

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
                id: item.id || 0,
                title: String(item.title || ''),
                message: String(item.message || ''),
                type: String(item.type || 'info'),
                start_date: item.start_date || null,
                end_date: item.end_date || null,
                is_active: Boolean(item.is_active),
                background_color: item.background_color,
                text_color: item.text_color,
                icon: item.icon,
                show_on_pages: item.show_on_pages,
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

  const togglePage = (page: string) => {
    const pages = bannerForm.showOnPages.includes(page)
      ? bannerForm.showOnPages.filter(p => p !== page)
      : [...bannerForm.showOnPages, page];
    setBannerForm({ ...bannerForm, showOnPages: pages });
  };

  const pageOptions = [
    { value: 'home', label: 'Главная' },
    { value: 'offers', label: 'Предложения' },
    { value: 'requests', label: 'Запросы' },
    { value: 'auctions', label: 'Аукционы' },
  ];

  const groupedContent = contentItems.reduce((acc, item) => {
    const cat = item.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, ContentItem[]>);

  const categoryLabels: Record<string, string> = {
    home: 'Главная страница',
    about: 'О нас',
    offers: 'Предложения',
    footer: 'Подвал сайта',
    other: 'Прочее',
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
          /* === ТЕКСТЫ САЙТА === */
          <div className="space-y-6">
            {contentItems.length === 0 ? (
              <div className="bg-card rounded-xl border p-10 text-center text-muted-foreground">
                <Icon name="FileX" size={40} className="mx-auto mb-3 opacity-40" />
                <p>Нет текстов для редактирования</p>
              </div>
            ) : (
              Object.entries(groupedContent).map(([category, items]) => (
                <div key={category} className="bg-card rounded-xl border overflow-hidden">
                  <div className="px-5 py-3 border-b bg-muted/40">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      {categoryLabels[category] || category}
                    </h3>
                  </div>
                  <div className="divide-y">
                    {items.map((item) => {
                      const { label, hint } = getContentLabel(item.key);
                      const isEditing = editingKey === item.key;
                      return (
                        <div key={item.key} className="p-5">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div>
                              <p className="font-medium text-sm">{label}</p>
                              {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
                            </div>
                            {!isEditing && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingKey(item.key);
                                  setEditValue(item.value);
                                }}
                              >
                                <Icon name="Pencil" size={14} className="mr-1" />
                                Изменить
                              </Button>
                            )}
                          </div>

                          {isEditing ? (
                            <div className="mt-3 space-y-3">
                              <Textarea
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="min-h-[100px] resize-y"
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveText(item.key)}
                                  disabled={saving}
                                >
                                  {saving ? 'Сохранение...' : 'Сохранить'}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => { setEditingKey(null); setEditValue(''); }}
                                >
                                  Отмена
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-1 text-sm text-foreground bg-muted/30 rounded-lg px-3 py-2 whitespace-pre-wrap">
                              {item.value || <span className="text-muted-foreground italic">Пусто</span>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* === БАННЕРЫ === */
          <div className="space-y-4">

            {/* Форма создания/редактирования */}
            {showBannerForm ? (
              <div className="bg-card rounded-xl border p-6">
                <h3 className="text-lg font-bold mb-5">
                  {editingBanner ? 'Редактировать баннер' : 'Новый баннер'}
                </h3>

                <div className="space-y-4">
                  <div>
                    <Label>Заголовок</Label>
                    <Input
                      className="mt-1"
                      value={bannerForm.title}
                      onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                      placeholder="Например: С Новым годом!"
                    />
                  </div>

                  <div>
                    <Label>Сообщение</Label>
                    <Textarea
                      className="mt-1 min-h-[80px]"
                      value={bannerForm.message}
                      onChange={(e) => setBannerForm({ ...bannerForm, message: e.target.value })}
                      placeholder="Текст баннера для пользователей"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Начало показа</Label>
                      <Input
                        type="date"
                        className="mt-1"
                        value={bannerForm.startDate}
                        onChange={(e) => setBannerForm({ ...bannerForm, startDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Конец показа</Label>
                      <Input
                        type="date"
                        className="mt-1"
                        value={bannerForm.endDate}
                        onChange={(e) => setBannerForm({ ...bannerForm, endDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Цвет фона</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="color"
                          value={bannerForm.backgroundColor}
                          onChange={(e) => setBannerForm({ ...bannerForm, backgroundColor: e.target.value })}
                          className="h-9 w-14 rounded border cursor-pointer"
                        />
                        <Input
                          value={bannerForm.backgroundColor}
                          onChange={(e) => setBannerForm({ ...bannerForm, backgroundColor: e.target.value })}
                          placeholder="#4F46E5"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Цвет текста</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="color"
                          value={bannerForm.textColor}
                          onChange={(e) => setBannerForm({ ...bannerForm, textColor: e.target.value })}
                          className="h-9 w-14 rounded border cursor-pointer"
                        />
                        <Input
                          value={bannerForm.textColor}
                          onChange={(e) => setBannerForm({ ...bannerForm, textColor: e.target.value })}
                          placeholder="#FFFFFF"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Предпросмотр баннера</Label>
                    <div
                      className="mt-1 rounded-lg px-4 py-3 text-sm font-medium"
                      style={{ backgroundColor: bannerForm.backgroundColor, color: bannerForm.textColor }}
                    >
                      <strong>{bannerForm.title || 'Заголовок'}</strong>
                      {bannerForm.message && <span className="ml-2 opacity-80">{bannerForm.message}</span>}
                    </div>
                  </div>

                  <div>
                    <Label>Показывать на страницах</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {pageOptions.map(page => (
                        <button
                          key={page.value}
                          type="button"
                          onClick={() => togglePage(page.value)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                            bannerForm.showOnPages.includes(page.value)
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-background text-muted-foreground border-border hover:border-primary'
                          }`}
                        >
                          {page.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setBannerForm({ ...bannerForm, isActive: !bannerForm.isActive })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        bannerForm.isActive ? 'bg-primary' : 'bg-muted-foreground/30'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform shadow ${
                        bannerForm.isActive ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                    <Label className="cursor-pointer" onClick={() => setBannerForm({ ...bannerForm, isActive: !bannerForm.isActive })}>
                      {bannerForm.isActive ? 'Баннер включён' : 'Баннер выключен'}
                    </Label>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleSaveBanner} disabled={saving}>
                      {saving ? 'Сохранение...' : editingBanner ? 'Сохранить изменения' : 'Создать баннер'}
                    </Button>
                    <Button variant="outline" onClick={handleCancelBannerForm}>Отмена</Button>
                  </div>
                </div>
              </div>
            ) : (
              <Button onClick={() => setShowBannerForm(true)} className="flex items-center gap-2">
                <Icon name="Plus" size={18} />
                Создать баннер
              </Button>
            )}

            {/* Список баннеров */}
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
                        {/* Цветная полоска */}
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
                                    {banner.show_on_pages.map(p => pageOptions.find(o => o.value === p)?.label || p).join(', ')}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => handleToggleBanner(banner)}
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
                                onClick={() => handleEditBanner(banner)}
                                className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                              >
                                <Icon name="Pencil" size={18} />
                              </button>
                              <button
                                onClick={() => handleDeleteBanner(banner.id)}
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
        )}
      </div>
    </div>
  );
}