import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

export default function MyReviewsEmptyState() {
  return (
    <Card>
      <CardContent className="pt-6 text-center py-12">
        <Icon
          name="MessageSquare"
          className="h-16 w-16 text-muted-foreground mx-auto mb-4"
        />
        <h3 className="text-xl font-semibold mb-2">Пока нет отзывов</h3>
        <p className="text-muted-foreground">
          Здесь появятся отзывы от ваших клиентов после завершения заказов
        </p>
      </CardContent>
    </Card>
  );
}
