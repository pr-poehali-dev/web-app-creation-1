import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';
import type { Offer } from '@/types/offer';

interface OfferInfoTabProps {
  offer: Offer;
  districtName: string;
  onEdit: () => void;
  onDelete: () => void;
}

export default function OfferInfoTab({ offer, districtName, onEdit, onDelete }: OfferInfoTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Основная информация</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {offer.images && offer.images.length > 0 && (
            <div className="aspect-video rounded-lg overflow-hidden">
              <img
                src={offer.images[0].url}
                alt={offer.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="space-y-3">
            <div>
              <h3 className="text-2xl font-bold">{offer.title}</h3>
              <p className="text-muted-foreground mt-2">{offer.description}</p>
            </div>
            
            <Separator />
            
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
                <span className="text-muted-foreground">Район:</span>
                <p className="font-semibold">{districtName}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Просмотры:</span>
                <p className="font-semibold">{offer.views || 0}</p>
              </div>
            </div>

            <Separator />
            
            <div className="flex gap-2">
              <Button className="flex-1" onClick={onEdit}>
                <Icon name="Pencil" className="w-4 h-4 mr-2" />
                Редактировать
              </Button>
              <Button variant="destructive" onClick={onDelete}>
                <Icon name="Trash2" className="w-4 h-4 mr-2" />
                Удалить
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
