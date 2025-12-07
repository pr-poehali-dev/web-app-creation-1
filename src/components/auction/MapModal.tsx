import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';

function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
  coordinates: string;
  onCoordinatesChange: (coords: string) => void;
}

export default function MapModal({ isOpen, onClose, coordinates, onCoordinatesChange }: MapModalProps) {
  const [mapCenter, setMapCenter] = useState<[number, number]>([41.2995, 69.2401]);
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (coordinates) {
      const [lat, lng] = coordinates.split(',').map(c => parseFloat(c.trim()));
      if (!isNaN(lat) && !isNaN(lng)) {
        setMapCenter([lat, lng]);
        setMarkerPosition([lat, lng]);
      }
    }
  }, [coordinates]);

  const handleMapClick = (lat: number, lng: number) => {
    const coords = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    onCoordinatesChange(coords);
    setMarkerPosition([lat, lng]);
  };

  const handleInputChange = (value: string) => {
    onCoordinatesChange(value);
    const [lat, lng] = value.split(',').map(c => parseFloat(c.trim()));
    if (!isNaN(lat) && !isNaN(lng)) {
      setMapCenter([lat, lng]);
      setMarkerPosition([lat, lng]);
    }
  };

  const handleUseMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`;
          onCoordinatesChange(coords);
          setMapCenter([position.coords.latitude, position.coords.longitude]);
          setMarkerPosition([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error('Ошибка получения координат:', error);
        }
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-background rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Укажите местонахождение</h3>
          <button onClick={onClose} className="p-1 hover:bg-accent rounded-md">
            <Icon name="X" className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div className="h-[400px] rounded-lg overflow-hidden border">
            <MapContainer
              center={mapCenter}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapClickHandler onLocationSelect={handleMapClick} />
              {markerPosition && (
                <Marker 
                  position={markerPosition}
                  icon={L.icon({
                    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                  })}
                />
              )}
            </MapContainer>
          </div>
          <p className="text-sm text-muted-foreground">
            Нажмите на карте, чтобы указать местонахождение
          </p>
          <div>
            <Label htmlFor="mapCoordinates">Или введите координаты вручную</Label>
            <Input
              id="mapCoordinates"
              value={coordinates}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Например: 41.2995, 69.2401"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Формат: широта, долгота
            </p>
          </div>
          <button
            type="button"
            onClick={handleUseMyLocation}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <Icon name="MapPin" className="h-4 w-4" />
            Использовать мое местоположение
          </button>
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md hover:bg-accent transition-colors"
            >
              Готово
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
