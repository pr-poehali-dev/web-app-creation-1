import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

interface AdminReviewsProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

interface Review {
  id: string;
  author: string;
  target: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export default function AdminReviews({ isAuthenticated, onLogout }: AdminReviewsProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const mockReviews: Review[] = [
    {
      id: '1',
      author: 'ИП Петров',
      target: 'ООО "СтройМатериалы"',
      rating: 5,
      comment: 'Отличный поставщик, всё вовремя и качественно!',
      status: 'approved',
      createdAt: '2024-12-03'
    },
    {
      id: '2',
      author: 'ООО "ГорСтрой"',
      target: 'ИП Сидоров',
      rating: 2,
      comment: 'Плохой товар, не соответствует описанию.',
      status: 'pending',
      createdAt: '2024-12-04'
    },
    {
      id: '3',
      author: 'Иван Иванов',
      target: 'ПАО "МеталлПром"',
      rating: 4,
      comment: 'Хорошее качество, но долгая доставка.',
      status: 'approved',
      createdAt: '2024-12-02'
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500">Одобрен</Badge>;
      case 'pending':
        return <Badge variant="secondary">На модерации</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Отклонен</Badge>;
      default:
        return null;
    }
  };

  const getRatingStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Icon
            key={star}
            name="Star"
            className={`h-4 w-4 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  const handleApproveReview = (review: Review) => {
    toast.success(`Отзыв от ${review.author} одобрен`);
  };

  const handleRejectReview = (review: Review) => {
    toast.success(`Отзыв от ${review.author} отклонен`);
  };

  const handleDeleteReview = () => {
    if (selectedReview) {
      toast.success(`Отзыв от ${selectedReview.author} удален`);
      setShowDeleteDialog(false);
      setSelectedReview(null);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2">
                <Icon name="ArrowLeft" className="mr-2 h-4 w-4" />
                Назад
              </Button>
              <h1 className="text-3xl font-bold">Управление отзывами</h1>
              <p className="text-muted-foreground">Модерация отзывов и рейтингов</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Список отзывов</CardTitle>
              <CardDescription>Всего отзывов: {mockReviews.length}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center">
                <div className="flex-1">
                  <Input
                    placeholder="Поиск по автору или компании..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Статус" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все статусы</SelectItem>
                    <SelectItem value="pending">На модерации</SelectItem>
                    <SelectItem value="approved">Одобренные</SelectItem>
                    <SelectItem value="rejected">Отклоненные</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Автор</TableHead>
                      <TableHead>Компания</TableHead>
                      <TableHead>Рейтинг</TableHead>
                      <TableHead>Комментарий</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Дата</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockReviews.map((review) => (
                      <TableRow key={review.id}>
                        <TableCell className="font-medium">{review.author}</TableCell>
                        <TableCell>{review.target}</TableCell>
                        <TableCell>{getRatingStars(review.rating)}</TableCell>
                        <TableCell className="max-w-xs truncate">{review.comment}</TableCell>
                        <TableCell>{getStatusBadge(review.status)}</TableCell>
                        <TableCell>{new Date(review.createdAt).toLocaleDateString('ru-RU')}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedReview(review);
                                setShowDetailsDialog(true);
                              }}
                            >
                              <Icon name="Eye" className="h-4 w-4" />
                            </Button>
                            {review.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handleApproveReview(review)}
                                >
                                  <Icon name="Check" className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleRejectReview(review)}
                                >
                                  <Icon name="X" className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedReview(review);
                                setShowDeleteDialog(true);
                              }}
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
            </CardContent>
          </Card>
        </div>
      </main>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить отзыв?</DialogTitle>
            <DialogDescription>
              Вы действительно хотите удалить отзыв от {selectedReview?.author}? 
              Это действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleDeleteReview}>
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Детали отзыва</DialogTitle>
            <DialogDescription>Полная информация об отзыве</DialogDescription>
          </DialogHeader>
          {selectedReview && (
            <div className="space-y-4 py-4">
              <div className="grid gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Автор отзыва</p>
                  <p className="font-medium">{selectedReview.author}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Компания</p>
                  <p className="font-medium">{selectedReview.target}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Рейтинг</p>
                  <div className="mt-1">{getRatingStars(selectedReview.rating)}</div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Комментарий</p>
                  <p className="mt-1 rounded-md border p-3">{selectedReview.comment}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Статус</p>
                  <div className="mt-1">{getStatusBadge(selectedReview.status)}</div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Дата публикации</p>
                  <p className="font-medium">{new Date(selectedReview.createdAt).toLocaleDateString('ru-RU')}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowDetailsDialog(false)}>Закрыть</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}