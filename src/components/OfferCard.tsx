import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import type { Offer } from '@/types/offer';
import { CATEGORIES } from '@/data/categories';
import { useDistrict } from '@/contexts/DistrictContext';

interface OfferCardProps {
  offer: Offer;
}

export default function OfferCard({ offer }: OfferCardProps) {
  const navigate = useNavigate();
  const { districts } = useDistrict();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const category = CATEGORIES.find(c => c.id === offer.category);
  const subcategory = category?.subcategories.find(s => s.id === offer.subcategory);
  const districtName = districts.find(d => d.id === offer.district)?.name;

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? offer.images.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === offer.images.length - 1 ? 0 : prev + 1));
  };

  const handleCardClick = () => {
    navigate(`/offer/${offer.id}`);
  };

  const handleOrderClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/order/${offer.id}`);
  };

  return (
    <Card
      className={`transition-all hover:shadow-xl cursor-pointer group ${
        offer.isPremium ? 'border-2 border-primary shadow-lg' : ''
      }`}
      onClick={handleCardClick}
    >
      {offer.isPremium && (
        <div className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 text-center">
          Премиум объявление
        </div>
      )}

      <CardHeader className="p-0">
        <div className="relative aspect-video bg-muted overflow-hidden">
          {offer.images.length > 0 ? (
            <>
              <img
                src={offer.images[currentImageIndex].url}
                alt={offer.images[currentImageIndex].alt}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {offer.images.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-colors"
                  >
                    <Icon name="ChevronLeft" className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-colors"
                  >
                    <Icon name="ChevronRight" className="h-4 w-4" />
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {offer.images.map((_, index) => (
                      <div
                        key={index}
                        className={`h-1.5 rounded-full transition-all ${
                          index === currentImageIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Icon name="Image" className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
            {offer.title}
          </h3>
        </div>

        <div className="flex flex-wrap gap-2">
          {category && <Badge variant="secondary">{category.name}</Badge>}
          {subcategory && <Badge variant="outline">{subcategory.name}</Badge>}
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Количество:</span>
            <span className="font-medium">
              {offer.quantity} {offer.unit}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Цена:</span>
            <span className="font-bold text-primary text-lg">
              {offer.pricePerUnit.toLocaleString('ru-RU')} ₽/{offer.unit}
            </span>
          </div>
        </div>

        <div className="pt-2 space-y-2 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Icon name="MapPin" className="h-4 w-4" />
            <span>{districtName}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Icon name="Map" className="h-4 w-4" />
            <span>
              Доставка: {offer.availableDistricts.length === districts.length - 1
                ? 'Все районы'
                : `${offer.availableDistricts.length} ${offer.availableDistricts.length === 1 ? 'район' : 'района'}`}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Icon name="Building2" className="h-4 w-4" />
            <span className="truncate">{offer.seller.name}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <Button onClick={handleOrderClick} className="w-full" size="lg">
          <Icon name="ShoppingCart" className="mr-2 h-4 w-4" />
          Оформить заказ
        </Button>
      </CardFooter>
    </Card>
  );
}