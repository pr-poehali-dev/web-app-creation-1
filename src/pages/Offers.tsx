import { useState } from 'react';
import Header from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useDistrict } from '@/contexts/DistrictContext';
import { filterByDistrict } from '@/utils/districtFilter';

interface Offer {
  id: string;
  title: string;
  description: string;
  price: number;
  district: string;
  category: string;
  seller: string;
  image?: string;
}

interface OffersProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function Offers({ isAuthenticated, onLogout }: OffersProps) {
  const { selectedDistrict, districts } = useDistrict();

  const allOffers: Offer[] = [
    {
      id: '1',
      title: 'Стройматериалы оптом',
      description: 'Широкий ассортимент стройматериалов по оптовым ценам',
      price: 50000,
      district: 'central',
      category: 'Строительство',
      seller: 'ООО "СтройМастер"',
    },
    {
      id: '2',
      title: 'Офисная мебель',
      description: 'Комплекты офисной мебели для компаний',
      price: 75000,
      district: 'northern',
      category: 'Мебель',
      seller: 'ИП Иванов А.С.',
    },
    {
      id: '3',
      title: 'IT-оборудование',
      description: 'Компьютеры, ноутбуки, серверы',
      price: 120000,
      district: 'central',
      category: 'Техника',
      seller: 'ООО "ТехноСервис"',
    },
    {
      id: '4',
      title: 'Канцелярские товары',
      description: 'Полный комплект канцтоваров для офиса',
      price: 15000,
      district: 'southern',
      category: 'Канцтовары',
      seller: 'ООО "Офис+"',
    },
    {
      id: '5',
      title: 'Транспортные услуги',
      description: 'Грузоперевозки по региону',
      price: 3000,
      district: 'industrial',
      category: 'Услуги',
      seller: 'ИП Петров В.И.',
    },
    {
      id: '6',
      title: 'Упаковочные материалы',
      description: 'Различные виды упаковки для товаров',
      price: 8000,
      district: 'western',
      category: 'Упаковка',
      seller: 'ООО "ПакСервис"',
    },
    {
      id: '7',
      title: 'Электротовары',
      description: 'Кабели, розетки, выключатели, светильники',
      price: 25000,
      district: 'eastern',
      category: 'Электрика',
      seller: 'ИП Сидоров М.П.',
    },
    {
      id: '8',
      title: 'Клининговые услуги',
      description: 'Профессиональная уборка помещений',
      price: 5000,
      district: 'central',
      category: 'Услуги',
      seller: 'ООО "ЧистоДом"',
    },
  ];

  const filteredOffers = filterByDistrict(allOffers, selectedDistrict);
  const currentDistrictName = districts.find(d => d.id === selectedDistrict)?.name;

  return (
    <div className="min-h-screen bg-background">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Предложения</h1>
          <p className="text-muted-foreground">
            Просмотр коммерческих предложений от поставщиков
          </p>
        </div>

        {selectedDistrict !== 'all' && (
          <div className="mb-6">
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6 pb-4">
                <div className="flex items-center gap-2">
                  <Icon name="Filter" className="h-5 w-5 text-primary" />
                  <p className="text-sm">
                    Отображаются предложения для района: <span className="font-semibold">{currentDistrictName}</span>
                  </p>
                  <Badge variant="secondary" className="ml-auto">
                    {filteredOffers.length} из {allOffers.length}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {filteredOffers.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="pt-12 pb-12 text-center">
              <Icon name="Package" className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Нет предложений</h3>
              <p className="text-muted-foreground">
                В выбранном районе пока нет доступных предложений
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredOffers.map((offer) => (
              <Card key={offer.id} className="transition-all hover:shadow-lg">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="secondary">{offer.category}</Badge>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Icon name="MapPin" className="h-3 w-3" />
                      <span className="text-xs">
                        {districts.find(d => d.id === offer.district)?.name}
                      </span>
                    </div>
                  </div>
                  <CardTitle className="text-xl">{offer.title}</CardTitle>
                  <CardDescription>{offer.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Цена:</span>
                      <span className="text-xl font-bold text-primary">
                        {offer.price.toLocaleString('ru-RU')} ₽
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Icon name="Building2" className="h-4 w-4" />
                      <span>{offer.seller}</span>
                    </div>
                    <Button className="w-full">
                      Подробнее
                      <Icon name="ArrowRight" className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
