import { useNavigate } from 'react-router-dom';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface ProfileQuickActionsProps {
  isViewingOwnProfile: boolean;
  isChangingPassword: boolean;
  onChangePassword: () => void;
  onCancelChangePassword: () => void;
}

export default function ProfileQuickActions({
  isViewingOwnProfile,
  isChangingPassword,
  onChangePassword,
  onCancelChangePassword,
}: ProfileQuickActionsProps) {
  const navigate = useNavigate();

  if (!isViewingOwnProfile) return null;

  return (
    <Card>
      <CardHeader>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Быстрые действия</h3>
            <p className="text-sm text-muted-foreground">Управление активностью</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
              onClick={() => navigate('/my-orders')}
            >
              <Icon name="ShoppingCart" className="h-4 w-4" />
              Мои заказы
            </Button>
            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
              onClick={() => navigate('/my-listings')}
            >
              <Icon name="LayoutList" className="h-4 w-4" />
              Все объявления
            </Button>
          </div>
          <div className="pt-3 border-t">
            {!isChangingPassword ? (
              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
                onClick={onChangePassword}
              >
                <Icon name="Lock" className="h-4 w-4" />
                Сменить пароль
              </Button>
            ) : (
              <Button
                variant="ghost"
                className="w-full flex items-center justify-center gap-2"
                onClick={onCancelChangePassword}
              >
                <Icon name="X" className="h-4 w-4" />
                Отменить смену пароля
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
