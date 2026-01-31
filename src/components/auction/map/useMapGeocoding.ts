export interface GeocodingResult {
  fullAddress: string;
  district: string;
}

function shortenAddress(address: any): string {
  // Сокращаем регион/область
  const region = address.state || '';
  const shortRegion = region
    .replace('Республика Саха (Якутия)', 'Респ.Саха(Я)')
    .replace('Республика', 'Респ.')
    .replace('область', 'обл.')
    .replace('край', 'кр.');
  
  // Город/населенный пункт
  const city = address.city || address.town || address.village || address.hamlet || '';
  const shortCity = city ? `г.${city}` : '';
  
  // Улица (убираем слово "улица")
  const street = address.road || '';
  const shortStreet = street.replace('улица', '').trim();
  
  // Номер дома
  const houseNumber = address.house_number || '';
  
  // Собираем адрес: Респ.Саха(Я), г.Нюрба, Степана Васильева, 15
  const parts = [shortRegion, shortCity, shortStreet, houseNumber].filter(Boolean);
  return parts.join(', ');
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
    
    // Используем сокращенную версию адреса
    const fullAddress = shortenAddress(address);
    
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