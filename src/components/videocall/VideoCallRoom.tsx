import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { getJitsiUrl } from '@/services/videoCallService';

interface VideoCallRoomProps {
  roomId: string;
  displayName: string;
  onClose: () => void;
}

export default function VideoCallRoom({ roomId, displayName, onClose }: VideoCallRoomProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<unknown>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    // Загружаем Jitsi Meet External API
    const scriptId = 'jitsi-api-script';
    const existingScript = document.getElementById(scriptId);

    const initJitsi = () => {
      if (!containerRef.current) return;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const JitsiMeetExternalAPI = (window as any).JitsiMeetExternalAPI;
        if (!JitsiMeetExternalAPI) {
          setLoadError(true);
          return;
        }

        apiRef.current = new JitsiMeetExternalAPI('meet.jit.si', {
          roomName: roomId,
          parentNode: containerRef.current,
          width: '100%',
          height: '100%',
          userInfo: { displayName },
          configOverwrite: {
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            enableWelcomePage: false,
            prejoinPageEnabled: false,
            disableDeepLinking: true,
          },
          interfaceConfigOverwrite: {
            TOOLBAR_BUTTONS: ['microphone', 'camera', 'hangup', 'chat', 'fullscreen', 'fodeviceselection'],
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            DEFAULT_REMOTE_DISPLAY_NAME: 'Собеседник',
            MOBILE_APP_PROMO: false,
          },
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (apiRef.current as any).addEventListeners({
          videoConferenceJoined: () => setIsLoading(false),
          readyToClose: () => onClose(),
        });
      } catch {
        setLoadError(true);
        setIsLoading(false);
      }
    };

    if (!existingScript) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://meet.jit.si/external_api.js';
      script.async = true;
      script.onload = initJitsi;
      script.onerror = () => { setLoadError(true); setIsLoading(false); };
      document.head.appendChild(script);
    } else {
      initJitsi();
    }

    return () => {
      if (apiRef.current) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (apiRef.current as any).dispose();
        } catch {
          // ignore
        }
      }
    };
  }, [roomId, displayName]);

  // Фоллбек — открыть в новой вкладке если iframe не загрузился
  const openExternal = () => {
    window.open(getJitsiUrl(roomId), '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9998] bg-black flex flex-col">
      {/* Шапка */}
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/90 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-white font-medium text-sm">Видеозвонок</span>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={openExternal}
            className="text-zinc-400 hover:text-white hover:bg-zinc-700 text-xs gap-1.5"
          >
            <Icon name="ExternalLink" className="h-3.5 w-3.5" />
            Открыть отдельно
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="text-zinc-400 hover:text-red-400 hover:bg-red-500/10 gap-1.5"
          >
            <Icon name="X" className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Контейнер Jitsi */}
      <div className="flex-1 relative">
        {isLoading && !loadError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-950">
            <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center">
              <Icon name="Video" className="h-8 w-8 text-green-400 animate-pulse" />
            </div>
            <p className="text-zinc-400 text-sm">Подключаемся к звонку...</p>
          </div>
        )}
        {loadError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-950">
            <Icon name="VideoOff" className="h-12 w-12 text-zinc-600" />
            <p className="text-zinc-300 font-medium">Не удалось загрузить видеозвонок</p>
            <Button onClick={openExternal} className="bg-green-600 hover:bg-green-700 gap-2">
              <Icon name="ExternalLink" className="h-4 w-4" />
              Открыть в новой вкладке
            </Button>
          </div>
        )}
        <div ref={containerRef} className="w-full h-full" />
      </div>
    </div>
  );
}
