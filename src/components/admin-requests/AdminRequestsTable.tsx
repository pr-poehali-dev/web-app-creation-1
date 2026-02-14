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

export interface AdminRequest {
  id: string;
  title: string;
  buyer: string;
  buyerId?: string;
  pricePerUnit: number;
  budget: number;
  quantity: number;
  unit: string;
  status: 'active' | 'moderation' | 'rejected' | 'completed' | 'archived' | 'deleted';
  createdAt: string;
}

interface AdminRequestsTableProps {
  requests: AdminRequest[];
  isLoading: boolean;
  editingTitleId: string | null;
  editingTitleValue: string;
  onEditingTitleValueChange: (value: string) => void;
  onEditTitle: (request: AdminRequest) => void;
  onSaveTitle: (requestId: string) => void;
  onCancelEditTitle: () => void;
  onApprove: (request: AdminRequest) => void;
  onReject: (request: AdminRequest) => void;
  onDelete: (request: AdminRequest) => void;
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'active':
      return <Badge className="bg-green-500">Активно</Badge>;
    case 'moderation':
      return <Badge variant="secondary">На модерации</Badge>;
    case 'rejected':
      return <Badge variant="destructive">Отклонено</Badge>;
    case 'completed':
      return <Badge>Завершено</Badge>;
    case 'archived':
      return <Badge variant="outline">Архив</Badge>;
    case 'deleted':
      return <Badge variant="outline" className="bg-gray-100">Удалено</Badge>;
    default:
      return null;
  }
}

export default function AdminRequestsTable({
  requests,
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
}: AdminRequestsTableProps) {
  const navigate = useNavigate();

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Название</TableHead>
            <TableHead>Покупатель</TableHead>
            <TableHead>Цена за ед.</TableHead>
            <TableHead>Бюджет</TableHead>
            <TableHead>Количество</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead>Дата создания</TableHead>
            <TableHead className="text-right">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8">
                Загрузка...
              </TableCell>
            </TableRow>
          ) : requests.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                Запросы не найдены
              </TableCell>
            </TableRow>
          ) : requests.map((request) => (
            <TableRow key={request.id}>
              <TableCell className="font-medium">
                {editingTitleId === request.id ? (
                  <div className="flex items-center gap-1">
                    <Input
                      value={editingTitleValue}
                      onChange={(e) => onEditingTitleValueChange(e.target.value)}
                      className="h-8 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') onSaveTitle(request.id);
                        if (e.key === 'Escape') onCancelEditTitle();
                      }}
                      autoFocus
                    />
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => onSaveTitle(request.id)}>
                      <Icon name="Check" className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={onCancelEditTitle}>
                      <Icon name="X" className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                ) : (
                  <span
                    className="cursor-pointer hover:text-primary"
                    onDoubleClick={() => onEditTitle(request)}
                    title="Двойной клик для редактирования"
                  >
                    {request.title}
                  </span>
                )}
              </TableCell>
              <TableCell>
                {request.buyerId ? (
                  <button
                    onClick={() => navigate(`/profile?userId=${request.buyerId}`)}
                    className="text-primary hover:underline"
                  >
                    {request.buyer}
                  </button>
                ) : (
                  <span className="text-muted-foreground">{request.buyer}</span>
                )}
              </TableCell>
              <TableCell>{request.pricePerUnit.toLocaleString('ru-RU')} ₽</TableCell>
              <TableCell className="font-semibold">{request.budget.toLocaleString('ru-RU')} ₽</TableCell>
              <TableCell>{request.quantity} {request.unit}</TableCell>
              <TableCell>{getStatusBadge(request.status)}</TableCell>
              <TableCell>{new Date(request.createdAt).toLocaleDateString('ru-RU')}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEditTitle(request)}
                    title="Редактировать название"
                  >
                    <Icon name="Pencil" className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/request/${request.id}`)}
                  >
                    <Icon name="Eye" className="h-4 w-4" />
                  </Button>
                  {request.status === 'moderation' && (
                    <>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => onApprove(request)}
                      >
                        <Icon name="Check" className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onReject(request)}
                      >
                        <Icon name="X" className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDelete(request)}
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
