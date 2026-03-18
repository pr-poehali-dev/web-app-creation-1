import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { contentAPI } from '@/services/api';
import { invalidateSiteContentCache } from '@/hooks/useSiteContent';
import Icon from '@/components/ui/icon';
import {
  type ContentItem,
} from './content-management/types';
import ContentTextsTab from './content-management/ContentTextsTab';

export default function AdminContentManagement() {
  const navigate = useNavigate();
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadData();
  }, []);  

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
            <p className="text-sm text-muted-foreground">Редактирование текстов сайта</p>
          </div>
        </div>

        {/* Success message */}
        {successMsg && (
          <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-800">
            <Icon name="CheckCircle" size={18} />
            <span>{successMsg}</span>
          </div>
        )}



        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}