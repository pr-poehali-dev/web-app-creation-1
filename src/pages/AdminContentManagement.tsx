import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { contentAPI } from '@/services/api';
import Icon from '@/components/ui/icon';

interface ContentItem {
  key: string;
  value: string;
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

export default function AdminContentManagement() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'texts' | 'banners'>('texts');
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showBannerForm, setShowBannerForm] = useState(false);
  const [newBanner, setNewBanner] = useState({
    title: '',
    message: '',
    type: 'info',
    start_date: '',
    end_date: '',
    is_active: true,
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'texts') {
        const data = await contentAPI.getContent();
        console.log('Raw content data:', data);
        
        const items: ContentItem[] = [];
        if (Array.isArray(data)) {
          data.forEach((item: any) => {
            if (item && typeof item === 'object' && 'key' in item && 'value' in item) {
              items.push({
                key: String(item.key),
                value: String(item.value || '')
              });
            }
          });
        } else if (typeof data === 'object' && data !== null) {
          Object.entries(data).forEach(([key, value]) => {
            items.push({
              key: String(key),
              value: String(value || '')
            });
          });
        }
        
        console.log('Processed content items:', items);
        setContentItems(items);
      } else {
        const data = await contentAPI.getBanners();
        console.log('Raw banners data:', data);
        
        const bannerList: BannerItem[] = [];
        if (Array.isArray(data)) {
          data.forEach((item: any) => {
            if (item && typeof item === 'object') {
              bannerList.push({
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
                show_on_pages: item.show_on_pages
              });
            }
          });
        }
        
        console.log('Processed banners:', bannerList);
        setBanners(bannerList);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      alert('Ошибка загрузки данных: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveText = async (key: string) => {
    try {
      await contentAPI.updateContent(key, editValue);
      
      setContentItems(contentItems.map(item => 
        item.key === key ? { ...item, value: editValue } : item
      ));
      
      setEditingKey(null);
      setEditValue('');
      alert('✓ Текст успешно сохранён');
    } catch (error) {
      console.error('Failed to update content:', error);
      alert('Ошибка при сохранении: ' + (error as Error).message);
    }
  };

  const handleCreateBanner = async () => {
    if (!newBanner.title || !newBanner.message) {
      alert('Заполните заголовок и сообщение');
      return;
    }
    try {
      await contentAPI.createBanner(newBanner);
      setShowBannerForm(false);
      setNewBanner({
        title: '',
        message: '',
        type: 'info',
        start_date: '',
        end_date: '',
        is_active: true,
      });
      alert('✓ Баннер успешно создан');
      loadData();
    } catch (error) {
      console.error('Failed to create banner:', error);
      alert('Ошибка при создании баннера: ' + (error as Error).message);
    }
  };

  const handleToggleBanner = async (bannerId: number, isActive: boolean) => {
    try {
      await contentAPI.updateBanner(bannerId, { is_active: !isActive });
      alert('✓ Статус баннера изменён');
      loadData();
    } catch (error) {
      console.error('Failed to toggle banner:', error);
      alert('Ошибка при изменении статуса: ' + (error as Error).message);
    }
  };

  const handleDeleteBanner = async (bannerId: number) => {
    if (!confirm('Удалить баннер?')) return;
    try {
      await contentAPI.deleteBanner(bannerId);
      alert('✓ Баннер удалён');
      loadData();
    } catch (error) {
      console.error('Failed to delete banner:', error);
      alert('Ошибка при удалении: ' + (error as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/panel')}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <Icon name="ArrowLeft" size={24} />
            </button>
            <h1 className="text-3xl font-bold">Управление контентом</h1>
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('texts')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'texts'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card hover:bg-muted'
            }`}
          >
            Тексты сайта
          </button>
          <button
            onClick={() => setActiveTab('banners')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'banners'
                ? 'bg-primary text-primary-foreground'
                : 'bg-card hover:bg-muted'
            }`}
          >
            Праздничные баннеры
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : activeTab === 'texts' ? (
          contentItems.length === 0 ? (
            <div className="bg-card rounded-lg border p-6">
              <p className="text-center text-muted-foreground">Нет доступных текстов для редактирования</p>
            </div>
          ) : (
            <div className="bg-card rounded-lg border">
              <div className="p-6 space-y-4">
                {contentItems.map((item) => (
                  <div key={item.key} className="border-b last:border-b-0 pb-4 last:pb-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="font-medium text-sm text-muted-foreground mb-2">
                          {item.key}
                        </div>
                        {editingKey === item.key ? (
                          <textarea
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-full p-3 border rounded-lg min-h-[100px] bg-background"
                            autoFocus
                          />
                        ) : (
                          <div className="text-foreground whitespace-pre-wrap">
                            {item.value}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {editingKey === item.key ? (
                          <>
                            <button
                              onClick={() => handleSaveText(item.key)}
                              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
                            >
                              Сохранить
                            </button>
                            <button
                              onClick={() => {
                                setEditingKey(null);
                                setEditValue('');
                              }}
                              className="px-4 py-2 bg-muted rounded-lg hover:bg-muted/80"
                            >
                              Отмена
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingKey(item.key);
                              setEditValue(item.value);
                            }}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
                          >
                            <Icon name="Pencil" size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        ) : (
          <div className="space-y-4">
            <button
              onClick={() => setShowBannerForm(!showBannerForm)}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 flex items-center gap-2"
            >
              <Icon name="Plus" size={20} />
              Создать баннер
            </button>

            {showBannerForm && (
              <div className="bg-card rounded-lg border p-6 space-y-4">
                <h3 className="text-xl font-bold">Новый баннер</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Заголовок
                    </label>
                    <input
                      type="text"
                      value={newBanner.title}
                      onChange={(e) =>
                        setNewBanner({ ...newBanner, title: e.target.value })
                      }
                      className="w-full p-3 border rounded-lg bg-background"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Сообщение
                    </label>
                    <textarea
                      value={newBanner.message}
                      onChange={(e) =>
                        setNewBanner({ ...newBanner, message: e.target.value })
                      }
                      className="w-full p-3 border rounded-lg bg-background min-h-[100px]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Тип
                    </label>
                    <select
                      value={newBanner.type}
                      onChange={(e) =>
                        setNewBanner({ ...newBanner, type: e.target.value })
                      }
                      className="w-full p-3 border rounded-lg bg-background"
                    >
                      <option value="info">Информация</option>
                      <option value="warning">Предупреждение</option>
                      <option value="success">Успех</option>
                      <option value="error">Ошибка</option>
                    </select>
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={handleCreateBanner}
                      className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
                    >
                      Создать
                    </button>
                    <button
                      onClick={() => setShowBannerForm(false)}
                      className="px-6 py-2 bg-muted rounded-lg hover:bg-muted/80"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              </div>
            )}

            {banners.length === 0 ? (
              <div className="bg-card rounded-lg border p-6">
                <p className="text-center text-muted-foreground">Нет созданных баннеров</p>
              </div>
            ) : (
              <div className="space-y-3">
                {banners.map((banner) => (
                  <div
                    key={banner.id}
                    className="bg-card rounded-lg border p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">{banner.title}</h3>
                        <p className="text-muted-foreground mt-1">{banner.message}</p>
                        <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                          <span>Тип: {banner.type}</span>
                          <span>Статус: {banner.is_active ? 'Активен' : 'Неактивен'}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggleBanner(banner.id, banner.is_active)}
                          className={`px-4 py-2 rounded-lg font-medium ${
                            banner.is_active
                              ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                              : 'bg-green-500 text-white hover:bg-green-600'
                          }`}
                        >
                          {banner.is_active ? 'Деактивировать' : 'Активировать'}
                        </button>
                        <button
                          onClick={() => handleDeleteBanner(banner.id)}
                          className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:opacity-90"
                        >
                          <Icon name="Trash2" size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
