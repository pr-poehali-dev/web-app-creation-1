export interface DistrictFilterable {
  district: string;
}

export function filterByDistrict<T extends DistrictFilterable>(
  items: T[],
  selectedDistrict: string
): T[] {
  if (selectedDistrict === 'all') {
    return items;
  }
  
  return items.filter(item => item.district === selectedDistrict);
}
