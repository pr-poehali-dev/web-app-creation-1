import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface TransportWaypoint {
  id: string;
  address: string;
  price?: number;
  isActive: boolean;
}

interface TransportSectionProps {
  isFreight: boolean;
  passengerRoute: string;
  offerTransportRoute?: string;
  offerTransportWaypoints: TransportWaypoint[];
  selectedWaypoint: string;
  customPickupAddress: string;
  pricePerUnit: number;
  onWaypointChange: (waypoint: string, route: string) => void;
  onPassengerRouteChange: (route: string) => void;
  onPickupMapOpen: () => void;
}

export default function TransportSection({
  isFreight,
  passengerRoute,
  offerTransportRoute,
  offerTransportWaypoints,
  selectedWaypoint,
  customPickupAddress,
  pricePerUnit,
  onWaypointChange,
  onPassengerRouteChange,
  onPickupMapOpen,
}: TransportSectionProps) {
  const activeWaypoints = offerTransportWaypoints.filter(w => w.isActive);

  if (isFreight) {
    return (
      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="freight-pickup">Адрес загрузки</Label>
          <div className="flex gap-2">
            <Input
              id="freight-pickup"
              value={customPickupAddress}
              placeholder="Выберите на карте"
              className="flex-1 cursor-pointer"
              readOnly
              onClick={onPickupMapOpen}
            />
            <Button type="button" variant="outline" size="icon" onClick={onPickupMapOpen} title="Выбрать на карте">
              <Icon name="Map" size={16} />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {passengerRoute && passengerRoute !== offerTransportRoute && (
        <div className="rounded-md bg-green-50 dark:bg-green-950/30 border-2 border-green-500 px-3 py-2">
          <p className="text-xs text-muted-foreground">Ваш маршрут</p>
          <p className="text-base font-bold text-foreground">{passengerRoute}</p>
        </div>
      )}

      {activeWaypoints.length > 0 && (
        <div className="space-y-2">
          <Label>Пункт посадки</Label>
          <div className="space-y-1.5">
            <label
              className={`flex items-center gap-2 cursor-pointer rounded-md border p-2.5 transition-colors ${
                selectedWaypoint === ''
                  ? 'border-2 border-green-500 bg-green-50 dark:bg-green-950/20'
                  : 'hover:bg-muted/40'
              }`}
            >
              <input
                type="radio"
                name="waypoint"
                value=""
                checked={selectedWaypoint === ''}
                onChange={() => onWaypointChange('', offerTransportRoute || '')}
                className="h-4 w-4"
              />
              <div className="flex-1 flex items-center justify-between">
                <span className="text-sm font-bold text-foreground">{offerTransportRoute}</span>
                <span className="ml-2 text-xs text-primary font-semibold">
                  {pricePerUnit.toLocaleString('ru-RU')} ₽
                </span>
              </div>
            </label>

            {activeWaypoints.map(wp => (
              <label
                key={wp.id}
                className={`flex items-center gap-2 cursor-pointer rounded-md border p-2.5 transition-colors ${
                  selectedWaypoint === wp.address
                    ? 'border-2 border-green-500 bg-green-50 dark:bg-green-950/20'
                    : 'hover:bg-muted/40'
                }`}
              >
                <input
                  type="radio"
                  name="waypoint"
                  value={wp.address}
                  checked={selectedWaypoint === wp.address}
                  onChange={() => {
                    const routeStart = offerTransportRoute?.split(/\s*[-–—]\s*/)[0]?.trim() || '';
                    const newRoute = routeStart ? `${routeStart} — ${wp.address}` : wp.address;
                    onWaypointChange(wp.address, newRoute);
                  }}
                  className="h-4 w-4"
                />
                <div className="flex-1">
                  <span className="text-sm font-bold text-foreground">{wp.address}</span>
                  {wp.price && (
                    <span className="ml-2 text-xs text-primary font-semibold">
                      {wp.price.toLocaleString('ru-RU')} ₽
                    </span>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {activeWaypoints.length === 0 && (
        <div className="space-y-2">
          <Label htmlFor="passenger-pickup">Адрес посадки</Label>
          <div className="flex gap-2">
            <Input
              id="passenger-pickup"
              value={customPickupAddress}
              placeholder="Выберите на карте"
              className="flex-1 cursor-pointer"
              readOnly
              onClick={onPickupMapOpen}
            />
            <Button type="button" variant="outline" size="icon" onClick={onPickupMapOpen} title="Выбрать на карте">
              <Icon name="Map" size={16} />
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="passenger-route">
          Ваш маршрут <span className="text-muted-foreground font-normal">(если отличается)</span>
        </Label>
        <Input
          id="passenger-route"
          value={selectedWaypoint && selectedWaypoint !== '__custom__' ? '' : passengerRoute}
          onChange={(e) => onPassengerRouteChange(e.target.value)}
          placeholder={offerTransportRoute || 'Например: Нюрба - Якутск'}
          disabled={!!(selectedWaypoint && selectedWaypoint !== '__custom__')}
        />
      </div>
    </div>
  );
}
