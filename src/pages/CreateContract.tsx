import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '@/components/BackButton';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import ProductMediaUpload from '@/components/ProductMediaUpload';
import { notifyContractUpdated } from '@/utils/dataSync';

interface CreateContractProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function CreateContract({ isAuthenticated, onLogout }: CreateContractProps) {
  useScrollToTop();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [verificationStatus, setVerificationStatus] = useState<string>('');
  const [isCheckingVerification, setIsCheckingVerification] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    checkVerificationStatus();
  }, [isAuthenticated, navigate]);

  const checkVerificationStatus = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        setIsCheckingVerification(false);
        return;
      }

      const response = await fetch('https://functions.poehali.dev/1c97f222-fdea-4b59-b941-223ee8bb077b', {
        headers: {
          'X-User-Id': userId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setVerificationStatus(data.verificationStatus);
        
        if (data.verificationStatus === 'pending') {
          toast({
            title: 'Верификация на рассмотрении',
            description: 'Верификация вашей учётной записи на рассмотрении. После одобрения верификации или отказа вы получите соответствующее уведомление. После успешной верификации вам будут доступны все возможности на ЕРТТП.',
            duration: 8000,
          });
          navigate('/trading');
        }
      }
    } catch (error) {
      console.error('Error checking verification:', error);
    } finally {
      setIsCheckingVerification(false);
    }
  };

  const [formData, setFormData] = useState({
    contractType: 'futures',
    title: '',
    description: '',
    category: '',
    productName: '',
    quantity: '',
    unit: '',
    pricePerUnit: '',
    deliveryDate: '',
    contractStartDate: '',
    contractEndDate: '',
    deliveryAddress: '',
    deliveryMethod: '',
    prepaymentPercent: '',
    discountPercent: '',
    financingAvailable: false,
    termsConditions: '',
    minPurchaseQuantity: '',
    productImages: [] as string[],
    productVideoUrl: '',
  });

  const handleInputChange = (field: string, value: string | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.productName || !formData.quantity || !formData.pricePerUnit) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все обязательные поля',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const userId = localStorage.getItem('userId');
      const totalAmount = parseFloat(formData.quantity) * parseFloat(formData.pricePerUnit);
      const prepaymentAmount = totalAmount * (parseFloat(formData.prepaymentPercent || '0') / 100);

      const response = await fetch('https://functions.poehali.dev/1eb3dd30-04c6-4570-97ff-73c5403573f5', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId || '',
        },
        body: JSON.stringify({
          ...formData,
          totalAmount,
          prepaymentAmount,
          productImages: formData.productImages,
          productVideoUrl: formData.productVideoUrl,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        notifyContractUpdated(data.contractId);
        toast({
          title: 'Успешно',
          description: 'Контракт успешно создан',
        });
        navigate('/trading');
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось создать контракт',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Произошла ошибка при создании контракта',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCheckingVerification) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
        <main className="container mx-auto px-4 py-8 flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <Icon name="ArrowLeft" className="mr-2 h-4 w-4" />
              Назад
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Создание контракта</CardTitle>
              <CardDescription>
                Заполните информацию о вашем предложении для торговой площадки
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contractType">Тип контракта *</Label>
                      <Select
                        value={formData.contractType}
                        onValueChange={(value) => handleInputChange('contractType', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="futures">Фьючерсный контракт</SelectItem>
                          <SelectItem value="forward">Форвардный контракт</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formData.contractType === 'futures' 
                          ? 'Стандартизированный биржевой контракт' 
                          : 'Индивидуальный внебиржевой контракт'}
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="category">Категория *</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => handleInputChange('category', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите категорию" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="agriculture">Сельское хозяйство</SelectItem>
                          <SelectItem value="food">Продукты питания</SelectItem>
                          <SelectItem value="materials">Стройматериалы</SelectItem>
                          <SelectItem value="services">Услуги</SelectItem>
                          <SelectItem value="other">Прочее</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="title">Название контракта *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="Например: Поставка пшеницы 3 класса"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Описание</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Подробное описание контракта..."
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="productName">Название товара/услуги *</Label>
                      <Input
                        id="productName"
                        value={formData.productName}
                        onChange={(e) => handleInputChange('productName', e.target.value)}
                        placeholder="Пшеница, молоко, услуги..."
                      />
                    </div>

                    <div>
                      <Label htmlFor="unit">Единица измерения *</Label>
                      <Select
                        value={formData.unit}
                        onValueChange={(value) => handleInputChange('unit', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите единицу" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="т">Тонны (т)</SelectItem>
                          <SelectItem value="кг">Килограммы (кг)</SelectItem>
                          <SelectItem value="л">Литры (л)</SelectItem>
                          <SelectItem value="м³">Кубометры (м³)</SelectItem>
                          <SelectItem value="шт">Штуки (шт)</SelectItem>
                          <SelectItem value="услуга">Услуга</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="quantity">Количество *</Label>
                      <Input
                        id="quantity"
                        type="number"
                        step="0.001"
                        value={formData.quantity}
                        onChange={(e) => handleInputChange('quantity', e.target.value)}
                        placeholder="100"
                      />
                    </div>

                    <div>
                      <Label htmlFor="pricePerUnit">Цена за единицу (₽) *</Label>
                      <Input
                        id="pricePerUnit"
                        type="number"
                        step="0.01"
                        value={formData.pricePerUnit}
                        onChange={(e) => handleInputChange('pricePerUnit', e.target.value)}
                        placeholder="15000"
                      />
                    </div>

                    <div>
                      <Label>Общая сумма (₽)</Label>
                      <Input
                        value={formData.quantity && formData.pricePerUnit 
                          ? (parseFloat(formData.quantity) * parseFloat(formData.pricePerUnit)).toLocaleString('ru-RU')
                          : '0'}
                        disabled
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="contractStartDate">Дата начала контракта *</Label>
                      <Input
                        id="contractStartDate"
                        type="date"
                        value={formData.contractStartDate}
                        onChange={(e) => handleInputChange('contractStartDate', e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="deliveryDate">Дата поставки *</Label>
                      <Input
                        id="deliveryDate"
                        type="date"
                        value={formData.deliveryDate}
                        onChange={(e) => handleInputChange('deliveryDate', e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="contractEndDate">Дата окончания контракта *</Label>
                      <Input
                        id="contractEndDate"
                        type="date"
                        value={formData.contractEndDate}
                        onChange={(e) => handleInputChange('contractEndDate', e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="deliveryAddress">Адрес доставки</Label>
                    <Input
                      id="deliveryAddress"
                      value={formData.deliveryAddress}
                      onChange={(e) => handleInputChange('deliveryAddress', e.target.value)}
                      placeholder="Укажите адрес доставки"
                    />
                  </div>

                  <div>
                    <Label htmlFor="deliveryMethod">Способ доставки</Label>
                    <Input
                      id="deliveryMethod"
                      value={formData.deliveryMethod}
                      onChange={(e) => handleInputChange('deliveryMethod', e.target.value)}
                      placeholder="Самовывоз, доставка транспортом..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="prepaymentPercent">Предоплата (%)</Label>
                      <Input
                        id="prepaymentPercent"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formData.prepaymentPercent}
                        onChange={(e) => handleInputChange('prepaymentPercent', e.target.value)}
                        placeholder="30"
                      />
                    </div>

                    <div>
                      <Label htmlFor="discountPercent">Скидка (%)</Label>
                      <Input
                        id="discountPercent"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formData.discountPercent}
                        onChange={(e) => handleInputChange('discountPercent', e.target.value)}
                        placeholder="5"
                      />
                    </div>

                    <div>
                      <Label htmlFor="minPurchaseQuantity">Мин. объем закупки</Label>
                      <Input
                        id="minPurchaseQuantity"
                        type="number"
                        step="0.001"
                        value={formData.minPurchaseQuantity}
                        onChange={(e) => handleInputChange('minPurchaseQuantity', e.target.value)}
                        placeholder="10"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="financingAvailable"
                      checked={formData.financingAvailable}
                      onCheckedChange={(checked) => handleInputChange('financingAvailable', checked)}
                    />
                    <Label htmlFor="financingAvailable" className="cursor-pointer">
                      Доступно финансирование (возможность привлечения средств покупателей)
                    </Label>
                  </div>

                  <div>
                    <Label htmlFor="termsConditions">Условия контракта</Label>
                    <Textarea
                      id="termsConditions"
                      value={formData.termsConditions}
                      onChange={(e) => handleInputChange('termsConditions', e.target.value)}
                      placeholder="Дополнительные условия и требования..."
                      rows={4}
                    />
                  </div>

                  <ProductMediaUpload
                    productImages={formData.productImages}
                    productVideoUrl={formData.productVideoUrl}
                    onImagesChange={(urls) => handleInputChange('productImages', urls)}
                    onVideoChange={(url) => handleInputChange('productVideoUrl', url)}
                    maxImages={5}
                    maxVideoSizeMB={100}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? (
                      <>
                        <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                        Создание...
                      </>
                    ) : (
                      <>
                        <Icon name="Check" className="mr-2 h-4 w-4" />
                        Создать контракт
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/trading')}
                    disabled={isSubmitting}
                  >
                    Отмена
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}