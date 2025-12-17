import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { offersAPI } from '@/services/api';
import Icon from '@/components/ui/icon';

export default function DeleteTestData() {
  const [status, setStatus] = useState<'idle' | 'deleting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    deleteTestOffers();
  }, []);

  const deleteTestOffers = async () => {
    const testOfferIds = [
      'a235d4f8-c303-40f2-8aa3-b1adf798bb37',
      '448c6586-8611-4f06-887e-d984653f8fd2'
    ];

    console.log('🗑️ Начинаем удаление тестовых предложений:', testOfferIds);
    setStatus('deleting');
    setMessage('Удаление тестовых предложений...');

    try {
      let deletedCount = 0;
      const results = [];

      for (const offerId of testOfferIds) {
        try {
          console.log(`Удаляем предложение: ${offerId}`);
          await offersAPI.updateOffer(offerId, { status: 'deleted' });
          deletedCount++;
          results.push(`✅ Удалено: ${offerId}`);
          console.log(`✅ Успешно удалено: ${offerId}`);
        } catch (err: any) {
          console.error(`❌ Ошибка при удалении ${offerId}:`, err);
          results.push(`❌ Ошибка: ${offerId} - ${err.message}`);
        }
      }

      if (deletedCount > 0) {
        setStatus('success');
        setMessage(`Успешно удалено ${deletedCount} из ${testOfferIds.length} предложений\n\n${results.join('\n')}`);
      } else {
        setStatus('error');
        setMessage(`Не удалось удалить предложения\n\n${results.join('\n')}`);
      }
    } catch (error: any) {
      setStatus('error');
      setMessage(`Ошибка: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="Trash2" className="h-6 w-6" />
            Удаление тестовых данных
          </CardTitle>
          <CardDescription>
            Автоматическое удаление тестовых предложений "Тест2" и "Мясо Тест"
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'idle' && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Icon name="Loader2" className="h-5 w-5 animate-spin" />
              <span>Инициализация...</span>
            </div>
          )}

          {status === 'deleting' && (
            <div className="flex items-center gap-2 text-blue-600">
              <Icon name="Loader2" className="h-5 w-5 animate-spin" />
              <span>{message}</span>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-600 font-semibold">
                <Icon name="CheckCircle" className="h-5 w-5" />
                <span>Успешно выполнено!</span>
              </div>
              <pre className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap">
                {message}
              </pre>
              <p className="text-sm text-muted-foreground">
                Предложения удалены. Обновите страницу /predlozheniya чтобы увидеть изменения.
              </p>
              <div className="flex gap-2">
                <Button onClick={() => window.location.href = '/predlozheniya'}>
                  <Icon name="ArrowRight" className="mr-2 h-4 w-4" />
                  Перейти к предложениям
                </Button>
                <Button variant="outline" onClick={deleteTestOffers}>
                  <Icon name="RotateCcw" className="mr-2 h-4 w-4" />
                  Повторить
                </Button>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-red-600 font-semibold">
                <Icon name="AlertCircle" className="h-5 w-5" />
                <span>Произошла ошибка</span>
              </div>
              <pre className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap text-red-600">
                {message}
              </pre>
              <Button variant="outline" onClick={deleteTestOffers}>
                <Icon name="RotateCcw" className="mr-2 h-4 w-4" />
                Попробовать снова
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}