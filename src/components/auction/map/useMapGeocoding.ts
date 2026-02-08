export interface GeocodingResult {
  fullAddress: string;
  district: string;
}

export async function geocodeCoordinates(
  lat: number,
  lng: number,
  logPrefix: string = ''
): Promise<GeocodingResult> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ru&addressdetails=1`
    );
    const data = await response.json();
    
    if (logPrefix) {
      console.log(`${logPrefix} OpenStreetMap response:`, data);
    }
    
    const address = data.address;
    
    const settlement = address.city || address.town || address.village || address.hamlet || '';
    const street = address.road || '';
    const houseNumber = address.house_number || '';
    
    const addressParts = [settlement, street, houseNumber].filter(Boolean);
    const fullAddress = addressParts.join(', ');
    
    const district = address.county ||
                   address.city ||
                   address.municipality ||
                   address.district || 
                   address.city_district || 
                   address.state_district ||
                   address.suburb || 
                   address.neighbourhood ||
                   '';
    
    if (logPrefix) {
      console.log(`${logPrefix} Extracted district:`, district);
      console.log(`${logPrefix} Calling with:`, { fullAddress, district });
    }
    
    return { fullAddress, district };
  } catch (error) {
    console.error('Ошибка получения адреса:', error);
    throw error;
  }
}
