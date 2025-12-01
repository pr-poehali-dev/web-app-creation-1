import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface Author {
  id: string;
  name: string;
  type: 'individual' | 'self-employed' | 'entrepreneur' | 'legal-entity';
  phone: string;
  email: string;
  rating: number;
  reviewsCount: number;
  isVerified: boolean;
  responsiblePerson?: {
    id: string;
    name: string;
    phone: string;
    email: string;
  };
  statistics: {
    totalRequests: number;
    activeRequests: number;
    completedOrders: number;
    registrationDate: Date;
  };
}

interface RequestAuthorCardProps {
  author: Author;
}

export default function RequestAuthorCard({ author }: RequestAuthorCardProps) {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="User" className="h-5 w-5" />
          Автор запроса
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-lg">{author.name}</h3>
            {author.isVerified && (
              <Badge className="gap-1 bg-green-500">
                <Icon name="BadgeCheck" className="h-3 w-3" />
                Верифицирован
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Icon
                  key={i}
                  name="Star"
                  className={`h-4 w-4 ${
                    i < Math.floor(author.rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted-foreground'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              {author.rating} ({author.reviewsCount} отзывов)
            </span>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          {author.responsiblePerson && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Ответственный</p>
              <p className="font-medium">{author.responsiblePerson.name}</p>
            </div>
          )}
          
          <div>
            <p className="text-sm text-muted-foreground mb-1">Телефон</p>
            <a
              href={`tel:${author.phone}`}
              className="font-medium hover:text-primary transition-colors flex items-center gap-1"
            >
              <Icon name="Phone" className="h-4 w-4" />
              {author.phone}
            </a>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground mb-1">Email</p>
            <a
              href={`mailto:${author.email}`}
              className="font-medium hover:text-primary transition-colors flex items-center gap-1"
            >
              <Icon name="Mail" className="h-4 w-4" />
              {author.email}
            </a>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <p className="text-sm font-semibold">Статистика</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Всего запросов</p>
              <p className="font-semibold">{author.statistics.totalRequests}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Активных</p>
              <p className="font-semibold">{author.statistics.activeRequests}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Выполнено заказов</p>
              <p className="font-semibold">{author.statistics.completedOrders}</p>
            </div>
            <div>
              <p className="text-muted-foreground">На платформе с</p>
              <p className="font-semibold">
                {author.statistics.registrationDate.toLocaleDateString('ru-RU', {
                  month: 'short',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate(`/seller/${author.id}`)}
        >
          Перейти к профилю
        </Button>
      </CardContent>
    </Card>
  );
}
