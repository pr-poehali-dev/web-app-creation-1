import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import type { Request } from '@/types/offer';
import { useDistrict } from '@/contexts/DistrictContext';

interface RequestInfoTabProps {
  request: Request;
  onDelete: () => void;
}

export default function RequestInfoTab({ request, onDelete }: RequestInfoTabProps) {
  const { districts } = useDistrict();
  const districtName = districts.find(d => d.id === request.district)?.name || request.district;

  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-4">{request.title}</h2>
          <p className="text-muted-foreground">{request.description}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Icon name="Package" className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Количество</p>
                <p className="font-medium">{request.quantity} {request.unit}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Icon name="CreditCard" className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Цена</p>
                <p className="font-medium">
                  {request.pricePerUnit > 0 
                    ? `${request.pricePerUnit.toLocaleString()} ₽`
                    : 'Не указана'
                  }
                  {request.negotiablePrice && ' (Торг)'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Icon name="MapPin" className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Район</p>
                <p className="font-medium">{districtName}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Icon name="Calendar" className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Дата создания</p>
                <p className="font-medium">
                  {new Date(request.createdAt).toLocaleDateString('ru-RU')}
                </p>
              </div>
            </div>

            {request.expiryDate && (
              <div className="flex items-center gap-2">
                <Icon name="Clock" className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Действует до</p>
                  <p className="font-medium">
                    {new Date(request.expiryDate).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Icon name="Eye" className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Просмотры</p>
                <p className="font-medium">{request.views || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {request.isPremium && (
          <Badge variant="default" className="bg-primary">
            <Icon name="Star" className="w-3 h-3 mr-1" />
            Premium
          </Badge>
        )}

        <div className="pt-4 border-t flex gap-2">
          <Button onClick={onDelete} variant="destructive" size="sm">
            <Icon name="Trash2" className="w-4 h-4 mr-2" />
            Удалить запрос
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
