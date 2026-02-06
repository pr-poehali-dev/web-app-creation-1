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
      <div className="border-2 border-primary/20 rounded-lg p-2.5 hover:border-primary/40 hover:shadow-md transition-all">
        <div onClick={handleCardClick} className="cursor-pointer mb-2">
          <h3 className="font-semibold text-sm mb-1 line-clamp-2">{request.title}</h3>
          <p className="text-xs text-muted-foreground line-clamp-2">{request.description}</p>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs">
            <Icon name="MapPin" className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
            <span className="font-medium truncate">{districtName}</span>
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
              {request.pricePerUnit ? request.pricePerUnit.toLocaleString() : '0'} ₽
            </span>
            {!isOwner && (
              <Button 
                size="sm" 
                onClick={handleResponse}
                variant="outline"
                className="h-7 text-xs px-3"
              >
                Просмотр
              </Button>
            )}
          </div>

          {isOwner && (
            <div className="flex items-center gap-2">
              <Button onClick={handleEdit} variant="outline" className="flex-1 h-7 text-xs px-3" size="sm">
                Редактировать
              </Button>
              {unreadMessages && unreadMessages > 0 && (
                <Button onClick={handleMessages} variant="default" className="h-7 w-7 p-0" size="sm">
                  <div className="relative">
                    <Icon name="MessageSquare" className="h-3.5 w-3.5" />
                    <Badge variant="destructive" className="absolute -top-2 -right-2 h-4 min-w-4 px-1 text-[10px]">
                      {unreadMessages}
                    </Badge>
                  </div>
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