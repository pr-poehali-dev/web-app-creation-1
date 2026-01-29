export interface ReverseGeocodeResult {
  display_name: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    hamlet?: string;
    road?: string;
    house_number?: string;
    county?: string;
    municipality?: string;
    district?: string;
    city_district?: string;
    state_district?: string;
    suburb?: string;
    neighbourhood?: string;
  };
}

export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<ReverseGeocodeResult> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ru&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'YakutMarket/1.0'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch address');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    throw error;
  }
}

export function formatAddress(result: ReverseGeocodeResult): string {
  const address = result.address;
  
  const settlement = address.city || address.town || address.village || address.hamlet || '';
  const street = address.road || '';
  const houseNumber = address.house_number || '';
  
  const addressParts = [settlement, street, houseNumber].filter(Boolean);
  return addressParts.join(', ') || result.display_name;
}
