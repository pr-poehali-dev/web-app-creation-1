import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';

interface AdminRolesManagementProps {
  adminsList: any[];
  isLoadingAdmins: boolean;
  newAdminEmail: string;
  setNewAdminEmail: (value: string) => void;
  newAdminRole: 'moderator' | 'admin' | 'superadmin';
  setNewAdminRole: (value: 'moderator' | 'admin' | 'superadmin') => void;
  isSettingRole: boolean;
  handleSetRole: () => void;
}

export default function AdminRolesManagement({
  adminsList,
  isLoadingAdmins,
  newAdminEmail,
  setNewAdminEmail,
  newAdminRole,
  setNewAdminRole,
  isSettingRole,
  handleSetRole
}: AdminRolesManagementProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Управление администраторами</CardTitle>
        <CardDescription>
          Назначайте и снимайте роли администраторов. Доступные роли: Модератор, Администратор, Суперадминистратор
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-email">Email пользователя</Label>
            <Input
              id="admin-email"
              type="email"
              placeholder="user@example.com"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Введите email зарегистрированного пользователя
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-role">Роль</Label>
            <Select value={newAdminRole} onValueChange={(v) => setNewAdminRole(v as typeof newAdminRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">
                  <div className="flex items-center gap-2">
                    <Icon name="User" className="h-4 w-4" />
                    Пользователь (снять роль администратора)
                  </div>
                </SelectItem>
                <SelectItem value="moderator">
                  <div className="flex items-center gap-2">
                    <Icon name="Eye" className="h-4 w-4 text-blue-500" />
                    Модератор
                  </div>
                </SelectItem>
                <SelectItem value="admin">
                  <div className="flex items-center gap-2">
                    <Icon name="ShieldCheck" className="h-4 w-4 text-purple-500" />
                    Администратор
                  </div>
                </SelectItem>
                <SelectItem value="superadmin">
                  <div className="flex items-center gap-2">
                    <Icon name="Crown" className="h-4 w-4 text-yellow-500" />
                    Суперадминистратор
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Icon name="Info" className="h-4 w-4" />
              Права доступа:
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1 ml-6">
              <li><strong>Модератор:</strong> Проверка и модерация контента, управление объявлениями</li>
              <li><strong>Администратор:</strong> Управление пользователями, настройка системы</li>
              <li><strong>Суперадминистратор:</strong> Полный доступ + управление другими администраторами</li>
            </ul>
          </div>

          <Button 
            onClick={handleSetRole} 
            disabled={isSettingRole || !newAdminEmail.trim()}
            className="w-full"
          >
            {isSettingRole ? (
              <>
                <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                Изменение роли...
              </>
            ) : (
              <>
                <Icon name="UserCog" className="mr-2 h-4 w-4" />
                Назначить роль
              </>
            )}
          </Button>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Текущие администраторы</h3>
          {isLoadingAdmins ? (
            <div className="flex justify-center py-8">
              <Icon name="Loader2" className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : adminsList.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Нет администраторов</p>
          ) : (
            <div className="space-y-3">
              {adminsList.map((admin) => (
                <div
                  key={admin.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {admin.role === 'superadmin' && (
                      <Icon name="Crown" className="h-5 w-5 text-yellow-500" />
                    )}
                    {admin.role === 'admin' && (
                      <Icon name="ShieldCheck" className="h-5 w-5 text-purple-500" />
                    )}
                    {admin.role === 'moderator' && (
                      <Icon name="Eye" className="h-5 w-5 text-blue-500" />
                    )}
                    <div>
                      <p className="font-medium">
                        {admin.first_name} {admin.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">{admin.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {admin.role === 'superadmin' && 'Суперадминистратор'}
                      {admin.role === 'admin' && 'Администратор'}
                      {admin.role === 'moderator' && 'Модератор'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(admin.created_at).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
