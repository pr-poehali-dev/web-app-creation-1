import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { CATEGORIES } from '@/data/categories';
import { useDistrict } from '@/contexts/DistrictContext';
import type { DeliveryType } from '@/types/offer';

interface CreateOfferProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function CreateOffer({ isAuthenticated, onLogout }: CreateOfferProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { districts } = useDistrict();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    subcategory: '',
    quantity: '',
    unit: 'шт',
    pricePerUnit: '',
    hasVAT: false,
    vatRate: '20',
    district: '',
    fullAddress: '',
    availableDistricts: [] as string[],
    availableDeliveryTypes: [] as DeliveryType[],
    expiryDate: '',
  });

  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedCategory = CATEGORIES.find(c => c.id === formData.category);
  const subcategories = selectedCategory?.subcategories || [];

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'category') {
      setFormData(prev => ({ ...prev, subcategory: '' }));
    }
  };

  const handleDistrictToggle = (districtId: string) => {
    setFormData(prev => ({
      ...prev,
      availableDistricts: prev.availableDistricts.includes(districtId)
        ? prev.availableDistricts.filter(d => d !== districtId)
        : [...prev.availableDistricts, districtId]
    }));
  };

  const handleDeliveryTypeToggle = (type: DeliveryType) => {
    setFormData(prev => ({
      ...prev,
      availableDeliveryTypes: prev.availableDeliveryTypes.includes(type)
        ? prev.availableDeliveryTypes.filter(t => t !== type)
        : [...prev.availableDeliveryTypes, type]
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (images.length + files.length > 10) {
      toast({
        title: 'Ошибка',
        description: 'Максимум 10 фотографий',
        variant: 'destructive',
      });
      return;
    }

    setImages(prev => [...prev, ...files]);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (video) {
      toast({
        title: 'Ошибка',
        description: 'Можно загрузить только одно видео',
        variant: 'destructive',
      });
      return;
    }

    setVideo(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setVideoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveVideo = () => {
    setVideo(null);
    setVideoPreview('');
  };

  const handleSubmit = async (e: React.FormEvent, isDraft: boolean = false) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: 'Успешно',
        description: isDraft 
          ? 'Предложение сохранено как черновик'
          : 'Предложение отправлено на модерацию',
      });
      
      navigate('/my-offers');
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать предложение',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate('/my-offers')}
            className="mb-6 gap-2"
          >
            <Icon name="ArrowLeft" className="h-4 w-4" />
            Назад к предложениям
          </Button>

          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Создание предложения</h1>
            <p className="text-muted-foreground">
              Заполните информацию о товаре или услуге
            </p>
          </div>

          <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Основная информация</CardTitle>
                <CardDescription>
                  Название, описание и категория предложения
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Название предложения *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Например: Цемент М500, мешок 50 кг"
                    required
                    maxLength={100}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.title.length}/100 символов
                  </p>
                </div>

                <div>
                  <Label htmlFor="description">Описание *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Подробное описание товара или услуги..."
                    required
                    rows={6}
                    maxLength={1000}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.description.length}/1000 символов
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Категория *</Label>
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      required
                    >
                      <option value="">Выберите категорию</option>
                      {CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="subcategory">Подкатегория *</Label>
                    <select
                      id="subcategory"
                      value={formData.subcategory}
                      onChange={(e) => handleInputChange('subcategory', e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      required
                      disabled={!formData.category}
                    >
                      <option value="">Выберите подкатегорию</option>
                      {subcategories.map(sub => (
                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Цена и количество</CardTitle>
                <CardDescription>
                  Укажите количество и стоимость
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="quantity">Количество *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => handleInputChange('quantity', e.target.value)}
                      placeholder="0"
                      required
                      min="0.01"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <Label htmlFor="unit">Единица измерения *</Label>
                    <select
                      id="unit"
                      value={formData.unit}
                      onChange={(e) => handleInputChange('unit', e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      required
                    >
                      <option value="шт">шт</option>
                      <option value="кг">кг</option>
                      <option value="т">т</option>
                      <option value="м">м</option>
                      <option value="м²">м²</option>
                      <option value="м³">м³</option>
                      <option value="л">л</option>
                      <option value="упак">упак</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="pricePerUnit">Цена за единицу (₽) *</Label>
                    <Input
                      id="pricePerUnit"
                      type="number"
                      value={formData.pricePerUnit}
                      onChange={(e) => handleInputChange('pricePerUnit', e.target.value)}
                      placeholder="0"
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="hasVAT"
                    checked={formData.hasVAT}
                    onCheckedChange={(checked) => handleInputChange('hasVAT', checked as boolean)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="hasVAT"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Цена включает НДС
                    </label>
                  </div>
                </div>

                {formData.hasVAT && (
                  <div className="w-40">
                    <Label htmlFor="vatRate">Ставка НДС (%)</Label>
                    <select
                      id="vatRate"
                      value={formData.vatRate}
                      onChange={(e) => handleInputChange('vatRate', e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="0">0%</option>
                      <option value="10">10%</option>
                      <option value="20">20%</option>
                    </select>
                  </div>
                )}

                {formData.quantity && formData.pricePerUnit && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-1">Общая стоимость</p>
                    <p className="text-2xl font-bold text-primary">
                      {(Number(formData.quantity) * Number(formData.pricePerUnit)).toLocaleString('ru-RU')} ₽
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Местоположение и доставка</CardTitle>
                <CardDescription>
                  Укажите где находится товар и куда возможна доставка
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="district">Район местонахождения *</Label>
                  <select
                    id="district"
                    value={formData.district}
                    onChange={(e) => handleInputChange('district', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    required
                  >
                    <option value="">Выберите район</option>
                    {districts.map(district => (
                      <option key={district.id} value={district.id}>{district.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="fullAddress">Полный адрес (необязательно)</Label>
                  <Input
                    id="fullAddress"
                    value={formData.fullAddress}
                    onChange={(e) => handleInputChange('fullAddress', e.target.value)}
                    placeholder="Улица, дом, офис"
                  />
                </div>

                <div>
                  <Label className="mb-3 block">Доступно для заказа из районов *</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {districts.map(district => (
                      <div key={district.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`district-${district.id}`}
                          checked={formData.availableDistricts.includes(district.id)}
                          onCheckedChange={() => handleDistrictToggle(district.id)}
                        />
                        <label
                          htmlFor={`district-${district.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {district.name}
                        </label>
                      </div>
                    ))}
                  </div>
                  {formData.availableDistricts.length === 0 && (
                    <p className="text-xs text-destructive mt-2">
                      Выберите хотя бы один район
                    </p>
                  )}
                </div>

                <div>
                  <Label className="mb-3 block">Способы получения *</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="delivery-pickup"
                        checked={formData.availableDeliveryTypes.includes('pickup')}
                        onCheckedChange={() => handleDeliveryTypeToggle('pickup')}
                      />
                      <label
                        htmlFor="delivery-pickup"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                      >
                        <Icon name="Store" className="h-4 w-4" />
                        Самовывоз
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="delivery-delivery"
                        checked={formData.availableDeliveryTypes.includes('delivery')}
                        onCheckedChange={() => handleDeliveryTypeToggle('delivery')}
                      />
                      <label
                        htmlFor="delivery-delivery"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                      >
                        <Icon name="Truck" className="h-4 w-4" />
                        Доставка
                      </label>
                    </div>
                  </div>
                  {formData.availableDeliveryTypes.length === 0 && (
                    <p className="text-xs text-destructive mt-2">
                      Выберите хотя бы один способ получения
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Медиа</CardTitle>
                <CardDescription>
                  Загрузите фотографии и видео (до 10 фото + 1 видео)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="images">Фотографии (до 10)</Label>
                  <div className="mt-2">
                    <Input
                      id="images"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      disabled={images.length >= 10}
                    />
                  </div>
                  
                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mt-4">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                          >
                            <Icon name="X" className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="video">Видео (1 файл)</Label>
                  <div className="mt-2">
                    <Input
                      id="video"
                      type="file"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      disabled={!!video}
                    />
                  </div>
                  
                  {videoPreview && (
                    <div className="relative aspect-video rounded-lg overflow-hidden border mt-4 max-w-md">
                      <video
                        src={videoPreview}
                        controls
                        className="w-full h-full"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveVideo}
                        className="absolute top-2 right-2 p-2 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                      >
                        <Icon name="X" className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Дополнительно</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="expiryDate">Срок годности (необязательно)</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button
                type="submit"
                size="lg"
                disabled={
                  isSubmitting || 
                  formData.availableDistricts.length === 0 || 
                  formData.availableDeliveryTypes.length === 0
                }
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                    Отправка...
                  </>
                ) : (
                  <>
                    <Icon name="Send" className="mr-2 h-4 w-4" />
                    Отправить на модерацию
                  </>
                )}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={(e) => handleSubmit(e, true)}
                disabled={isSubmitting}
              >
                <Icon name="Save" className="mr-2 h-4 w-4" />
                Сохранить черновик
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                size="lg"
                onClick={() => navigate('/my-offers')}
                disabled={isSubmitting}
              >
                Отмена
              </Button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
