/* eslint-disable @typescript-eslint/no-explicit-any */
/* Leaflet загружается через CDN в index.html как глобальная переменная L */
declare const L: any;

export function createMarkerIcon(): any {
  return L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });
}

export function createDraggableMarker(
  map: any,
  lat: number,
  lng: number,
  onDragEnd: (lat: number, lng: number) => void
): any {
  const icon = createMarkerIcon();
  const marker = L.marker([lat, lng], { icon, draggable: true }).addTo(map);

  marker.on('dragend', () => {
    const position = marker.getLatLng();
    onDragEnd(position.lat, position.lng);
  });

  return marker;
}

export function updateMarkerPosition(marker: any, lat: number, lng: number): void {
  if (marker) {
    marker.setLatLng([lat, lng]);
  }
}
