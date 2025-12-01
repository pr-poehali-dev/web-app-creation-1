import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface ProfileStatsCardProps {
  registrationDate: string;
  formatDate: (date: string) => string;
}

export default function ProfileStatsCard({ registrationDate, formatDate }: ProfileStatsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Статистика аккаунта</CardTitle>
        <CardDescription>Информация о вашей активности</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center gap-3 p-4 border rounded-lg">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
              <Icon name="Calendar" className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Дата регистрации</p>
              <p className="font-semibold">{formatDate(registrationDate)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 border rounded-lg">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
              <Icon name="Package" className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Активных предложений</p>
              <p className="font-semibold">2</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 border rounded-lg">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10">
              <Icon name="FileText" className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Активных запросов</p>
              <p className="font-semibold">1</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 border rounded-lg">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/10">
              <Icon name="ShoppingCart" className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Завершенных заказов</p>
              <p className="font-semibold">5</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
