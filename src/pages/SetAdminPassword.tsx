import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SetAdminPassword() {
  const [email, setEmail] = useState('doydum-invest@mail.ru');
  const [password, setPassword] = useState('123456');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSetPassword = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('https://functions.poehali.dev/610b38a1-b500-46fd-bf38-44134ee09404', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      setResult({ success: response.ok, data });
    } catch (error: any) {
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleTestLogin = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('https://functions.poehali.dev/fbbc018c-3522-4d56-bbb3-1ba113a4d213', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'login',
          email,
          password
        })
      });

      const data = await response.json();
      setResult({ success: response.ok, data, status: response.status });
    } catch (error: any) {
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Установка пароля администратора</CardTitle>
          <CardDescription>Инструмент для отладки проблемы с входом</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label>Пароль</Label>
              <Input 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password"
                type="text"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSetPassword} disabled={loading} className="flex-1">
                1. Установить пароль
              </Button>
              <Button onClick={handleTestLogin} disabled={loading} variant="secondary" className="flex-1">
                2. Проверить вход
              </Button>
            </div>
          </div>

          {result && (
            <div className={`rounded-lg border p-4 ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <h3 className="font-bold mb-2">
                {result.success ? '✅ Успешно' : '❌ Ошибка'}
              </h3>
              <pre className="text-xs overflow-auto max-h-96">
                {JSON.stringify(result, null, 2)}
              </pre>
              
              {result.success && result.data?.hash && (
                <div className="mt-4 p-3 bg-white rounded border">
                  <p className="font-bold text-sm mb-2">Теперь попробуйте войти:</p>
                  <p className="text-sm">Email: <code>{email}</code></p>
                  <p className="text-sm">Пароль: <code>{password}</code></p>
                  <a 
                    href="/admin" 
                    className="inline-block mt-2 text-blue-600 hover:underline"
                  >
                    → Перейти на страницу входа
                  </a>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
