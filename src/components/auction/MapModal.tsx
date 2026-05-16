import { useEffect, useState, useRef } from 'react';
/* eslint-disable @typescript-eslint/no-explicit-any */
declare const L: any;
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
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([41.2995, 69.2401]);
  const [currentAddress, setCurrentAddress] = useState<string>('');
  const [currentDistrict, setCurrentDistrict] = useState<string>('');
  const [currentCoords, setCurrentCoords] = useState<string>('');

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

      map.on('click', async (e: any) => {
        const { lat, lng } = e.latlng;
        const coords = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        console.log('🗺️ MAP CLICK:', coords);
        onCoordinatesChange(coords);

        if (onAddressChange) {
          console.log('🔄 Fetching address from Nominatim...');
          try {
            const result = await geocodeCoordinates(lat, lng, '📍');
            setCurrentAddress(result.fullAddress);
            setCurrentDistrict(result.district);
            setCurrentCoords(coords);
            onAddressChange(result.fullAddress, result.district, coords);
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
              console.log('🔄 Drag callback: fetching address for', dragCoords);
              try {
                const result = await geocodeCoordinates(dragLat, dragLng, '🔄 Drag:');
                console.log('🔄 Drag: Calling onAddressChange with:', result);
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
      });

        mapRef.current = map;
        
        if (coordinates) {
          const [lat, lng] = coordinates.split(',').map(c => parseFloat(c.trim()));
          if (!isNaN(lat) && !isNaN(lng)) {
            markerRef.current = createDraggableMarker(map, lat, lng, async (dragLat, dragLng) => {
              const dragCoords = `${dragLat.toFixed(6)}, ${dragLng.toFixed(6)}`;
              onCoordinatesChange(dragCoords);
              
              if (onAddressChange) {
                console.log('🔄 Initial marker drag: fetching address for', dragCoords);
                try {
                  const result = await geocodeCoordinates(dragLat, dragLng);
                  console.log('🔄 Initial marker drag: Calling onAddressChange with:', result);
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
    console.log('🎯 handleGetCurrentLocation вызван');
    console.log('🎯 onAddressChange существует:', !!onAddressChange);
    const loadingMessage = 'Определяем ваше местоположение...';
    console.log(loadingMessage);
    
    if (!navigator.geolocation) {
      console.error('Геолокация не поддерживается');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const coords = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        console.log('🎯 Got location:', coords);
        
        onCoordinatesChange(coords);
        setMapCenter([lat, lng]);

        if (mapRef.current) {
          mapRef.current.setView([lat, lng], 15);
          
          if (markerRef.current) {
            updateMarkerPosition(markerRef.current, lat, lng);
          } else {
            markerRef.current = createDraggableMarker(mapRef.current, lat, lng, async (dragLat, dragLng) => {
              const dragCoords = `${dragLat.toFixed(6)}, ${dragLng.toFixed(6)}`;
              onCoordinatesChange(dragCoords);
              if (onAddressChange) {
                try {
                  const result = await geocodeCoordinates(dragLat, dragLng);
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
            const result = await geocodeCoordinates(lat, lng, '🎯 Location:');
            console.log('🎯 Got address:', result);
            setCurrentAddress(result.fullAddress);
            setCurrentDistrict(result.district);
            setCurrentCoords(coords);
            onAddressChange(result.fullAddress, result.district, coords);
          } catch (error) {
            console.error('Ошибка получения адреса по геолокации:', error);
          }
        }
      },
      (error) => {
        console.error('Ошибка геолокации:', error);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Выбор на карте</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <MapSearchBar onSelect={handleSearchSelect} />
          
          <div className="flex gap-2">
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground mb-1 block">Координаты</Label>
              <Input
                value={coordinates}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="41.299496, 69.240073"
                className="font-mono text-sm"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleGetCurrentLocation}
                className="px-3 py-2 rounded-lg border hover:bg-gray-50 flex items-center gap-1 text-sm"
                title="Моё местоположение"
              >
                <Icon name="MapPin" size={16} />
              </button>
            </div>
          </div>
        </div>

        <div ref={mapContainerRef} className="flex-1 min-h-[350px] mx-4 rounded-xl overflow-hidden border" />

        {currentAddress && (
          <div className="px-4 py-2 text-sm text-muted-foreground border-t bg-gray-50">
            {currentAddress}
          </div>
        )}

        <div className="flex gap-2 p-4 border-t">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border hover:bg-gray-50 text-sm">
            Отмена
          </button>
          <button
            onClick={handleApply}
            className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium"
          >
            Применить
          </button>
        </div>
      </div>
    </div>
  );
}
