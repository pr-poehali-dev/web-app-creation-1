import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import type { InlineChatMessage } from './useOrderForm';

interface OrderInlineChatProps {
  createdOrderId: string;
  chatMessages: InlineChatMessage[];
  chatText: string;
  isSendingMessage: boolean;
  chatScrollRef: React.RefObject<HTMLDivElement>;
  onChatTextChange: (value: string) => void;
  onSend: () => void;
  onClose: () => void;
}

export default function OrderInlineChat({
  createdOrderId,
  chatMessages,
  chatText,
  isSendingMessage,
  chatScrollRef,
  onChatTextChange,
  onSend,
  onClose,
}: OrderInlineChatProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-semibold text-green-700">
        <Icon name="CheckCircle2" size={16} className="text-green-600" />
        Обсуждение заказа
      </div>
      <div
        ref={chatScrollRef}
        className="h-36 overflow-y-auto space-y-2 bg-muted/30 rounded-lg p-2"
      >
        {chatMessages.length === 0 && (
          <p className="text-xs text-muted-foreground text-center pt-10">
            Начните переписку с продавцом
          </p>
        )}
        {chatMessages.map(msg => (
          <div key={msg.id} className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg px-3 py-1.5 text-xs ${msg.isOwn ? 'bg-primary text-primary-foreground' : 'bg-white border text-foreground'}`}>
              {!msg.isOwn && <p className="text-[10px] font-semibold opacity-60 mb-0.5">{msg.senderName}</p>}
              <p className="whitespace-pre-wrap break-words">{msg.text}</p>
              <p className={`text-[10px] mt-0.5 ${msg.isOwn ? 'opacity-60' : 'text-muted-foreground'}`}>
                {msg.timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={chatText}
          onChange={e => onChatTextChange(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } }}
          placeholder="Написать продавцу..."
          className="text-sm h-9"
          disabled={isSendingMessage}
        />
        <Button
          type="button"
          size="sm"
          className="h-9 px-3"
          onClick={onSend}
          disabled={!chatText.trim() || isSendingMessage}
        >
          <Icon name="Send" size={15} />
        </Button>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full text-xs"
        onClick={() => { onClose(); navigate(`/my-orders?tab=buyer&orderId=${createdOrderId}`); }}
      >
        <Icon name="ExternalLink" size={13} className="mr-1.5" />
        Перейти к заказу
      </Button>
    </div>
  );
}