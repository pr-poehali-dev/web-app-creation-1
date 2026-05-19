import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import {
  getRoomId,
  sendCallNotification,
  storeIncomingCall,
  getCurrentUserName,
} from '@/services/videoCallService';
import { getSession } from '@/utils/auth';
import VideoCallRoom from './VideoCallRoom';

interface VideoCallButtonProps {
  orderId: string;
  otherUserId: string;
  disabled?: boolean;
}

export default function VideoCallButton({ orderId, otherUserId, disabled }: VideoCallButtonProps) {
  const [calling, setCalling] = useState(false);
  const [inCall, setInCall] = useState(false);
  const { toast } = useToast();

  const session = getSession();
  const roomId = getRoomId(orderId);
  const callerName = getCurrentUserName();

  const handleCall = async () => {
    if (!session?.id) {
      toast({ title: 'Необходима авторизация', variant: 'destructive' });
      return;
    }

    setCalling(true);

    // Уведомляем второго участника через push
    const payload = {
      orderId,
      callerId: String(session.id),
      callerName,
      roomId,
      type: 'incoming_call' as const,
    };

    const sent = await sendCallNotification(otherUserId, payload);

    // Если собеседник на том же устройстве/браузере — показываем алерт напрямую
    storeIncomingCall(payload);

    setCalling(false);

    if (!sent) {
      toast({
        title: 'Звонок инициирован',
        description: 'Собеседник получит уведомление при следующем открытии сайта',
      });
    } else {
      toast({
        title: '📞 Звонок отправлен',
        description: 'Ожидаем ответа собеседника...',
      });
    }

    // Открываем комнату для инициатора
    setInCall(true);
  };

  const handleCloseRoom = () => {
    setInCall(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleCall}
        disabled={disabled || calling}
        className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-md border border-input bg-background hover:bg-green-50 hover:border-green-400 transition-colors disabled:opacity-50 group"
        title="Видеозвонок"
      >
        {calling ? (
          <Icon name="Loader2" className="h-4 w-4 text-green-500 animate-spin" />
        ) : (
          <Icon name="Video" className="h-4 w-4 text-muted-foreground group-hover:text-green-500 transition-colors" />
        )}
      </button>

      {inCall && (
        <VideoCallRoom
          roomId={roomId}
          displayName={callerName}
          onClose={handleCloseRoom}
        />
      )}
    </>
  );
}
