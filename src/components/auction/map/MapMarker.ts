import L from 'leaflet';

export function createMarkerIcon(): L.Icon {
  return L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });
}

export function createDraggableMarker(
  map: L.Map,
  lat: number,
  lng: number,
  onDragEnd: (lat: number, lng: number) => void
): L.Marker {
  const icon = createMarkerIcon();
  const marker = L.marker([lat, lng], { icon, draggable: true }).addTo(map);
  
  marker.on('dragend', () => {
    const position = marker.getLatLng();
    onDragEnd(position.lat, position.lng);
  });
  
  return marker;
}

export function updateMarkerPosition(
  marker: L.Marker | null,
  lat: number,
  lng: number
): void {
  if (marker) {
    marker.setLatLng([lat, lng]);
  }
}
