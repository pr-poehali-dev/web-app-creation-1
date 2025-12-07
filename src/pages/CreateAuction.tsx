import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '@/components/BackButton';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { useDistrict } from '@/contexts/DistrictContext';
import { getSession } from '@/utils/auth';
import { CATEGORIES } from '@/data/categories';

interface CreateAuctionProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function CreateAuction({ isAuthenticated, onLogout }: CreateAuctionProps) {
  useScrollToTop();
  const navigate = useNavigate();
  const { toast } = useToast();
  const currentUser = getSession();
  const { districts } = useDistrict();
  const [verificationStatus, setVerificationStatus] = useState<string>('');
  const [isCheckingVerification, setIsCheckingVerification] = useState(true);

  const checkVerificationStatus = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) return;

      const response = await fetch('https://functions.poehali.dev/1c97f222-fdea-4b59-b941-223ee8bb077b', {
        headers: {
          'X-User-Id': userId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setVerificationStatus(data.verificationStatus);
      }
    } catch (error) {
      console.error('Error checking verification:', error);
    } finally {
      setIsCheckingVerification(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: 'Требуется авторизация',
        description: 'Для создания аукциона необходимо войти в систему',
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }

    checkVerificationStatus();
  }, [isAuthenticated, navigate, toast]);

  useEffect(() => {
    if (!isCheckingVerification && verificationStatus !== 'verified') {
      toast({
        title: 'Требуется верификация',
        description: verificationStatus === 'pending' 
          ? 'Верификация вашей учётной записи на рассмотрении. После одобрения верификации вам будут доступны все возможности.'
          : 'Для создания аукциона необходимо пройти верификацию. Перейдите в профиль и подайте заявку на верификацию.',
        variant: 'destructive',
        duration: 8000,
      });
      navigate('/auction');
    }
  }, [isCheckingVerification, verificationStatus, navigate, toast]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    subcategory: '',
    quantity: '',
    unit: 'шт',
    startingPrice: '',
    minBidStep: '',
    buyNowPrice: '',
    hasVAT: false,
    vatRate: '20',
    district: '',
    fullAddress: '',
    availableDistricts: [] as string[],
    availableDeliveryTypes: [] as ('pickup' | 'delivery')[],
    startDate: '',
    startTime: '',
    duration: '3',
  });

  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleDeliveryTypeToggle = (type: 'pickup' | 'delivery') => {
    setFormData(prev => ({
      ...prev,
      availableDeliveryTypes: prev.availableDeliveryTypes.includes(type)
        ? prev.availableDeliveryTypes.filter(t => t !== type)
        : [...prev.availableDeliveryTypes, type]
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 10) {
      toast({
        title: 'Слишком много изображений',
        description: 'Максимум 10 изображений',
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

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.category || 
        !formData.startingPrice || !formData.minBidStep || !formData.district ||
        !formData.startDate || !formData.startTime) {
      toast({
        title: 'Ошибка',
        description: 'Пожалуйста, заполните все обязательные поля',
        variant: 'destructive',
      });
      return;
    }

    if (formData.availableDistricts.length === 0) {
      toast({
        title: 'Ошибка',
        description: 'Выберите хотя бы один район доставки',
        variant: 'destructive',
      });
      return;
    }

    if (images.length === 0) {
      toast({
        title: 'Ошибка',
        description: 'Загрузите хотя бы одно изображение',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      toast({
        title: 'Успешно',
        description: 'Аукцион создан и будет опубликован в указанное время',
      });
      
      setTimeout(() => {
        navigate('/my-auctions');
      }, 1500);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать аукцион. Попробуйте позже.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategory = CATEGORIES.find(cat => cat.id === formData.category);

  if (isCheckingVerification) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
        <main className="container mx-auto px-4 py-8 flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />

      <main className="container mx-auto px-4 py-8 flex-1">
        <BackButton />
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Создать аукцион</h1>
          <p className="text-muted-foreground">
            Создайте аукцион и получите лучшую цену за ваш товар
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Основная информация</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Название аукциона *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Краткое название лота"
                  maxLength={100}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Описание *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Подробное описание лота, его характеристики и условия"
                  rows={5}
                  maxLength={2000}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Категория *</Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md"
                    required
                  >
                    <option value="">Выберите категорию</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {selectedCategory && selectedCategory.subcategories.length > 0 && (
                  <div>
                    <Label htmlFor="subcategory">Подкатегория</Label>
                    <select
                      id="subcategory"
                      value={formData.subcategory}
                      onChange={(e) => handleInputChange('subcategory', e.target.value)}
                      className="w-full px-3 py-2 border border-input bg-background rounded-md"
                    >
                      <option value="">Выберите подкатегорию</option>
                      {selectedCategory.subcategories.map(sub => (
                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity">Количество</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange('quantity', e.target.value)}
                    placeholder="1"
                    min="1"
                  />
                </div>

                <div>
                  <Label htmlFor="unit">Единица измерения</Label>
                  <Input
                    id="unit"
                    value={formData.unit}
                    onChange={(e) => handleInputChange('unit', e.target.value)}
                    placeholder="шт"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Условия аукциона</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startingPrice">Начальная цена *</Label>
                  <Input
                    id="startingPrice"
                    type="number"
                    value={formData.startingPrice}
                    onChange={(e) => handleInputChange('startingPrice', e.target.value)}
                    placeholder="0"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="minBidStep">Минимальный шаг ставки *</Label>
                  <Input
                    id="minBidStep"
                    type="number"
                    value={formData.minBidStep}
                    onChange={(e) => handleInputChange('minBidStep', e.target.value)}
                    placeholder="100"
                    min="1"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="buyNowPrice">Цена &quot;Купить сейчас&quot; (опционально)</Label>
                <Input
                  id="buyNowPrice"
                  type="number"
                  value={formData.buyNowPrice}
                  onChange={(e) => handleInputChange('buyNowPrice', e.target.value)}
                  placeholder="Оставьте пустым, если не требуется"
                  min="0"
                  step="0.01"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Покупатель сможет немедленно купить лот по этой цене
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="hasVAT"
                  checked={formData.hasVAT}
                  onCheckedChange={(checked) => handleInputChange('hasVAT', checked)}
                />
                <Label htmlFor="hasVAT">Цена включает НДС</Label>
              </div>

              {formData.hasVAT && (
                <div>
                  <Label htmlFor="vatRate">Ставка НДС (%)</Label>
                  <select
                    id="vatRate"
                    value={formData.vatRate}
                    onChange={(e) => handleInputChange('vatRate', e.target.value)}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md"
                  >
                    <option value="20">20%</option>
                    <option value="10">10%</option>
                    <option value="0">0%</option>
                  </select>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Время проведения</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Дата начала *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="startTime">Время начала *</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => handleInputChange('startTime', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="duration">Длительность (дней)</Label>
                <select
                  id="duration"
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', e.target.value)}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md"
                >
                  <option value="1">1 день</option>
                  <option value="3">3 дня</option>
                  <option value="5">5 дней</option>
                  <option value="7">7 дней</option>
                  <option value="14">14 дней</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Местоположение и доставка</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="district">Основной район *</Label>
                <select
                  id="district"
                  value={formData.district}
                  onChange={(e) => handleInputChange('district', e.target.value)}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md"
                  required
                >
                  <option value="">Выберите район</option>
                  {districts.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="fullAddress">Адрес (опционально)</Label>
                <Input
                  id="fullAddress"
                  value={formData.fullAddress}
                  onChange={(e) => handleInputChange('fullAddress', e.target.value)}
                  placeholder="Улица, дом"
                />
              </div>

              <div>
                <Label>Районы доставки *</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                  {districts.map(district => (
                    <div key={district.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`district-${district.id}`}
                        checked={formData.availableDistricts.includes(district.id)}
                        onCheckedChange={() => handleDistrictToggle(district.id)}
                      />
                      <Label
                        htmlFor={`district-${district.id}`}
                        className="text-sm cursor-pointer"
                      >
                        {district.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Способы получения</Label>
                <div className="flex gap-4 mt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="pickup"
                      checked={formData.availableDeliveryTypes.includes('pickup')}
                      onCheckedChange={() => handleDeliveryTypeToggle('pickup')}
                    />
                    <Label htmlFor="pickup" className="cursor-pointer">
                      Самовывоз
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="delivery"
                      checked={formData.availableDeliveryTypes.includes('delivery')}
                      onCheckedChange={() => handleDeliveryTypeToggle('delivery')}
                    />
                    <Label htmlFor="delivery" className="cursor-pointer">
                      Доставка
                    </Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Фотографии *</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="images">Загрузите фото (до 10 шт)</Label>
                <Input
                  id="images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="mt-2"
                />
              </div>

              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative aspect-square group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-destructive text-destructive-foreground p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Icon name="X" className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/auction')}
              disabled={isSubmitting}
              className="flex-1"
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Создание...
                </>
              ) : (
                <>
                  <Icon name="Gavel" className="mr-2 h-4 w-4" />
                  Создать аукцион
                </>
              )}
            </Button>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}
