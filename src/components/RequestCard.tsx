import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import Icon from '@/components/ui/icon';
import type { Request } from '@/types/offer';
import { getSession } from '@/utils/auth';
import { DISTRICTS } from '@/data/districts';

interface RequestCardProps {
  request: Request;
  onDelete?: (id: string) => void;
  unreadMessages?: number;
}

export default function RequestCard({ request, onDelete, unreadMessages }: RequestCardProps) {
  const navigate = useNavigate();
  const currentUser = getSession();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const isOwner = currentUser && String(request.userId) === String(currentUser.id);
  const districtName = DISTRICTS.find(d => d.id === request.district)?.name;
  const isService = request.category === 'utilities';
  const isTransport = request.category === 'transport';
  const isCargo = isTransport && (request.transportServiceType === 'cargo' || request.transportServiceType === 'Грузоперевозки');
  const isPassenger = isTransport && (request.transportServiceType === 'passenger' || request.transportServiceType === 'Пассажирские перевозки');

  const getCategoryIcon = (category: string): { icon: string; label: string } => {
    const map: Record<string, { icon: string; label: string }> = {
      'dairy': { icon: 'Milk', label: 'Молочная продукция' },
      'meat': { icon: 'Beef', label: 'Мясная продукция' },
      'semifinished': { icon: 'BoxOpen', label: 'Полуфабрикаты' },
      'fruits-vegetables': { icon: 'Apple', label: 'Овощи и фрукты' },
      'animal-feed': { icon: 'PawPrint', label: 'Корма для животных' },
      'lumber': { icon: 'Trees', label: 'Пиломатериалы' },
      'raw-materials': { icon: 'Brick', label: 'Строительные материалы' },
      'solid-fuel': { icon: 'Flame', label: 'Твердое топливо' },
      'energy': { icon: 'Droplet', label: 'ГСМ' },
      'essentials': { icon: 'ShoppingBag', label: 'Товары' },
      'household-chemicals': { icon: 'TestTube', label: 'Бытовая химия' },
      'household-appliances': { icon: 'Sofa', label: 'Бытовая техника и мебель' },
      'equipment': { icon: 'Wrench', label: 'Техника и оборудование' },
      'auto-sale': { icon: 'Car', label: 'Авто продажа' },
      'utilities': { icon: 'Briefcase', label: 'Услуги' },
      'works': { icon: 'HardHat', label: 'Работы' },
      'other': { icon: 'Package', label: 'Прочее' },
    };
    return map[category] || { icon: 'Package', label: 'ПРОЧЕЕ' };
  };

  const categoryDisplay = getCategoryIcon(request.category);
  
  const transportTitle = isCargo ? 'Грузоперевозки' : isPassenger ? 'Пассажирские перевозки' : request.title;

  const handleCardClick = () => {
    navigate(`/request/${request.id}`);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/edit-request/${request.id}`);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (onDelete) {
      onDelete(request.id);
    }
    setShowDeleteDialog(false);
  };

  const handleMessages = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/chat-notifications');
  };

  const handleResponse = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/request/${request.id}`);
  };

  return (
    <>
      <Card
        className="transition-all hover:shadow-xl cursor-pointer group"
        onClick={handleCardClick}
      >
        <CardHeader className="p-0">
          <div className="relative aspect-[16/9] bg-muted overflow-hidden">
            {request.images && request.images.length > 0 ? (
              <img
                src={request.images[0].url}
                alt={request.images[0].alt || request.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                {isTransport ? (
                  <div className="flex flex-col items-center gap-1 opacity-40">
                    {isCargo ? (
                      <>
                        <Icon name="Truck" className="h-12 w-12 text-primary" />
                        <span className="text-[11px] font-bold text-primary tracking-wider">ГРУЗОВЫЕ</span>
                      </>
                    ) : (
                      <>
                        <Icon name="Car" className="h-12 w-12 text-primary" />
                        <span className="text-[11px] font-bold text-primary tracking-wider">ТАКСИ</span>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1 opacity-40">
                    <Icon name={categoryDisplay.icon} className="h-12 w-12 text-primary" />
                    <span className="text-[11px] font-bold text-primary tracking-wider">{categoryDisplay.label}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-2.5 space-y-1.5">
          <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors leading-snug">
            {isTransport ? transportTitle : request.title}
          </h3>

          <div className="space-y-1">
            {isTransport ? (
              <>
                {/* Маршрут + цена в одну строку */}
                <div className="flex items-start justify-between gap-1">
                  <span className="text-sm font-bold text-foreground leading-tight min-w-0 truncate">
                    {request.transportRoute || '—'}
                  </span>
                  <span className="font-bold text-primary text-sm whitespace-nowrap flex-shrink-0">
                    {request.transportNegotiable
                      ? 'Договор.'
                      : request.transportPrice
                      ? `${Number(request.transportPrice).toLocaleString('ru-RU')} ₽`
                      : ''}
                  </span>
                </div>
                {/* Дата */}
                {request.transportDepartureDateTime && (
                  <span className="text-xs text-muted-foreground block">
                    {new Date(request.transportDepartureDateTime).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </>
            ) : null}
            <div className="flex items-baseline gap-1">
              {isTransport ? null : isService ? (
                <>
                  {request.budget ? (
                    <span className="font-bold text-primary text-lg">
                      {request.budget.toLocaleString('ru-RU')} ₽
                    </span>
                  ) : request.negotiableBudget ? (
                    <Badge variant="secondary" className="text-xs h-5 px-2">
                      По договоренности
                    </Badge>
                  ) : null}
                </>
              ) : (
                <>
                  {request.negotiablePrice && !(request.pricePerUnit > 0) ? (
                    <span className="font-bold text-primary text-lg">
                      Ваша цена
                    </span>
                  ) : (
                    <>
                      <span className="font-bold text-primary text-lg">
                        {request.pricePerUnit != null && request.pricePerUnit > 0
                          ? `${Number(request.pricePerUnit * request.quantity).toLocaleString('ru-RU')} ₽`
                          : 'Цена не указана'
                        }
                      </span>
                      {request.negotiablePrice && (
                        <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                          Торг
                        </Badge>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
            
            {!isTransport && !isService && request.quantity > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <Icon name="Package" className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs text-muted-foreground">
                    Нужно: <span className="font-medium text-foreground">{request.quantity} {request.unit || 'шт'}</span>
                  </span>
                </div>
                {(request.acceptedQty ?? 0) > 0 && (
                  <>
                    <span className="text-muted-foreground/40 text-xs">·</span>
                    <div className="flex items-center gap-1">
                      <Icon name="CheckCircle" className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                      <span className="text-xs font-medium text-green-600">
                        Осталось: {request.quantity - (request.acceptedQty ?? 0)} {request.unit || 'шт'}
                      </span>
                    </div>
                  </>
                )}
                {request.responses !== undefined && (
                  <>
                    <span className="text-muted-foreground/40 text-xs">·</span>
                    <div className="flex items-center gap-1">
                      <Icon name="MessageSquare" className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="text-xs text-muted-foreground">
                        Откликов: <span className={`font-medium ${request.responses > 0 ? 'text-primary' : 'text-foreground'}`}>{request.responses}</span>
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}

            {!isTransport && districtName && (
              <div className="flex items-center gap-1.5">
                <Icon name="MapPin" className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-xs text-muted-foreground truncate">{districtName}</span>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="p-2.5 pt-0">
          {isOwner ? (
            <div className="flex items-center gap-2 w-full" onClick={(e) => e.stopPropagation()}>
              <Button onClick={handleEdit} variant="outline" className="flex-1 h-8 text-xs" size="sm">
                <Icon name="Pencil" className="mr-1.5 h-3.5 w-3.5" />
                Редактировать
              </Button>
              {unreadMessages && unreadMessages > 0 && (
                <Button onClick={handleMessages} variant="default" className="h-8 text-xs" size="sm">
                  <Icon name="MessageSquare" className="mr-1.5 h-3.5 w-3.5" />
                  Сообщения
                  <Badge variant="destructive" className="ml-2 h-5 min-w-5 px-1.5">
                    {unreadMessages}
                  </Badge>
                </Button>
              )}
            </div>
          ) : (
            <Button
              onClick={handleResponse}
              variant="default"
              className="w-full h-8 text-xs"
              size="sm"
            >
              Откликнуться
            </Button>
          )}
        </CardFooter>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить запрос?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Запрос будет удалён безвозвратно.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}