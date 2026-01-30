import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import type { Offer, OfferImage } from '@/types/offer';
import { offersAPI } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useDistrict } from '@/contexts/DistrictContext';
import { notifyOfferUpdated } from '@/utils/dataSync';

interface OfferInfoTabProps {
  offer: Offer;
  districtName?: string;
  onEdit?: () => void;
  onDelete: () => void;
  onUpdate: () => void;
  onDataChanged?: () => void;
  hasChanges?: boolean;
  initialEditMode?: boolean;
}

export default function OfferInfoTab({ offer, districtName: propDistrictName, onEdit, onDelete, onUpdate, onDataChanged, initialEditMode = false }: OfferInfoTabProps) {
  const { districts } = useDistrict();
  const districtName = propDistrictName || districts.find(d => d.id === offer.district)?.name || offer.district;
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(initialEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState({
    pricePerUnit: offer.pricePerUnit.toString(),
    quantity: offer.quantity.toString(),
    minOrderQuantity: offer.minOrderQuantity?.toString() || '',
    description: offer.description || '',
  });
  const [images, setImages] = useState<OfferImage[]>(offer.images || []);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    const pricePerUnit = parseFloat(editData.pricePerUnit);
    const quantity = parseInt(editData.quantity);
    const minOrderQuantity = editData.minOrderQuantity ? parseInt(editData.minOrderQuantity) : undefined;

    if (isNaN(pricePerUnit) || pricePerUnit <= 0) {
      toast({
        title: 'Ошибка',
        description: 'Укажите корректную цену',
        variant: 'destructive',
      });
      return;
    }

    if (isNaN(quantity) || quantity <= 0) {
      toast({
        title: 'Ошибка',
        description: 'Укажите корректное количество',
        variant: 'destructive',
      });
      return;
    }

    if (minOrderQuantity && (isNaN(minOrderQuantity) || minOrderQuantity <= 0 || minOrderQuantity > quantity)) {
      toast({
        title: 'Ошибка',
        description: 'Минимальное количество должно быть больше 0 и не превышать общее количество',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      console.log('Updating offer with images:', images.length, 'images');
      const imagesSize = JSON.stringify(images).length;
      console.log('Images data size:', imagesSize, 'bytes', (imagesSize / 1024 / 1024).toFixed(2), 'MB');
      
      await offersAPI.updateOffer(offer.id, {
        pricePerUnit,
        quantity,
        minOrderQuantity,
        description: editData.description,
        images: images,
      });
      
      // Очищаем кэш предложений
      localStorage.removeItem('cached_offers');
      
      // Уведомляем все открытые страницы об обновлении
      notifyOfferUpdated(offer.id);
      
      // Отмечаем что были изменения
      if (onDataChanged) {
        onDataChanged();
      }
      
      toast({
        title: 'Успешно',
        description: 'Объявление обновлено',
      });
      
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating offer:', error);
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      toast({
        title: 'Ошибка',
        description: `Не удалось обновить объявление: ${errorMessage}`,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData({
      pricePerUnit: offer.pricePerUnit.toString(),
      quantity: offer.quantity.toString(),
      minOrderQuantity: offer.minOrderQuantity?.toString() || '',
      description: offer.description || '',
    });
    setImages(offer.images || []);
    setCurrentImageIndex(0);
    setIsEditing(false);
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxWidth = 1200;
          const maxHeight = 1200;
          let width = img.width;
          let height = img.height;

          // Рассчитываем новые размеры
          if (width > height) {
            if (width > maxWidth) {
              height = height * (maxWidth / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = width * (maxHeight / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          
          // Сжимаем с качеством 0.8
          const compressed = canvas.toDataURL('image/jpeg', 0.8);
          resolve(compressed);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingImage(true);
    try {
      const file = files[0];
      
      // Проверяем размер файла (макс 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'Ошибка',
          description: 'Файл слишком большой. Максимум 10 МБ',
          variant: 'destructive',
        });
        return;
      }
      
      // Сжимаем изображение
      const compressed = await compressImage(file);
      console.log('Original size:', file.size, 'Compressed size:', compressed.length);
      
      const newImage: OfferImage = {
        id: Date.now().toString(),
        url: compressed,
        alt: offer.title,
      };
      setImages([...images, newImage]);
      toast({
        title: 'Фото добавлено',
        description: 'Не забудьте сохранить изменения',
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить фото',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteImage = (imageId: string) => {
    const newImages = images.filter(img => img.id !== imageId);
    setImages(newImages);
    if (currentImageIndex >= newImages.length && newImages.length > 0) {
      setCurrentImageIndex(newImages.length - 1);
    }
    toast({
      title: 'Фото удалено',
      description: 'Не забудьте сохранить изменения',
    });
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Основная информация</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {images && images.length > 0 && (
            <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
              <img
                src={images[currentImageIndex].url}
                alt={images[currentImageIndex].alt}
                className="w-full h-full object-cover"
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                  >
                    <Icon name="ChevronLeft" className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                  >
                    <Icon name="ChevronRight" className="h-5 w-5" />
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_, index) => (
                      <div
                        key={index}
                        className={`h-2 rounded-full transition-all ${
                          index === currentImageIndex ? 'w-8 bg-white' : 'w-2 bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
              {isEditing && (
                <div className="absolute top-2 right-2 flex gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteImage(images[currentImageIndex].id)}
                    disabled={images.length <= 1}
                  >
                    <Icon name="Trash2" className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
          {isEditing && (
            <div className="flex items-center justify-center aspect-video rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50">
              <div className="text-center space-y-3">
                <Icon name="Upload" className="h-8 w-8 mx-auto text-muted-foreground" />
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage || isSaving}
                  >
                    <Icon name="Plus" className="h-4 w-4 mr-2" />
                    Добавить фото
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">JPG, PNG до 5 МБ</p>
              </div>
            </div>
          )}
          
          <div className="space-y-3">
            <div>
              <h3 className="text-2xl font-bold">{offer.title}</h3>
              {!isEditing ? (
                <p className="text-muted-foreground mt-2">{offer.description}</p>
              ) : null}
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="description">Описание</Label>
                    <Textarea
                      id="description"
                      value={editData.description}
                      onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                      disabled={isSaving}
                      rows={3}
                      placeholder="Опишите ваше предложение"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pricePerUnit">Цена за единицу (₽)</Label>
                    <Input
                      id="pricePerUnit"
                      type="number"
                      value={editData.pricePerUnit}
                      onChange={(e) => setEditData({ ...editData, pricePerUnit: e.target.value })}
                      disabled={isSaving}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Доступное количество ({offer.unit})</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={editData.quantity}
                      onChange={(e) => setEditData({ ...editData, quantity: e.target.value })}
                      disabled={isSaving}
                      min="1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minOrderQuantity">Минимальное количество для заказа ({offer.unit})</Label>
                    <Input
                      id="minOrderQuantity"
                      type="number"
                      value={editData.minOrderQuantity}
                      onChange={(e) => setEditData({ ...editData, minOrderQuantity: e.target.value })}
                      disabled={isSaving}
                      min="0"
                      placeholder="Не задано"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Цена за единицу:</span>
                    <p className="font-bold text-lg text-primary">
                      {offer.pricePerUnit.toLocaleString('ru-RU')} ₽
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Количество:</span>
                    <p className="font-semibold">{offer.quantity} {offer.unit}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Доступно:</span>
                    <p className="font-semibold text-green-600">
                      {offer.quantity - (offer.soldQuantity || 0) - (offer.reservedQuantity || 0)} {offer.unit}
                    </p>
                  </div>
                  {offer.minOrderQuantity && (
                    <div>
                      <span className="text-muted-foreground">Мин. заказ:</span>
                      <p className="font-semibold">{offer.minOrderQuantity} {offer.unit}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Район:</span>
                    <p className="font-semibold">{districtName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Просмотры:</span>
                    <p className="font-semibold">{offer.views || 0}</p>
                  </div>
                </div>
              )}
            </div>

            <Separator />
            
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button className="flex-1" onClick={handleSave} disabled={isSaving}>
                    <Icon name="Check" className="w-4 h-4 mr-2" />
                    Сохранить
                  </Button>
                  <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                    <Icon name="X" className="w-4 h-4 mr-2" />
                    Отмена
                  </Button>
                </>
              ) : (
                <>
                  <Button className="flex-1" onClick={() => setIsEditing(true)}>
                    <Icon name="Pencil" className="w-4 h-4 mr-2" />
                    Редактировать
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDelete();
                    }}
                    type="button"
                  >
                    <Icon name="Trash2" className="w-4 h-4 mr-2" />
                    Удалить
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}