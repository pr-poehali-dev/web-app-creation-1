import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import type { Request } from '@/types/offer';

interface RequestMetaInfoProps {
  request: Request;
  districtName: string;
  isTransport: boolean;
  renderPriceDisplay: () => React.ReactNode;
  onDelete: () => void;
}

export default function RequestMetaInfo({
  request,
  districtName,
  isTransport,
  renderPriceDisplay,
  onDelete,
}: RequestMetaInfoProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          {!isTransport && (
            <div className="flex items-center gap-2">
              <Icon name="CreditCard" className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Цена</p>
                <p className="font-medium">{renderPriceDisplay()}</p>
              </div>
            </div>
          )}

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
    </>
  );
}
