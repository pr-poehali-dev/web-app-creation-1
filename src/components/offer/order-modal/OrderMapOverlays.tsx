import { lazy, Suspense } from 'react';

const MapModal = lazy(() =>
  import('@/components/auction/MapModal').catch(() => ({ default: () => null }))
);

interface OrderMapOverlaysProps {
  isMapOpen: boolean;
  isPickupMapOpen: boolean;
  gpsCoordinates: string;
  pickupGpsCoordinates: string;
  onDeliveryMapClose: () => void;
  onPickupMapClose: () => void;
  onCoordinatesChange: (coords: string) => void;
  onPickupCoordinatesChange: (coords: string) => void;
  onAddressChange: (fullAddress: string, district: string, coords?: string) => void;
  onPickupAddressFromMap: (fullAddress: string, district: string, coords?: string) => void;
}

export default function OrderMapOverlays({
  isMapOpen,
  isPickupMapOpen,
  gpsCoordinates,
  pickupGpsCoordinates,
  onDeliveryMapClose,
  onPickupMapClose,
  onCoordinatesChange,
  onPickupCoordinatesChange,
  onAddressChange,
  onPickupAddressFromMap,
}: OrderMapOverlaysProps) {
  return (
    <>
      {isMapOpen && (
        <div className="fixed inset-0 z-[100] bg-background">
          <Suspense fallback={<div />}>
            <MapModal
              isOpen={isMapOpen}
              onClose={onDeliveryMapClose}
              coordinates={gpsCoordinates}
              onCoordinatesChange={onCoordinatesChange}
              onAddressChange={onAddressChange}
            />
          </Suspense>
        </div>
      )}

      {isPickupMapOpen && (
        <div className="fixed inset-0 z-[100] bg-background">
          <Suspense fallback={<div />}>
            <MapModal
              isOpen={isPickupMapOpen}
              onClose={onPickupMapClose}
              coordinates={pickupGpsCoordinates}
              onCoordinatesChange={onPickupCoordinatesChange}
              onAddressChange={onPickupAddressFromMap}
            />
          </Suspense>
        </div>
      )}
    </>
  );
}
