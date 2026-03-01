import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Icon from '@/components/ui/icon';

export interface AdminOffer {
  id: string;
  title: string;
  seller: string;
  sellerId?: string;
  price: number;
  quantity: number;
  soldQuantity: number;
  reservedQuantity: number;
  unit: string;
  status: 'active' | 'moderation' | 'pending' | 'rejected' | 'completed' | 'deleted' | 'archived' | 'inactive' | string;
  createdAt: string;
}

interface AdminOffersTableProps {
  offers: AdminOffer[];
  isLoading: boolean;
  editingTitleId: string | null;
  editingTitleValue: string;
  onEditingTitleValueChange: (value: string) => void;
  onEditTitle: (offer: AdminOffer) => void;
  onSaveTitle: (offerId: string) => void;
  onCancelEditTitle: () => void;
  onApprove: (offer: AdminOffer) => void;
  onReject: (offer: AdminOffer) => void;
  onDelete: (offer: AdminOffer) => void;
}

function getStatusBadge(status: string, quantity?: number, soldQuantity?: number) {
  // Если всё продано — показываем "Завершено" независимо от технического статуса
  if (status === 'active' && quantity !== undefined && soldQuantity !== undefined && soldQuantity >= quantity && quantity > 0) {
    return <Badge className="bg-blue-500 text-white">Завершено</Badge>;
  }
  switch (status) {
    case 'active':
      return <Badge className="bg-green-500 text-white">Активно</Badge>;
    case 'moderation':
      return <Badge variant="secondary">На модерации</Badge>;
    case 'pending':
      return <Badge className="bg-yellow-400 text-white">Ожидает</Badge>;
    case 'rejected':
      return <Badge variant="destructive">Отклонено</Badge>;
    case 'completed':
      return <Badge className="bg-blue-500 text-white">Завершено</Badge>;
    case 'cancelled':
      return <Badge variant="outline" className="border-red-300 text-red-600">Отменено</Badge>;
    case 'awaiting_payment':
      return <Badge className="bg-purple-500 text-white">В работе (ждет оплаты)</Badge>;
    case 'deleted':
      return <Badge variant="outline" className="border-gray-400 text-gray-600">Удалено</Badge>;
    case 'archived':
      return <Badge variant="outline" className="border-gray-400 text-gray-600">В архиве</Badge>;
    case 'inactive':
      return <Badge variant="outline" className="text-gray-500">Неактивно</Badge>;
    default:
      return <Badge variant="outline" className="text-gray-500">{status}</Badge>;
  }
}

export default function AdminOffersTable({
  offers,
  isLoading,
  editingTitleId,
  editingTitleValue,
  onEditingTitleValueChange,
  onEditTitle,
  onSaveTitle,
  onCancelEditTitle,
  onApprove,
  onReject,
  onDelete,
}: AdminOffersTableProps) {
  const navigate = useNavigate();

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Название</TableHead>
            <TableHead>Продавец</TableHead>
            <TableHead>Цена</TableHead>
            <TableHead>Доступно</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead>Дата создания</TableHead>
            <TableHead className="text-right">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8">
                Загрузка...
              </TableCell>
            </TableRow>
          ) : offers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                Предложения не найдены
              </TableCell>
            </TableRow>
          ) : offers.map((offer) => (
            <TableRow key={offer.id}>
              <TableCell className="font-medium">
                {editingTitleId === offer.id ? (
                  <div className="flex items-center gap-1">
                    <Input
                      value={editingTitleValue}
                      onChange={(e) => onEditingTitleValueChange(e.target.value)}
                      className="h-8 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') onSaveTitle(offer.id);
                        if (e.key === 'Escape') onCancelEditTitle();
                      }}
                      autoFocus
                    />
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => onSaveTitle(offer.id)}>
                      <Icon name="Check" className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={onCancelEditTitle}>
                      <Icon name="X" className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                ) : (
                  <span
                    className="cursor-pointer hover:text-primary"
                    onDoubleClick={() => onEditTitle(offer)}
                    title="Двойной клик для редактирования"
                  >
                    {offer.title}
                  </span>
                )}
              </TableCell>
              <TableCell>
                {offer.sellerId ? (
                  <button
                    onClick={() => navigate(`/profile?userId=${offer.sellerId}`)}
                    className="text-primary hover:underline"
                  >
                    {offer.seller}
                  </button>
                ) : (
                  <span className="text-muted-foreground">{offer.seller}</span>
                )}
              </TableCell>
              <TableCell>{offer.price.toLocaleString('ru-RU')} ₽</TableCell>
              <TableCell>
                <div className="text-sm space-y-1">
                  <div>
                    <span className="font-semibold text-green-600">
                      {offer.quantity - offer.soldQuantity - offer.reservedQuantity}
                    </span> {offer.unit}
                    <span className="text-muted-foreground ml-1">
                      (из {offer.quantity})
                    </span>
                  </div>
                  {(offer.soldQuantity > 0 || offer.reservedQuantity > 0) && (
                    <div className="text-xs text-muted-foreground">
                      {offer.soldQuantity > 0 && `Продано: ${offer.soldQuantity}`}
                      {offer.soldQuantity > 0 && offer.reservedQuantity > 0 && ', '}
                      {offer.reservedQuantity > 0 && `Резерв: ${offer.reservedQuantity}`}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(offer.status, offer.quantity, offer.soldQuantity)}</TableCell>
              <TableCell>{new Date(offer.createdAt).toLocaleDateString('ru-RU')}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEditTitle(offer)}
                    title="Редактировать название"
                  >
                    <Icon name="Pencil" className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/offer/${offer.id}`)}
                  >
                    <Icon name="Eye" className="h-4 w-4" />
                  </Button>
                  {offer.status === 'moderation' && (
                    <>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => onApprove(offer)}
                      >
                        <Icon name="Check" className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onReject(offer)}
                      >
                        <Icon name="X" className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDelete(offer)}
                  >
                    <Icon name="Trash2" className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}