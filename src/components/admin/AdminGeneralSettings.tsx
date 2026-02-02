import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface AdminGeneralSettingsProps {
  maintenanceMode: boolean;
  setMaintenanceMode: (value: boolean) => void;
  handleSaveSettings: () => void;
}

export default function AdminGeneralSettings({ 
  maintenanceMode, 
  setMaintenanceMode, 
  handleSaveSettings 
}: AdminGeneralSettingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Основные настройки</CardTitle>
        <CardDescription>Настройка параметров площадки</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="platform-name">Название площадки</Label>
          <Input id="platform-name" defaultValue="Единая Региональная Товарно-Торговая Площадка" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="support-email">Email поддержки</Label>
          <Input id="support-email" type="email" defaultValue="support@platform.ru" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="support-phone">Телефон поддержки</Label>
          <Input id="support-phone" defaultValue="+7 (800) 555-35-35" />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="maintenance-mode">Режим обслуживания</Label>
            <p className="text-sm text-muted-foreground">
              Временно отключить доступ к площадке
            </p>
          </div>
          <Switch
            id="maintenance-mode"
            checked={maintenanceMode}
            onCheckedChange={setMaintenanceMode}
          />
        </div>
        <Button onClick={handleSaveSettings}>Сохранить изменения</Button>
      </CardContent>
    </Card>
  );
}
