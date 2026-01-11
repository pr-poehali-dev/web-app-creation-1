import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { contentAPI } from '@/services/api';
import Icon from '@/components/ui/icon';

export default function AdminContentManagement() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'texts' | 'banners'>('texts');
  const [content, setContent] = useState<any>({});
  const [banners, setBanners] = useState<any[]>([]);
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
        const contentMap: any = {};
        if (Array.isArray(data)) {
          data.forEach((item: any) => {
            contentMap[item.key] = item.value;
          });
        } else if (typeof data === 'object') {
          Object.assign(contentMap, data);
        }
        setContent(contentMap);
      } else {
        const data = await contentAPI.getBanners();
        setBanners(Array.isArray(data) ? data : []);
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
      setContent({ ...content, [key]: editValue });
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
              onClick={() => navigate('/admin')}
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
          Object.keys(content).length === 0 ? (
            <div className="bg-card rounded-lg border p-6">
              <p className="text-center text-muted-foreground">Нет доступных текстов для редактирования</p>
            </div>
          ) : (
          <div className="bg-card rounded-lg border">
            <div className="p-6 space-y-4">
              {Object.entries(content).map(([key, value]) => (
                <div key={key} className="border-b last:border-b-0 pb-4 last:pb-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="font-medium text-sm text-muted-foreground mb-2">
                        {key}
                      </div>
                      {editingKey === key ? (
                        <textarea
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-full p-3 border rounded-lg min-h-[100px] bg-background"
                          autoFocus
                        />
                      ) : (
                        <div className="text-foreground whitespace-pre-wrap">
                          {value as string}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {editingKey === key ? (
                        <>
                          <button
                            onClick={() => handleSaveText(key)}
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
                            setEditingKey(key);
                            setEditValue(value as string);
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
                      className="w-full p-3 border rounded-lg min-h-[100px] bg-background"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Тип</label>
                    <select
                      value={newBanner.type}
                      onChange={(e) =>
                        setNewBanner({ ...newBanner, type: e.target.value })
                      }
                      className="w-full p-3 border rounded-lg bg-background"
                    >
                      <option value="info">Информация</option>
                      <option value="success">Успех</option>
                      <option value="warning">Предупреждение</option>
                      <option value="holiday">Праздник</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Дата начала
                      </label>
                      <input
                        type="date"
                        value={newBanner.start_date}
                        onChange={(e) =>
                          setNewBanner({ ...newBanner, start_date: e.target.value })
                        }
                        className="w-full p-3 border rounded-lg bg-background"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Дата окончания
                      </label>
                      <input
                        type="date"
                        value={newBanner.end_date}
                        onChange={(e) =>
                          setNewBanner({ ...newBanner, end_date: e.target.value })
                        }
                        className="w-full p-3 border rounded-lg bg-background"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newBanner.is_active}
                      onChange={(e) =>
                        setNewBanner({ ...newBanner, is_active: e.target.checked })
                      }
                      className="w-5 h-5"
                    />
                    <label className="text-sm font-medium">Активен</label>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleCreateBanner}
                    className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
                  >
                    Создать
                  </button>
                  <button
                    onClick={() => setShowBannerForm(false)}
                    className="px-6 py-3 bg-muted rounded-lg hover:bg-muted/80"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {banners.map((banner) => (
                <div
                  key={banner.id}
                  className="bg-card rounded-lg border p-6 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold">{banner.title}</h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            banner.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {banner.is_active ? 'Активен' : 'Неактивен'}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {banner.type}
                        </span>
                      </div>
                      <p className="text-muted-foreground mb-3">
                        {banner.message}
                      </p>
                      {(banner.start_date || banner.end_date) && (
                        <div className="text-sm text-muted-foreground">
                          {banner.start_date && (
                            <span>С {new Date(banner.start_date).toLocaleDateString()}</span>
                          )}
                          {banner.start_date && banner.end_date && ' — '}
                          {banner.end_date && (
                            <span>До {new Date(banner.end_date).toLocaleDateString()}</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          handleToggleBanner(banner.id, banner.is_active)
                        }
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
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
              {banners.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  Нет баннеров. Создайте первый!
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}