import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Offer, OfferImage } from '@/types/offer';
import { offersAPI } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useDistrict } from '@/contexts/DistrictContext';
import { notifyOfferUpdated } from '@/utils/dataSync';
import OfferImageGallery from './OfferImageGallery';
import OfferImageSortable from './OfferImageSortable';
import OfferInfoFields from './OfferInfoFields';

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

  // --- Handlers: Save / Cancel ---

  const handleSave = async () => {
    const pricePerUnit = parseFloat(editData.pricePerUnit);
    const quantity = parseInt(editData.quantity);
    const minOrderQuantity = editData.minOrderQuantity ? parseInt(editData.minOrderQuantity) : undefined;

    if (isNaN(pricePerUnit) || pricePerUnit <= 0) {
      toast({ title: 'Ошибка', description: 'Укажите корректную цену', variant: 'destructive' });
      return;
    }
    if (isNaN(quantity) || quantity <= 0) {
      toast({ title: 'Ошибка', description: 'Укажите корректное количество', variant: 'destructive' });
      return;
    }
    if (minOrderQuantity && (isNaN(minOrderQuantity) || minOrderQuantity <= 0 || minOrderQuantity > quantity)) {
      toast({ title: 'Ошибка', description: 'Минимальное количество должно быть больше 0 и не превышать общее количество', variant: 'destructive' });
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

      localStorage.removeItem('cached_offers');
      notifyOfferUpdated(offer.id);
      if (onDataChanged) onDataChanged();

      toast({ title: 'Успешно', description: 'Объявление обновлено' });
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating offer:', error);
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      toast({ title: 'Ошибка', description: `Не удалось обновить объявление: ${errorMessage}`, variant: 'destructive' });
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

  // --- Handlers: Image ---

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

          if (width > height) {
            if (width > maxWidth) { height = height * (maxWidth / width); width = maxWidth; }
          } else {
            if (height > maxHeight) { width = width * (maxHeight / height); height = maxHeight; }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) { reject(new Error('Could not get canvas context')); return; }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
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
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: 'Ошибка', description: 'Файл слишком большой. Максимум 10 МБ', variant: 'destructive' });
        return;
      }
      const compressed = await compressImage(file);
      console.log('Original size:', file.size, 'Compressed size:', compressed.length);
      const newImage: OfferImage = { id: Date.now().toString(), url: compressed, alt: offer.title };
      setImages([...images, newImage]);
      toast({ title: 'Фото добавлено', description: 'Не забудьте сохранить изменения' });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({ title: 'Ошибка', description: 'Не удалось загрузить фото', variant: 'destructive' });
    } finally {
      setIsUploadingImage(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleDeleteImage = (imageId: string) => {
    const newImages = images.filter(img => img.id !== imageId);
    setImages(newImages);
    if (currentImageIndex >= newImages.length && newImages.length > 0) {
      setCurrentImageIndex(newImages.length - 1);
    }
    toast({ title: 'Фото удалено', description: 'Не забудьте сохранить изменения' });
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleSetMainImage = () => {
    if (currentImageIndex === 0) return;
    const newImages = [...images];
    const [selected] = newImages.splice(currentImageIndex, 1);
    newImages.unshift(selected);
    setImages(newImages);
    setCurrentImageIndex(0);
    toast({ title: 'Главное фото изменено', description: 'Не забудьте сохранить изменения' });
  };

  // --- Handlers: Drag & Drop ---

  const dragIndex = useRef<number | null>(null);
  const dragOverIndex = useRef<number | null>(null);

  const handleDragStart = useCallback((index: number) => {
    dragIndex.current = index;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    dragOverIndex.current = index;
  }, []);

  const handleDrop = useCallback(() => {
    if (dragIndex.current === null || dragOverIndex.current === null) return;
    if (dragIndex.current === dragOverIndex.current) return;
    const newImages = [...images];
    const [dragged] = newImages.splice(dragIndex.current, 1);
    newImages.splice(dragOverIndex.current, 0, dragged);
    setImages(newImages);
    setCurrentImageIndex(dragOverIndex.current);
    dragIndex.current = null;
    dragOverIndex.current = null;
    toast({ title: 'Порядок фото изменён', description: 'Не забудьте сохранить изменения' });
  }, [images, toast]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Основная информация</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <OfferImageGallery
            images={images}
            currentImageIndex={currentImageIndex}
            isEditing={isEditing}
            isUploadingImage={isUploadingImage}
            isSaving={isSaving}
            onPrev={handlePrevImage}
            onNext={handleNextImage}
            onDelete={handleDeleteImage}
            onSetMain={handleSetMainImage}
            onUpload={handleImageUpload}
          />

          {isEditing && (
            <OfferImageSortable
              images={images}
              currentImageIndex={currentImageIndex}
              onSelect={setCurrentImageIndex}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            />
          )}

          <OfferInfoFields
            offer={offer}
            districtName={districtName}
            isEditing={isEditing}
            isSaving={isSaving}
            editData={editData}
            onEditDataChange={setEditData}
            onSave={handleSave}
            onCancel={handleCancel}
            onStartEditing={() => setIsEditing(true)}
            onDelete={onDelete}
          />
        </div>
      </CardContent>
    </Card>
  );
}
