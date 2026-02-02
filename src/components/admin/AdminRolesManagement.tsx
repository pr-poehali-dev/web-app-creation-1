import { useEffect } from 'react';
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
  foundUser: any;
  isSearchingUser: boolean;
  handleSearchUser: (email: string) => void;
}

export default function AdminRolesManagement({
  adminsList,
  isLoadingAdmins,
  newAdminEmail,
  setNewAdminEmail,
  newAdminRole,
  setNewAdminRole,
  isSettingRole,
  handleSetRole,
  foundUser,
  isSearchingUser,
  handleSearchUser
}: AdminRolesManagementProps) {
  const isRootAdmin = localStorage.getItem('isRootAdmin') === 'true';

  // Автоматический поиск пользователя с debounce
  useEffect(() => {
    if (newAdminEmail.includes('@') && newAdminEmail.length > 5) {
      const debounceTimer = setTimeout(() => {
        handleSearchUser(newAdminEmail);
      }, 800);
      return () => clearTimeout(debounceTimer);
    }
  }, [newAdminEmail]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Управление администраторами</CardTitle>
        <CardDescription>
          Назначайте и снимайте роли администраторов. Доступные роли: Модератор, Администратор, Суперадминистратор
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 p-4 rounded-lg border-2 border-yellow-400">
          <div className="flex items-start gap-3">
            <div className="relative mt-1">
              <Icon name="Crown" className="h-6 w-6 text-yellow-600" />
              <Icon name="Shield" className="h-3 w-3 text-yellow-600 absolute -bottom-1 -right-1" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-1 flex items-center gap-2">
                Главный Суперадминистратор
                <span className="text-xs bg-yellow-500 text-white px-2 py-0.5 rounded-full">ЗАЩИЩЁН</span>
              </h4>
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                Только главный суперадминистратор может назначать и снимать роли других администраторов.
                Роль главного суперадминистратора не может быть изменена никем, включая самого владельца.
              </p>
            </div>
          </div>
        </div>

        {!isRootAdmin && (
          <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border-2 border-red-400">
            <div className="flex items-start gap-3">
              <Icon name="ShieldAlert" className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-900 dark:text-red-200 mb-1">
                  Доступ ограничен
                </h4>
                <p className="text-sm text-red-800 dark:text-red-300">
                  Только главный суперадминистратор может назначать и изменять роли администраторов.
                  Вы можете просматривать список администраторов, но не можете вносить изменения.
                </p>
              </div>
            </div>
          </div>
        )}

        {isRootAdmin && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email пользователя</Label>
              <div className="relative">
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="user@example.com"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                />
                {isSearchingUser && (
                  <Icon name="Loader2" className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {foundUser && (
                <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon name="CheckCircle2" className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-900 dark:text-green-200">Пользователь найден</span>
                  </div>
                  <p className="text-sm text-green-800 dark:text-green-300">
                    {foundUser.first_name} {foundUser.last_name} {foundUser.middle_name || ''}
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                    Текущая роль: {
                      foundUser.role === 'superadmin' ? 'Суперадминистратор' :
                      foundUser.role === 'admin' ? 'Администратор' :
                      foundUser.role === 'moderator' ? 'Модератор' :
                      'Пользователь'
                    }
                  </p>
                </div>
              )}
              {!foundUser && !isSearchingUser && newAdminEmail.includes('@') && (
                <p className="text-sm text-muted-foreground">
                  Введите полный email адрес для поиска пользователя
                </p>
              )}
              {!foundUser && !isSearchingUser && !newAdminEmail.includes('@') && (
                <p className="text-sm text-muted-foreground">
                  Введите email зарегистрированного пользователя
                </p>
              )}
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
        )}

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
                  className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                    admin.is_root_admin 
                      ? 'bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 border-yellow-400' 
                      : 'hover:bg-accent/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {admin.is_root_admin ? (
                      <div className="relative">
                        <Icon name="Crown" className="h-6 w-6 text-yellow-600 animate-pulse" />
                        <Icon name="Shield" className="h-3 w-3 text-yellow-600 absolute -bottom-1 -right-1" />
                      </div>
                    ) : admin.role === 'superadmin' ? (
                      <Icon name="Crown" className="h-5 w-5 text-yellow-500" />
                    ) : admin.role === 'admin' ? (
                      <Icon name="ShieldCheck" className="h-5 w-5 text-purple-500" />
                    ) : (
                      <Icon name="Eye" className="h-5 w-5 text-blue-500" />
                    )}
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        {admin.first_name} {admin.last_name}
                        {admin.is_root_admin && (
                          <span className="text-xs bg-yellow-500 text-white px-2 py-0.5 rounded-full font-semibold">
                            ГЛАВНЫЙ
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">{admin.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {admin.is_root_admin && 'Главный Суперадминистратор'}
                      {!admin.is_root_admin && admin.role === 'superadmin' && 'Суперадминистратор'}
                      {admin.role === 'admin' && 'Администратор'}
                      {admin.role === 'moderator' && 'Модератор'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(admin.created_at).toLocaleDateString('ru-RU')}
                    </p>
                    {admin.is_root_admin && (
                      <p className="text-xs text-yellow-600 font-medium mt-1">
                        Не может быть изменён
                      </p>
                    )}
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