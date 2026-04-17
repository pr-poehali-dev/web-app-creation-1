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

  const getCategoryIcon = (category: string): { icon?: string; image?: string; label: string } => {
    const map: Record<string, { icon?: string; image?: string; label: string }> = {
      'dairy': { image: 'https://cdn.poehali.dev/projects/1a60f89a-b726-4c33-8dad-d42db554ed3e/files/5dae4ccf-ae29-426c-a111-7ccd6aea1078.jpg', label: 'МОЛОЧНОЕ' },
      'meat': { image: 'https://cdn.poehali.dev/projects/1a60f89a-b726-4c33-8dad-d42db554ed3e/files/760e2d67-0452-4f54-8a18-fa22d57173f7.jpg', label: 'МЯСО' },
      'semifinished': { icon: 'BoxOpen', label: 'ПОЛУФАБРИКАТЫ' },
      'fruits-vegetables': { image: 'https://cdn.poehali.dev/projects/1a60f89a-b726-4c33-8dad-d42db554ed3e/files/82cf4c51-d291-4a69-8a4a-34d002614946.jpg', label: 'ОВОЩИ И ФРУКТЫ' },
      'animal-feed': { image: 'https://cdn.poehali.dev/projects/1a60f89a-b726-4c33-8dad-d42db554ed3e/files/0a4e4498-1cdd-430d-b07c-dbff917fc4f3.jpg', label: 'КОРМА С/Х' },
      'lumber': { image: 'https://cdn.poehali.dev/projects/1a60f89a-b726-4c33-8dad-d42db554ed3e/files/5d6b7deb-1ff1-4074-824b-481d1106a504.jpg', label: 'ПИЛОМАТЕРИАЛЫ' },
      'raw-materials': { image: 'https://cdn.poehali.dev/projects/1a60f89a-b726-4c33-8dad-d42db554ed3e/files/9eca645e-6263-4470-9dc6-98436a47538e.jpg', label: 'СТРОЙМАТЕРИАЛЫ' },
      'solid-fuel': { image: 'https://cdn.poehali.dev/projects/1a60f89a-b726-4c33-8dad-d42db554ed3e/files/8c74487b-d5fa-440a-8523-711475abaa3c.jpg', label: 'ТВЁРДОЕ ТОПЛИВО' },
      'energy': { image: 'https://cdn.poehali.dev/projects/1a60f89a-b726-4c33-8dad-d42db554ed3e/files/9a7a7961-30d3-47a5-920e-9be6ab4c741d.jpg', label: 'ГСМ' },
      'essentials': { image: 'https://cdn.poehali.dev/projects/1a60f89a-b726-4c33-8dad-d42db554ed3e/files/fddd25c5-c858-4970-b1b2-35405bf1a0e1.jpg', label: 'ТОВАРЫ' },
      'household-chemicals': { icon: 'TestTube', label: 'БЫТ. ХИМИЯ' },
      'household-appliances': { icon: 'Sofa', label: 'ТЕХНИКА И МЕБЕЛЬ' },
      'equipment': { image: 'https://cdn.poehali.dev/projects/1a60f89a-b726-4c33-8dad-d42db554ed3e/files/87798852-a0fb-45d8-84d3-bbc5e4230042.jpg', label: 'ОБОРУДОВАНИЕ' },
      'auto-sale': { icon: 'Car', label: 'АВТО' },
      'transport': { image: 'https://cdn.poehali.dev/projects/1a60f89a-b726-4c33-8dad-d42db554ed3e/files/431dc84f-9050-4847-9f39-19297fb50aa7.jpg', label: 'ГРУЗОВЫЕ' },
      'utilities': { icon: 'Briefcase', label: 'УСЛУГИ' },
      'works': { icon: 'HardHat', label: 'РАБОТЫ' },
      'other': { icon: 'Package', label: 'ПРОЧЕЕ' },
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
            ) : categoryDisplay.image ? (
              <>
                <img src={categoryDisplay.image} alt={categoryDisplay.label} className="w-full h-full object-cover" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent px-2 py-1">
                  <span className="text-[11px] font-bold text-white tracking-wider">{categoryDisplay.label}</span>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                <div className="flex flex-col items-center gap-1 opacity-40">
                  <Icon name={categoryDisplay.icon || 'Package'} className="h-12 w-12 text-primary" />
                  <span className="text-[11px] font-bold text-primary tracking-wider">{categoryDisplay.label}</span>
                </div>
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