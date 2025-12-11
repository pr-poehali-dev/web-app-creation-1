import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Icon from '@/components/ui/icon';
import { CATEGORIES } from '@/data/categories';

type ListingType = 'offer' | 'request';
type ListingStatus = 'active' | 'draft' | 'in_order' | 'completed' | 'archived';

interface ListingItem {
  id: string;
  type: ListingType;
  title: string;
  description: string;
  category: string;
  district: string;
  price: number;
  quantity: number;
  unit: string;
  status: ListingStatus;
  views: number;
  favorites?: number;
  responses?: number;
  images?: Array<{ url: string; alt: string }>;
  isPremium?: boolean;
  orderId?: string;
  orderStatus?: string;
  createdAt: Date;
}

interface ListingCardProps {
  item: ListingItem;
  districts: Array<{ id: string; name: string }>;
  onDelete: (id: string, type: ListingType) => void;
  statusColors: Record<ListingStatus, string>;
  statusLabels: Record<ListingStatus, string>;
}

export default function ListingCard({ 
  item, 
  districts, 
  onDelete,
  statusColors,
  statusLabels 
}: ListingCardProps) {
  const navigate = useNavigate();
  const category = CATEGORIES.find(c => c.id === item.category);
  const districtName = districts.find(d => d.id === item.district)?.name;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="p-0">
        <div className="relative aspect-video bg-muted overflow-hidden">
          {item.type === 'offer' && item.images && item.images.length > 0 ? (
            <img
              src={item.images[0].url}
              alt={item.images[0].alt}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Icon 
                name={item.type === 'offer' ? 'Package' : 'ShoppingBag'} 
                className="h-12 w-12 text-muted-foreground" 
              />
            </div>
          )}
          <div className="absolute top-2 left-2 flex gap-2">
            <Badge variant={item.type === 'offer' ? 'default' : 'secondary'}>
              {item.type === 'offer' ? (
                <>
                  <Icon name="Store" className="h-3 w-3 mr-1" />
                  Предложение
                </>
              ) : (
                <>
                  <Icon name="ShoppingCart" className="h-3 w-3 mr-1" />
                  Запрос
                </>
              )}
            </Badge>
            <Badge className={statusColors[item.status]}>
              {statusLabels[item.status]}
            </Badge>
          </div>
          {item.isPremium && (
            <div className="absolute top-2 right-2">
              <Badge className="bg-primary">
                <Icon name="Star" className="h-3 w-3 mr-1" />
                Премиум
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-3">
        <div>
          <h3 className="font-semibold text-lg line-clamp-2">{item.title}</h3>
        </div>

        {category && (
          <Badge variant="outline">{category.name}</Badge>
        )}

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {item.type === 'offer' ? 'Цена' : 'Бюджет'}:
          </span>
          <span className="font-bold text-lg text-primary">
            {item.price.toLocaleString()} ₽
          </span>
        </div>

        {item.orderId && (
          <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Icon name="Package" className="h-3 w-3" />
                Заказ №{item.orderId.slice(0, 8)}
              </span>
              <Button
                size="sm"
                variant="link"
                className="h-auto p-0"
                onClick={() => navigate(`/order-detail/${item.orderId}`)}
              >
                Детали →
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 pt-2 border-t text-sm">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground">
              <Icon name="Eye" className="h-4 w-4" />
              <span>{item.views}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Просмотры</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground">
              <Icon 
                name={item.type === 'offer' ? 'Heart' : 'MessageSquare'} 
                className="h-4 w-4" 
              />
              <span>{item.favorites || item.responses || 0}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {item.type === 'offer' ? 'Избранное' : 'Отклики'}
            </p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground">
              <Icon name="MapPin" className="h-4 w-4" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{districtName}</p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => navigate(`/offer/${item.id}`)}
        >
          <Icon name="Eye" className="mr-2 h-4 w-4" />
          Просмотр
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Icon name="MoreVertical" className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem disabled>
              <Icon name="Pencil" className="mr-2 h-4 w-4" />
              Редактировать
            </DropdownMenuItem>
            {item.status === 'active' && (
              <DropdownMenuItem disabled>
                <Icon name="Archive" className="mr-2 h-4 w-4" />
                В архив
              </DropdownMenuItem>
            )}
            {item.status === 'archived' && (
              <DropdownMenuItem disabled>
                <Icon name="ArchiveRestore" className="mr-2 h-4 w-4" />
                Восстановить
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => onDelete(item.id, item.type)}
              className="text-red-600"
            >
              <Icon name="Trash2" className="mr-2 h-4 w-4" />
              Удалить
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  );
}
