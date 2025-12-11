import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface AuctionCompletionFormProps {
  auctionId: string;
  winnerName: string;
  winnerId: string;
  winningBid: number;
  isWinner: boolean;
  isSeller: boolean;
}

export default function AuctionCompletionForm({
  auctionId,
  winnerName,
  winnerId,
  winningBid,
  isWinner,
  isSeller,
}: AuctionCompletionFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    phone: '',
    email: '',
    address: '',
    preferredTime: '',
    notes: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [contactsReceived, setContactsReceived] = useState<any>(null);

  useEffect(() => {
    const checkReceivedContacts = () => {
      const keyToCheck = isWinner 
        ? `auction_contact_${auctionId}_seller`
        : `auction_contact_${auctionId}_winner`;
      
      const storedData = localStorage.getItem(keyToCheck);
      if (storedData) {
        setContactsReceived(JSON.parse(storedData));
      }
    };

    checkReceivedContacts();
    const interval = setInterval(checkReceivedContacts, 2000);

    return () => clearInterval(interval);
  }, [auctionId, isWinner]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const myKey = `auction_contact_${auctionId}_${isWinner ? 'winner' : 'seller'}`;
    localStorage.setItem(myKey, JSON.stringify({
      ...formData,
      submittedAt: new Date().toISOString(),
      role: isWinner ? 'winner' : 'seller',
    }));

    setIsSubmitted(true);
    toast({
      title: 'Успешно!',
      description: isWinner 
        ? 'Ваши контакты отправлены продавцу' 
        : 'Ваши контакты отправлены победителю',
    });
  };

  if (isSubmitted || contactsReceived) {
    return (
      <div className="space-y-3">
        {isSubmitted && (
          <Card className="border-green-500/50 bg-green-50/50 dark:bg-green-950/20">
            <CardContent className="py-4 md:py-6">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                  <Icon name="CheckCircle" className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm md:text-base mb-1">Контакты отправлены</h3>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    {isWinner 
                      ? 'Продавец свяжется с вами для передачи товара'
                      : 'Победитель получил ваши контакты'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {contactsReceived && (
          <Card className="border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20">
            <CardHeader className="py-3 md:py-4">
              <CardTitle className="text-sm md:text-base flex items-center gap-2">
                <Icon name="User" className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
                {isWinner ? 'Контакты продавца' : 'Контакты победителя'}
              </CardTitle>
            </CardHeader>
            <CardContent className="py-3 md:py-4 space-y-2">
              {contactsReceived.phone && (
                <div className="flex items-center gap-2">
                  <Icon name="Phone" className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${contactsReceived.phone}`} className="text-sm md:text-base font-medium text-blue-600 hover:underline">
                    {contactsReceived.phone}
                  </a>
                </div>
              )}
              {contactsReceived.email && (
                <div className="flex items-center gap-2">
                  <Icon name="Mail" className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${contactsReceived.email}`} className="text-sm md:text-base font-medium text-blue-600 hover:underline">
                    {contactsReceived.email}
                  </a>
                </div>
              )}
              {contactsReceived.address && (
                <div className="flex items-start gap-2">
                  <Icon name="MapPin" className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <p className="text-xs md:text-sm text-muted-foreground">{contactsReceived.address}</p>
                </div>
              )}
              {contactsReceived.preferredTime && (
                <div className="flex items-start gap-2">
                  <Icon name="Clock" className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <p className="text-xs md:text-sm text-muted-foreground">{contactsReceived.preferredTime}</p>
                </div>
              )}
              {contactsReceived.notes && (
                <div className="flex items-start gap-2 pt-2 border-t">
                  <Icon name="MessageSquare" className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <p className="text-xs md:text-sm text-muted-foreground">{contactsReceived.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  if (!isWinner && !isSeller) {
    return null;
  }

  return (
    <Card className="border-primary/50">
      <CardHeader className="py-3 md:py-4">
        <CardTitle className="text-sm md:text-base flex items-center gap-2">
          <Icon name="Trophy" className="h-4 w-4 md:h-5 md:w-5 text-yellow-500" />
          {isWinner ? 'Поздравляем! Вы победили' : 'Аукцион завершен'}
        </CardTitle>
      </CardHeader>
      <CardContent className="py-3 md:py-4 space-y-3 md:space-y-4">
        <div className="bg-muted p-3 rounded-lg space-y-2 text-xs md:text-sm">
          {isWinner && (
            <>
              <p className="text-muted-foreground">
                Ваша ставка: <span className="font-bold text-foreground">{winningBid.toLocaleString('ru-RU')} ₽</span>
              </p>
              <p className="text-muted-foreground">
                Укажите ваши контакты для связи с продавцом и передачи товара
              </p>
            </>
          )}
          {isSeller && (
            <>
              <p className="text-muted-foreground">
                Победитель: <span className="font-semibold text-foreground">{winnerName}</span>
              </p>
              <p className="text-muted-foreground">
                Финальная цена: <span className="font-bold text-foreground">{winningBid.toLocaleString('ru-RU')} ₽</span>
              </p>
              <p className="text-muted-foreground">
                Укажите контакты для связи с победителем
              </p>
            </>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-xs md:text-sm">
              Телефон <span className="text-destructive">*</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+7 (___) ___-__-__"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
              className="text-xs md:text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs md:text-sm">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="example@mail.ru"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="text-xs md:text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address" className="text-xs md:text-sm">
              {isWinner ? 'Адрес для доставки' : 'Адрес для встречи'}
            </Label>
            <Input
              id="address"
              type="text"
              placeholder="Укажите адрес"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="text-xs md:text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="preferredTime" className="text-xs md:text-sm">
              Удобное время для связи
            </Label>
            <Input
              id="preferredTime"
              type="text"
              placeholder="Например: будни после 18:00"
              value={formData.preferredTime}
              onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
              className="text-xs md:text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-xs md:text-sm">
              Дополнительная информация
            </Label>
            <Textarea
              id="notes"
              placeholder="Любые пожелания или комментарии"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="text-xs md:text-sm resize-none"
            />
          </div>

          <Button type="submit" className="w-full text-xs md:text-sm">
            <Icon name="Send" className="h-4 w-4 mr-2" />
            {isWinner ? 'Отправить контакты продавцу' : 'Отправить контакты победителю'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}