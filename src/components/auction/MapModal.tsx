import { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import MapSearchBar from './map/MapSearchBar';
import { geocodeCoordinates } from './map/useMapGeocoding';
import { createDraggableMarker, updateMarkerPosition } from './map/MapMarker';

interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
  coordinates: string;
  onCoordinatesChange: (coords: string) => void;
  onAddressChange?: (address: string, district: string) => void;
}

export default function MapModal({ isOpen, onClose, coordinates, onCoordinatesChange, onAddressChange }: MapModalProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([41.2995, 69.2401]);

  useEffect(() => {
    if (coordinates) {
      const [lat, lng] = coordinates.split(',').map(c => parseFloat(c.trim()));
      if (!isNaN(lat) && !isNaN(lng)) {
        setMapCenter([lat, lng]);
      }
    } else if (isOpen && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter([position.coords.latitude, position.coords.longitude]);
        },
        () => {
          setMapCenter([41.2995, 69.2401]);
        }
      );
    }
  }, [coordinates, isOpen]);

  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
      markerRef.current = null;
    }

    if (!mapRef.current) {
      setTimeout(() => {
        if (!mapContainerRef.current) return;
        const map = L.map(mapContainerRef.current).setView(mapCenter, 13);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      map.on('click', async (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        const coords = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        console.log('🗺️ MAP CLICK:', coords);
        onCoordinatesChange(coords);

        if (onAddressChange) {
          console.log('🔄 Fetching address from Nominatim...');
          try {
            const result = await geocodeCoordinates(lat, lng, '📍');
            onAddressChange(result.fullAddress, result.district);
          } catch (error) {
            console.error('Ошибка получения адреса:', error);
          }
        }

        if (markerRef.current) {
          updateMarkerPosition(markerRef.current, lat, lng);
        } else {
          markerRef.current = createDraggableMarker(map, lat, lng, async (dragLat, dragLng) => {
            const dragCoords = `${dragLat.toFixed(6)}, ${dragLng.toFixed(6)}`;
            onCoordinatesChange(dragCoords);
            
            if (onAddressChange) {
              try {
                const result = await geocodeCoordinates(dragLat, dragLng, '🔄 Drag:');
                onAddressChange(result.fullAddress, result.district);
              } catch (error) {
                console.error('Ошибка получения адреса:', error);
              }
            }
          });
        }
      });

        mapRef.current = map;
        
        if (coordinates) {
          const [lat, lng] = coordinates.split(',').map(c => parseFloat(c.trim()));
          if (!isNaN(lat) && !isNaN(lng)) {
            markerRef.current = createDraggableMarker(map, lat, lng, async (dragLat, dragLng) => {
              const dragCoords = `${dragLat.toFixed(6)}, ${dragLng.toFixed(6)}`;
              onCoordinatesChange(dragCoords);
              
              if (onAddressChange) {
                try {
                  const result = await geocodeCoordinates(dragLat, dragLng);
                  onAddressChange(result.fullAddress, result.district);
                } catch (error) {
                  console.error('Ошибка получения адреса:', error);
                }
              }
            });
          }
        }

        setTimeout(() => {
          map.invalidateSize();
        }, 100);
      }, 100);
    }
  }, [isOpen, mapCenter, coordinates, onCoordinatesChange, onAddressChange]);

  const handleInputChange = async (value: string) => {
    onCoordinatesChange(value);
    const [lat, lng] = value.split(',').map(c => parseFloat(c.trim()));
    if (!isNaN(lat) && !isNaN(lng)) {
      setMapCenter([lat, lng]);
      
      if (onAddressChange) {
        try {
          const result = await geocodeCoordinates(lat, lng);
          onAddressChange(result.fullAddress, result.district);
        } catch (error) {
          console.error('Ошибка получения адреса:', error);
        }
      }
    }
  };

  const handleSearchSelect = async (lat: number, lng: number, displayName: string) => {
    console.log('🔍 Selected from search:', displayName);
    const coords = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    onCoordinatesChange(coords);
    setMapCenter([lat, lng]);

    if (mapRef.current) {
      mapRef.current.setView([lat, lng], 13);
      
      if (markerRef.current) {
        updateMarkerPosition(markerRef.current, lat, lng);
      } else {
        markerRef.current = createDraggableMarker(mapRef.current, lat, lng, async (dragLat, dragLng) => {
          const dragCoords = `${dragLat.toFixed(6)}, ${dragLng.toFixed(6)}`;
          onCoordinatesChange(dragCoords);
          
          if (onAddressChange) {
            try {
              const result = await geocodeCoordinates(dragLat, dragLng);
              onAddressChange(result.fullAddress, result.district);
            } catch (error) {
              console.error('Ошибка получения адреса:', error);
            }
          }
        });
      }
    }

    if (onAddressChange) {
      try {
        const result = await geocodeCoordinates(lat, lng, '🔍 Search:');
        onAddressChange(result.fullAddress, result.district);
      } catch (error) {
        console.error('Ошибка получения адреса:', error);
      }
    }
  };

  const handleGetCurrentLocation = () => {
    console.log('🎯 handleGetCurrentLocation вызван');
    console.log('🎯 onAddressChange существует:', !!onAddressChange);
    alert('🎯 Кнопка "Мое местоположение" нажата! onAddressChange=' + !!onAddressChange);
    const loadingMessage = 'Определяем ваше местоположение...';
    console.log(loadingMessage);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        console.log('✅ Геолокация получена:', position.coords);
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        console.log('📍 Координаты:', { lat, lng });
        const coords = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        onCoordinatesChange(coords);
        setMapCenter([lat, lng]);
          
          if (mapRef.current) {
            if (markerRef.current) {
              updateMarkerPosition(markerRef.current, lat, lng);
            } else {
              markerRef.current = createDraggableMarker(mapRef.current, lat, lng, async (dragLat, dragLng) => {
                const dragCoords = `${dragLat.toFixed(6)}, ${dragLng.toFixed(6)}`;
                onCoordinatesChange(dragCoords);
                
                if (onAddressChange) {
                  try {
                    const result = await geocodeCoordinates(dragLat, dragLng);
                    onAddressChange(result.fullAddress, result.district);
                  } catch (error) {
                    console.error('Ошибка получения адреса:', error);
                  }
                }
              });
            }
            mapRef.current.setView([lat, lng], 13);
          }
          
          if (onAddressChange) {
            console.log('🚀 Начинаем геокодирование для геолокации...');
            try {
              const result = await geocodeCoordinates(lat, lng, '📍 Geolocation:');
              console.log('🎉 Геокодирование завершено, вызываем onAddressChange:', result);
              alert(`📍 Получен адрес: ${result.fullAddress}, Район: ${result.district}`);
              onAddressChange(result.fullAddress, result.district);
              console.log('✅ onAddressChange вызван успешно');
            } catch (error) {
              console.error('❌ Ошибка получения адреса:', error);
              alert('❌ Ошибка: ' + error);
            }
          } else {
            console.log('⚠️ onAddressChange не передан в MapModal');
            alert('⚠️ onAddressChange не передан в MapModal!');
          }
        },
        (error) => {
          console.error('❌ Ошибка получения координат:', error);
          let errorMessage = 'Не удалось определить местоположение. ';
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += 'Разрешите доступ к геолокации в настройках браузера.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage += 'Местоположение недоступно.';
              break;
            case error.TIMEOUT:
              errorMessage += 'Время ожидания истекло.';
              break;
          }
          alert(errorMessage);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col shadow-xl">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">Выбор местоположения на карте</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Icon name="X" className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-4 space-y-4 flex-1 overflow-y-auto">
          <MapSearchBar onSelectLocation={handleSearchSelect} />

          <div>
            <Label htmlFor="coordinates">GPS координаты (широта, долгота)</Label>
            <Input
              id="coordinates"
              type="text"
              value={coordinates}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Например: 62.0355, 129.6755"
            />
          </div>

          <button
            type="button"
            onClick={handleGetCurrentLocation}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <Icon name="Navigation" className="h-4 w-4" />
            Мое местоположение
          </button>

          <div 
            ref={mapContainerRef} 
            className="w-full h-[400px] rounded-md border overflow-hidden"
            style={{ minHeight: '400px' }}
          />
          
          <p className="text-xs text-muted-foreground">
            💡 Кликните на карту или перетащите маркер для выбора точного местоположения
          </p>
        </div>

        <div className="p-4 border-t flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded-md hover:bg-accent transition-colors"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Применить
          </button>
        </div>
      </div>
    </div>
  );
}