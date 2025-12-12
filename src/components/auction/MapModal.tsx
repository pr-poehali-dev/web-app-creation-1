import { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ display_name: string; lat: string; lon: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);

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
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ru&addressdetails=1`
            );
            const data = await response.json();
            console.log('📍 OpenStreetMap response:', data);
            
            const address = data.address;
            const fullAddress = `${address.road || ''} ${address.house_number || ''}`.trim();
            
            // Пробуем разные поля для определения района
            const district = address.suburb || 
                           address.district || 
                           address.city_district || 
                           address.municipality ||
                           address.county ||
                           address.state_district ||
                           address.neighbourhood ||
                           '';
            
            console.log('📌 Extracted district:', district);
            console.log('📬 Calling onAddressChange with:', { fullAddress, district });
            onAddressChange(fullAddress, district);
          } catch (error) {
            console.error('Ошибка получения адреса:', error);
          }
        }

        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          const icon = L.icon({
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
          });
          markerRef.current = L.marker([lat, lng], { icon, draggable: true }).addTo(map);
          
          markerRef.current.on('dragend', async () => {
            if (!markerRef.current) return;
            const position = markerRef.current.getLatLng();
            const coords = `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`;
            onCoordinatesChange(coords);
            
            if (onAddressChange) {
              try {
                const response = await fetch(
                  `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.lat}&lon=${position.lng}&accept-language=ru&addressdetails=1`
                );
                const data = await response.json();
                console.log('OpenStreetMap drag response:', data);
                
                const address = data.address;
                const fullAddress = `${address.road || ''} ${address.house_number || ''}`.trim();
                const district = address.suburb || 
                               address.district || 
                               address.city_district || 
                               address.municipality ||
                               address.county ||
                               address.state_district ||
                               address.neighbourhood ||
                               '';
                
                console.log('Extracted district (drag):', district);
                onAddressChange(fullAddress, district);
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
            const icon = L.icon({
              iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
              iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
              shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
            });
            markerRef.current = L.marker([lat, lng], { icon, draggable: true }).addTo(map);
            
            markerRef.current.on('dragend', async () => {
              if (!markerRef.current) return;
              const position = markerRef.current.getLatLng();
              const coords = `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`;
              onCoordinatesChange(coords);
              
              if (onAddressChange) {
                try {
                  const response = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.lat}&lon=${position.lng}&accept-language=ru&addressdetails=1`
                  );
                  const data = await response.json();
                  const address = data.address;
                  const fullAddress = `${address.road || ''} ${address.house_number || ''}`.trim();
                  const district = address.suburb || address.district || address.city_district || '';
                  onAddressChange(fullAddress, district);
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
  }, [isOpen, mapCenter, coordinates, onCoordinatesChange]);

  const handleInputChange = async (value: string) => {
    onCoordinatesChange(value);
    const [lat, lng] = value.split(',').map(c => parseFloat(c.trim()));
    if (!isNaN(lat) && !isNaN(lng)) {
      setMapCenter([lat, lng]);
      
      if (onAddressChange) {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ru&addressdetails=1`
          );
          const data = await response.json();
          console.log('OpenStreetMap input response:', data);
          
          const address = data.address;
          const fullAddress = `${address.road || ''} ${address.house_number || ''}`.trim();
          const district = address.suburb || 
                         address.district || 
                         address.city_district || 
                         address.municipality ||
                         address.county ||
                         address.state_district ||
                         address.neighbourhood ||
                         '';
          
          console.log('Extracted district (input):', district);
          onAddressChange(fullAddress, district);
        } catch (error) {
          console.error('Ошибка получения адреса:', error);
        }
      }
    }
  };

  const handleUseMyLocation = () => {
    console.log('🗺️ Запрос геолокации...');
    if (!navigator.geolocation) {
      console.error('❌ Геолокация не поддерживается браузером');
      alert('Ваш браузер не поддерживает геолокацию');
      return;
    }
    
    // Показываем сообщение пользователю
    const loadingMessage = 'Определяем ваше местоположение...';
    console.log(loadingMessage);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        console.log('✅ Геолокация получена:', position.coords);
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const coords = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        onCoordinatesChange(coords);
        setMapCenter([lat, lng]);
          
          // Создаем или перемещаем маркер
          if (mapRef.current) {
            if (markerRef.current) {
              markerRef.current.setLatLng([lat, lng]);
            } else {
              const icon = L.icon({
                iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
              });
              markerRef.current = L.marker([lat, lng], { icon, draggable: true }).addTo(mapRef.current);
              
              markerRef.current.on('dragend', async () => {
                if (!markerRef.current) return;
                const position = markerRef.current.getLatLng();
                const coords = `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`;
                onCoordinatesChange(coords);
                
                if (onAddressChange) {
                  try {
                    const response = await fetch(
                      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.lat}&lon=${position.lng}&accept-language=ru&addressdetails=1`
                    );
                    const data = await response.json();
                    const address = data.address;
                    const fullAddress = `${address.road || ''} ${address.house_number || ''}`.trim();
                    const district = address.suburb || 
                                   address.district || 
                                   address.city_district || 
                                   address.municipality ||
                                   address.county ||
                                   address.state_district ||
                                   address.neighbourhood ||
                                   '';
                    onAddressChange(fullAddress, district);
                  } catch (error) {
                    console.error('Ошибка получения адреса:', error);
                  }
                }
              });
            }
            mapRef.current.setView([lat, lng], 13);
          }
          
          if (onAddressChange) {
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ru&addressdetails=1`
              );
              const data = await response.json();
              console.log('OpenStreetMap geolocation response:', data);
              
              const address = data.address;
              const fullAddress = `${address.road || ''} ${address.house_number || ''}`.trim();
              const district = address.suburb || 
                             address.district || 
                             address.city_district || 
                             address.municipality ||
                             address.county ||
                             address.state_district ||
                             address.neighbourhood ||
                             '';
              
              console.log('Extracted district (geolocation):', district);
              onAddressChange(fullAddress, district);
            } catch (error) {
              console.error('Ошибка получения адреса:', error);
            }
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

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Ошибка поиска:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = async (lat: string, lon: string, displayName: string) => {
    const coords = `${parseFloat(lat).toFixed(6)}, ${parseFloat(lon).toFixed(6)}`;
    onCoordinatesChange(coords);
    setMapCenter([parseFloat(lat), parseFloat(lon)]);
    
    if (onAddressChange) {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=ru&addressdetails=1`
        );
        const data = await response.json();
        console.log('OpenStreetMap search response:', data);
        
        const address = data.address;
        const fullAddress = `${address.road || ''} ${address.house_number || ''}`.trim();
        const district = address.suburb || 
                       address.district || 
                       address.city_district || 
                       address.municipality ||
                       address.county ||
                       address.state_district ||
                       address.neighbourhood ||
                       '';
        
        console.log('Extracted district (search):', district);
        onAddressChange(fullAddress, district);
      } catch (error) {
        console.error('Ошибка получения адреса:', error);
      }
    }
    
    setSearchResults([]);
    setSearchQuery('');
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
          <div>
            <Label htmlFor="searchAddress">Поиск адреса</Label>
            <div className="flex gap-2">
              <Input
                id="searchAddress"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Например: Ташкент, улица Амира Темура"
                className="flex-1"
              />
              <button
                type="button"
                onClick={handleSearch}
                disabled={isSearching}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <Icon name="Search" className="h-4 w-4" />
              </button>
            </div>
            {searchResults.length > 0 && (
              <div className="mt-2 border rounded-md max-h-40 overflow-auto">
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSelectSearchResult(result.lat, result.lon, result.display_name)}
                    className="w-full text-left px-3 py-2 hover:bg-accent transition-colors text-sm"
                  >
                    {result.display_name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div ref={mapContainerRef} className="h-[400px] rounded-lg overflow-hidden border" />
          <p className="text-sm text-muted-foreground">
            Нажмите на карте или перетащите маркер, чтобы указать местонахождение
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={handleUseMyLocation}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <Icon name="MapPin" className="h-4 w-4" />
              Мое местоположение
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md hover:bg-accent transition-colors"
            >
              Готово
            </button>
          </div>
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
        </div>
      </div>
    </div>
  );
}