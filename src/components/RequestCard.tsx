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
  
  const isOwner = currentUser && request.userId === currentUser.id;
  const districtName = DISTRICTS.find(d => d.id === request.district)?.name;
  const isService = request.category === 'utilities';

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
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
              <div className="flex items-center gap-2 opacity-30">
                <div className="h-16 w-16 overflow-hidden rounded-md flex items-center justify-center">
                  <img 
                    src="https://cdn.poehali.dev/projects/1a60f89a-b726-4c33-8dad-d42db554ed3e/bucket/4bbf8889-8425-4a91-bebb-1e4aaa060042.png" 
                    alt="ЕРТТП" 
                    className="h-full w-full scale-[2.5] brightness-125 contrast-125"
                    style={{ filter: 'brightness(1.3) contrast(1.3) drop-shadow(0 0 2px white) drop-shadow(0 0 4px white)', transform: 'scaleX(-1)' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-2.5 space-y-1.5">
          <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors leading-snug">
            {request.title}
          </h3>

          <div className="space-y-1">
            <div className="flex items-baseline gap-1">
              {isService ? (
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
                  <span className="font-bold text-primary text-lg">
                    {request.pricePerUnit 
                      ? `${(request.pricePerUnit * request.quantity).toLocaleString('ru-RU')} ₽`
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
            </div>
            
            {districtName && (
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