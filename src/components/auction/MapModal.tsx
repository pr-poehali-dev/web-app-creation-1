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
  onAddressChange?: (address: string, district: string, coords?: string) => void;
}

export default function MapModal({ isOpen, onClose, coordinates, onCoordinatesChange, onAddressChange }: MapModalProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([41.2995, 69.2401]);
  const [currentAddress, setCurrentAddress] = useState<string>('');
  const [currentDistrict, setCurrentDistrict] = useState<string>('');
  const [currentCoords, setCurrentCoords] = useState<string>('');
  const onCoordinatesChangeRef = useRef(onCoordinatesChange);
  const onAddressChangeRef = useRef(onAddressChange);
  onCoordinatesChangeRef.current = onCoordinatesChange;
  onAddressChangeRef.current = onAddressChange;

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

    const initCenter = mapCenter;
    const initCoordinates = coordinates;

    setTimeout(() => {
      if (!mapContainerRef.current) return;
      const map = L.map(mapContainerRef.current).setView(initCenter, 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      map.on('click', async (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        const coords = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        onCoordinatesChangeRef.current(coords);

        if (onAddressChangeRef.current) {
          try {
            const result = await geocodeCoordinates(lat, lng, '📍');
            setCurrentAddress(result.fullAddress);
            setCurrentDistrict(result.district);
            setCurrentCoords(coords);
            onAddressChangeRef.current(result.fullAddress, result.district, coords);
          } catch (error) {
            console.error('Ошибка получения адреса:', error);
          }
        }

        if (markerRef.current) {
          updateMarkerPosition(markerRef.current, lat, lng);
        } else {
          markerRef.current = createDraggableMarker(map, lat, lng, async (dragLat, dragLng) => {
            const dragCoords = `${dragLat.toFixed(6)}, ${dragLng.toFixed(6)}`;
            onCoordinatesChangeRef.current(dragCoords);
            if (onAddressChangeRef.current) {
              try {
                const result = await geocodeCoordinates(dragLat, dragLng, '🔄 Drag:');
                setCurrentAddress(result.fullAddress);
                setCurrentDistrict(result.district);
                setCurrentCoords(dragCoords);
                onAddressChangeRef.current(result.fullAddress, result.district, dragCoords);
              } catch (error) {
                console.error('Ошибка получения адреса при перетаскивании:', error);
              }
            }
          });
        }
      });

      mapRef.current = map;

      if (initCoordinates) {
        const [lat, lng] = initCoordinates.split(',').map(c => parseFloat(c.trim()));
        if (!isNaN(lat) && !isNaN(lng)) {
          markerRef.current = createDraggableMarker(map, lat, lng, async (dragLat, dragLng) => {
            const dragCoords = `${dragLat.toFixed(6)}, ${dragLng.toFixed(6)}`;
            onCoordinatesChangeRef.current(dragCoords);
            if (onAddressChangeRef.current) {
              try {
                const result = await geocodeCoordinates(dragLat, dragLng);
                setCurrentAddress(result.fullAddress);
                setCurrentDistrict(result.district);
                setCurrentCoords(dragCoords);
                onAddressChangeRef.current(result.fullAddress, result.district, dragCoords);
              } catch (error) {
                console.error('Ошибка получения адреса при перетаскивании:', error);
              }
            }
          });
        }
      }

      setTimeout(() => { map.invalidateSize(); }, 100);
    }, 100);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleInputChange = async (value: string) => {
    onCoordinatesChange(value);
    const [lat, lng] = value.split(',').map(c => parseFloat(c.trim()));
    if (!isNaN(lat) && !isNaN(lng)) {
      setMapCenter([lat, lng]);
      
      if (onAddressChange) {
        try {
          const result = await geocodeCoordinates(lat, lng);
          setCurrentAddress(result.fullAddress);
          setCurrentDistrict(result.district);
          setCurrentCoords(value);
          onAddressChange(result.fullAddress, result.district, value);
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
            console.log('🔄 Search result marker drag: fetching address for', dragCoords);
            try {
              const result = await geocodeCoordinates(dragLat, dragLng);
              console.log('🔄 Search result marker drag: Calling onAddressChange with:', result);
              setCurrentAddress(result.fullAddress);
              setCurrentDistrict(result.district);
              setCurrentCoords(dragCoords);
              onAddressChange(result.fullAddress, result.district, dragCoords);
            } catch (error) {
              console.error('Ошибка получения адреса при перетаскивании:', error);
            }
          }
        });
      }
    }

    if (onAddressChange) {
      try {
        const result = await geocodeCoordinates(lat, lng, '🔍 Search:');
        setCurrentAddress(result.fullAddress);
        setCurrentDistrict(result.district);
        setCurrentCoords(coords);
        onAddressChange(result.fullAddress, result.district, coords);
      } catch (error) {
        console.error('Ошибка получения адреса:', error);
      }
    }
  };

  const handleApply = () => {
    console.log('✅ Применить нажата. Передаём финальные данные:', { currentAddress, currentDistrict, currentCoords });
    if (onAddressChange && currentAddress) {
      onAddressChange(currentAddress, currentDistrict, currentCoords || coordinates);
    }
    onClose();
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Геолокация не поддерживается вашим браузером');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const coords = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        onCoordinatesChangeRef.current(coords);

        if (mapRef.current) {
          mapRef.current.setView([lat, lng], 13);
          if (markerRef.current) {
            updateMarkerPosition(markerRef.current, lat, lng);
          } else {
            markerRef.current = createDraggableMarker(mapRef.current, lat, lng, async (dragLat, dragLng) => {
              const dragCoords = `${dragLat.toFixed(6)}, ${dragLng.toFixed(6)}`;
              onCoordinatesChangeRef.current(dragCoords);
              if (onAddressChangeRef.current) {
                try {
                  const result = await geocodeCoordinates(dragLat, dragLng);
                  setCurrentAddress(result.fullAddress);
                  setCurrentDistrict(result.district);
                  setCurrentCoords(dragCoords);
                  onAddressChangeRef.current(result.fullAddress, result.district, dragCoords);
                } catch (error) {
                  console.error('Ошибка адреса при перетаскивании:', error);
                }
              }
            });
          }
        }

        if (onAddressChangeRef.current) {
          try {
            const result = await geocodeCoordinates(lat, lng, '📍 Geolocation:');
            setCurrentAddress(result.fullAddress);
            setCurrentDistrict(result.district);
            setCurrentCoords(coords);
            onAddressChangeRef.current(result.fullAddress, result.district, coords);
          } catch (error) {
            console.error('❌ Ошибка получения адреса:', error);
          }
        }
      },
      (error) => {
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
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
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
          <MapSearchBar onSelectLocation={handleSearchSelect} initialValue={currentAddress} />

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
            onClick={handleApply}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Применить
          </button>
        </div>
      </div>
    </div>
  );
}