import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface ChatMessage {
  id: string;
  orderId: string;
  orderNumber: string;
  buyerName: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
}

interface OfferMessagesTabProps {
  messages: ChatMessage[];
  onMessageClick: (orderId: string) => void;
}

export default function OfferMessagesTab({ messages, onMessageClick }: OfferMessagesTabProps) {
  if (messages.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Icon name="MessageSquare" className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Нет сообщений</h3>
          <p className="text-muted-foreground">
            Сообщения от заказчиков будут отображаться здесь
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {messages.map((message) => (
        <Card 
          key={message.id} 
          className={`cursor-pointer hover:shadow-lg transition-shadow ${!message.isRead ? 'border-primary' : ''}`}
          onClick={() => onMessageClick(message.orderId)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Icon name="User" className="w-4 h-4 text-muted-foreground" />
                  <span className="font-semibold">{message.buyerName}</span>
                  {!message.isRead && (
                    <Badge variant="destructive" className="h-5">Новое</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Заказ: {message.orderNumber}
                </p>
                <p className="text-sm mt-2">{message.message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {message.timestamp.toLocaleString('ru-RU', { timeZone: 'Asia/Yakutsk' })}
                </p>
              </div>
              <Button size="sm" variant="outline">
                <Icon name="Send" className="w-4 h-4 mr-2" />
                Ответить
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}