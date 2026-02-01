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
import { useDistrict } from '@/contexts/DistrictContext';
import { getExpirationStatus } from '@/utils/expirationFilter';

interface RequestCardProps {
  request: Request;
  onDelete?: (id: string) => void;
  unreadMessages?: number;
}

export default function RequestCard({ request, onDelete, unreadMessages }: RequestCardProps) {
  const navigate = useNavigate();
  const { districts } = useDistrict();
  const currentUser = getSession();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const isOwner = currentUser && request.userId === currentUser.id;
  const districtName = districts.find(d => d.id === request.district)?.name;
  const expirationInfo = getExpirationStatus(request);

  const handleCardClick = () => {
    // Если это свой запрос - открываем редактирование
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
      <div className="border rounded-lg p-3 hover:shadow-lg transition-shadow">
        <div onClick={handleCardClick} className="cursor-pointer mb-2">
          <h3 className="font-semibold text-sm mb-1 line-clamp-2">{request.title}</h3>
          <p className="text-xs text-muted-foreground line-clamp-2">{request.description}</p>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
            <Icon name="MapPin" className="h-3.5 w-3.5 flex-shrink-0" />
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="font-medium text-foreground truncate">{districtName}</span>
              {(request.deliveryAddress || request.location) && (request.deliveryAddress || request.location)?.trim() !== '' && (
                <span className="truncate">{request.deliveryAddress || request.location}</span>
              )}
            </div>
          </div>
          {expirationInfo.expiryDate && (
            <div className="flex items-center gap-1.5 text-xs">
              <Icon name="Clock" className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
              <span className={expirationInfo.daysRemaining && expirationInfo.daysRemaining <= 3 ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                {expirationInfo.daysRemaining && expirationInfo.daysRemaining > 0 
                  ? `Осталось ${expirationInfo.daysRemaining} ${expirationInfo.daysRemaining === 1 ? 'день' : expirationInfo.daysRemaining < 5 ? 'дня' : 'дней'}`
                  : 'Истекает сегодня'
                }
              </span>
            </div>
          )}
          
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-bold text-primary">
              {(((request as any).price || request.pricePerUnit) || 0).toLocaleString()} ₽
            </span>
            {!isOwner && (
              <Button 
                size="sm" 
                onClick={handleResponse}
                className="h-7 text-xs px-2"
              >
                Отклик
              </Button>
            )}
          </div>

          {isOwner && (
            <div className="space-y-1.5">
              <Button onClick={handleEdit} variant="outline" className="w-full h-7 text-xs" size="sm">
                <Icon name="Pencil" className="mr-1 h-3 w-3" />
                Редактировать
              </Button>
              {unreadMessages && unreadMessages > 0 && (
                <Button onClick={handleMessages} variant="default" className="w-full h-7 text-xs" size="sm">
                  <Icon name="MessageSquare" className="mr-1 h-3 w-3" />
                  Сообщения
                  <Badge variant="destructive" className="ml-1.5 h-4 min-w-4 px-1 text-[10px]">
                    {unreadMessages}
                  </Badge>
                </Button>
              )}
            </div>
          )}
        </div>
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