import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Offer, OfferImage, OfferVideo } from '@/types/offer';
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
  const toDateInputValue = (val?: string | Date | null) => {
    if (!val) return '';
    const d = val instanceof Date ? val : new Date(val);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  };

  const toDateTimeInputValue = (val?: string | null) => {
    if (!val) return '';
    const d = new Date(val);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 16);
  };

  const [editData, setEditData] = useState({
    pricePerUnit: offer.pricePerUnit.toString(),
    quantity: offer.quantity.toString(),
    minOrderQuantity: offer.minOrderQuantity?.toString() || '',
    description: offer.description || '',
    deliveryPeriodStart: toDateInputValue(offer.deliveryPeriodStart),
    deliveryPeriodEnd: toDateInputValue(offer.deliveryPeriodEnd),
    transportPrice: offer.transportPrice?.toString() || '',
    transportCapacity: offer.transportCapacity || '',
    transportDateTime: toDateTimeInputValue(offer.transportDateTime),
    transportPriceType: offer.transportPriceType || '',
    transportNegotiable: offer.transportNegotiable || false,
    transportWaypoints: offer.transportWaypoints || [],
  });
  const [images, setImages] = useState<OfferImage[]>(offer.images || []);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [video, setVideo] = useState<OfferVideo | undefined>(offer.video);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);

  // --- Handlers: Save / Cancel ---

  const handleSave = async () => {
    const isTransport = offer.category === 'transport';
    const pricePerUnit = isTransport ? 0 : parseFloat(editData.pricePerUnit);
    const quantity = isTransport ? parseInt(editData.transportCapacity) || 0 : parseInt(editData.quantity);
    const minOrderQuantity = editData.minOrderQuantity ? parseInt(editData.minOrderQuantity) : undefined;

    if (!isTransport && (isNaN(pricePerUnit) || pricePerUnit <= 0)) {
      toast({ title: 'Ошибка', description: 'Укажите корректную цену', variant: 'destructive' });
      return;
    }
    if (!isTransport && (isNaN(quantity) || quantity <= 0)) {
      toast({ title: 'Ошибка', description: 'Укажите корректное количество', variant: 'destructive' });
      return;
    }
    if (minOrderQuantity && (isNaN(minOrderQuantity) || minOrderQuantity <= 0 || minOrderQuantity > quantity)) {
      toast({ title: 'Ошибка', description: 'Минимальное количество должно быть больше 0 и не превышать общее количество', variant: 'destructive' });
      return;
    }

    if (editData.deliveryPeriodStart && editData.deliveryPeriodEnd) {
      if (new Date(editData.deliveryPeriodEnd) <= new Date(editData.deliveryPeriodStart)) {
        toast({ title: 'Ошибка', description: 'Дата окончания периода поставки должна быть позже даты начала', variant: 'destructive' });
        return;
      }
    }

    if (editData.deliveryPeriodEnd && offer.expiryDate) {
      const deliveryEnd = new Date(editData.deliveryPeriodEnd);
      const publicationEnd = new Date(offer.expiryDate);
      if (deliveryEnd > publicationEnd) {
        toast({ title: 'Ошибка', description: 'Срок поставки не может быть позже срока публикации объявления', variant: 'destructive' });
        return;
      }
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
        video: video || null,
        deliveryPeriodStart: editData.deliveryPeriodStart || null,
        deliveryPeriodEnd: editData.deliveryPeriodEnd || null,
        transportServiceType: offer.transportServiceType,
        transportRoute: offer.transportRoute,
        transportType: offer.transportType,
        transportCapacity: editData.transportCapacity || offer.transportCapacity,
        transportPrice: editData.transportNegotiable ? undefined : (parseFloat(editData.transportPrice) || undefined),
        transportPriceType: editData.transportPriceType || offer.transportPriceType,
        transportNegotiable: editData.transportNegotiable,
        transportDateTime: editData.transportDateTime || undefined,
        transportComment: offer.transportComment,
        transportAllDistricts: offer.transportAllDistricts,
        transportWaypoints: editData.transportWaypoints,
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
      deliveryPeriodStart: toDateInputValue(offer.deliveryPeriodStart),
      deliveryPeriodEnd: toDateInputValue(offer.deliveryPeriodEnd),
      transportPrice: offer.transportPrice?.toString() || '',
      transportCapacity: offer.transportCapacity || '',
      transportDateTime: toDateTimeInputValue(offer.transportDateTime),
      transportPriceType: offer.transportPriceType || '',
      transportNegotiable: offer.transportNegotiable || false,
      transportWaypoints: offer.transportWaypoints || [],
    });
    setImages(offer.images || []);
    setCurrentImageIndex(0);
    setVideo(offer.video);
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

  // --- Handlers: Video ---

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.size > 100 * 1024 * 1024) {
      toast({ title: 'Ошибка', description: 'Видео слишком большое. Максимум 100 МБ', variant: 'destructive' });
      return;
    }

    setIsUploadingVideo(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const base64 = ev.target?.result as string;
          const result = await offersAPI.uploadMedia(base64);
          setVideo({ id: Date.now().toString(), url: result.url });
          toast({ title: 'Видео добавлено', description: 'Не забудьте сохранить изменения' });
        } catch (err) {
          console.error('Video upload error:', err);
          toast({ title: 'Ошибка', description: 'Не удалось загрузить видео', variant: 'destructive' });
        } finally {
          setIsUploadingVideo(false);
          if (e.target) e.target.value = '';
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setIsUploadingVideo(false);
      toast({ title: 'Ошибка', description: 'Не удалось загрузить видео', variant: 'destructive' });
    }
  };

  const handleVideoDelete = () => {
    setVideo(undefined);
    toast({ title: 'Видео удалено', description: 'Не забудьте сохранить изменения' });
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
            isUploadingVideo={isUploadingVideo}
            isSaving={isSaving}
            video={video}
            onPrev={handlePrevImage}
            onNext={handleNextImage}
            onDelete={handleDeleteImage}
            onSetMain={handleSetMainImage}
            onUpload={handleImageUpload}
            onVideoUpload={handleVideoUpload}
            onVideoDelete={handleVideoDelete}
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