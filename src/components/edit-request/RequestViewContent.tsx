import Icon from '@/components/ui/icon';
import type { Request } from '@/types/offer';

interface RequestViewContentProps {
  request: Request;
  isTransport: boolean;
}

export default function RequestViewContent({ request, isTransport }: RequestViewContentProps) {
  const currentImages = (request.images || []).map(img => img.url);
  const currentVideo = request.video?.url;

  return (
    <>
      <p className="text-muted-foreground">{request.description}</p>

      {currentImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {currentImages.map((url, idx) => (
            <img
              key={idx}
              src={url}
              alt={`${request.title} ${idx + 1}`}
              className="w-full h-32 object-cover rounded-lg border"
            />
          ))}
        </div>
      )}

      {currentVideo && (
        <video
          src={currentVideo}
          controls
          className="w-full max-h-64 rounded-lg border"
        />
      )}

      {isTransport && (request.transportRoute || request.transportServiceType || request.transportType) && (
        <div className="bg-muted/40 rounded-lg p-3 space-y-2">
          {request.transportServiceType && (
            <div className="flex items-center gap-2">
              <Icon name="Truck" className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Тип услуги</p>
                <p className="font-medium text-sm">{request.transportServiceType}</p>
              </div>
            </div>
          )}
          {request.transportRoute && (
            <div className="flex items-center gap-2">
              <Icon name="Route" className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Маршрут</p>
                <p className="font-medium text-sm">{request.transportRoute}</p>
              </div>
            </div>
          )}
          {request.transportType && (
            <div className="flex items-center gap-2">
              <Icon name="Car" className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Тип транспорта</p>
                <p className="font-medium text-sm">{request.transportType}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {isTransport && (request.transportDepartureDateTime || request.transportDateTime) && (
        <div className="flex items-center gap-2">
          <Icon name="CalendarClock" className="w-5 h-5 text-muted-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">Желаемая дата и время выезда</p>
            <p className="font-medium">
              {new Date(request.transportDepartureDateTime || request.transportDateTime!).toLocaleString('ru-RU', {
                day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
