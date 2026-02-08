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

        <div className="space-y-2">
          <p className="text-sm font-semibold">Отзывы</p>
          {author.reviewsCount > 0 ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate(`/seller/${author.id}#reviews`)}
            >
              Посмотреть все отзывы ({author.reviewsCount})
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">Пока нет отзывов</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}