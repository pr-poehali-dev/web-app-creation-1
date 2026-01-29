import { Link } from 'react-router-dom';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface ProfileListingsSectionProps {
  isViewingOwnProfile: boolean;
}

export default function ProfileListingsSection({ isViewingOwnProfile }: ProfileListingsSectionProps) {
  if (!isViewingOwnProfile) return null;

  return (
    <Card>
      <CardHeader>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Мои объявления</h3>
            <p className="text-sm text-muted-foreground">Управляйте своими предложениями и запросами</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Link to="/my-offers">
              <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                <Icon name="Package" className="h-4 w-4" />
                Мои предложения
              </Button>
            </Link>
            <Link to="/my-requests">
              <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                <Icon name="ShoppingBag" className="h-4 w-4" />
                Мои запросы
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
