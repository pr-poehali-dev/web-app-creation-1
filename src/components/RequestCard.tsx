import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { getExpirationStatus } from '@/utils/expirationFilter';

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
    if (isOwner) {
      navigate(`/edit-request/${request.id}`);
    } else {
      navigate(`/request/${request.id}`);
    }
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
      <div 
        className="border-2 border-primary/20 rounded-lg p-3 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer"
        onClick={handleCardClick}
      >
        <h3 className="font-semibold text-base line-clamp-2 mb-2">{request.title}</h3>

        <div className="space-y-2">
          {isService ? (
            <div className="flex flex-col items-start gap-1">
              {request.budget ? (
                <span className="font-bold text-primary text-xl">
                  {request.budget.toLocaleString('ru-RU')} ₽
                </span>
              ) : request.negotiableBudget ? (
                <Badge variant="secondary" className="text-xs">
                  Бюджет: Ваши предложения
                </Badge>
              ) : null}
            </div>
          ) : (
            <div className="flex flex-col items-start gap-1">
              <span className="font-bold text-primary text-xl">
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
            </div>
          )}
          
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Icon name="MapPin" className="h-4 w-4 flex-shrink-0" />
            <span className="font-medium text-foreground truncate">{districtName}</span>
          </div>
        </div>

        {isOwner && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t" onClick={(e) => e.stopPropagation()}>
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
        )}
      </div>

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