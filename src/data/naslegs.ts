export interface Nasleg {
  id: string;
  name: string;
  districtId: string;
  type: 'nasleg' | 'settlement';
  latitude?: number;
  longitude?: number;
  radius?: number;
}

export const NASLEGS: Nasleg[] = [
  // Мегино-Кангаласский улус
  { id: 'megino-mayya', name: 'Мегино-Майя', districtId: 'yakutsk-megino-kangalassky', type: 'nasleg', latitude: 61.7000, longitude: 130.5000, radius: 15 },
  { id: 'mayya', name: 'Майя', districtId: 'yakutsk-megino-kangalassky', type: 'nasleg', latitude: 61.6500, longitude: 130.4000, radius: 15 },
  { id: 'tehtyur', name: 'Тёхтюр', districtId: 'yakutsk-megino-kangalassky', type: 'nasleg', latitude: 61.8000, longitude: 130.6000, radius: 15 },
  { id: 'nijniy-bestyakh', name: 'Нижний Бестях', districtId: 'yakutsk-megino-kangalassky', type: 'settlement', latitude: 62.0000, longitude: 129.9000, radius: 10 },
  
  // Хангаласский улус
  { id: 'pokrovsk', name: 'Покровск', districtId: 'yakutsk-khangalassky', type: 'settlement', latitude: 61.4833, longitude: 129.1500, radius: 10 },
  { id: 'sinsk', name: 'Синск', districtId: 'yakutsk-khangalassky', type: 'nasleg', latitude: 61.3500, longitude: 129.0000, radius: 15 },
  { id: 'tyungyulyun', name: 'Тюнгюлюн', districtId: 'yakutsk-khangalassky', type: 'nasleg', latitude: 61.6000, longitude: 129.3000, radius: 15 },
  { id: 'tehtyur-khangalas', name: 'Тёхтюр', districtId: 'yakutsk-khangalassky', type: 'nasleg', latitude: 61.5500, longitude: 129.2000, radius: 15 },
  
  // Намский улус
  { id: 'namcy', name: 'Намцы', districtId: 'yakutsk-namsky', type: 'settlement', latitude: 62.7167, longitude: 129.6667, radius: 10 },
  { id: 'khobolokhsky', name: 'Хоболохский', districtId: 'yakutsk-namsky', type: 'nasleg', latitude: 62.8000, longitude: 129.7000, radius: 15 },
  { id: 'khatassky', name: 'Хатасский', districtId: 'yakutsk-namsky', type: 'nasleg', latitude: 62.6500, longitude: 129.6000, radius: 15 },
  
  // Усть-Алданский улус
  { id: 'borогонцы', name: 'Борогонцы', districtId: 'yakutsk-ust-aldansky', type: 'settlement', latitude: 62.0500, longitude: 131.1000, radius: 10 },
  { id: 'megino-aldan', name: 'Мегино-Алдан', districtId: 'yakutsk-ust-aldansky', type: 'nasleg', latitude: 62.1000, longitude: 131.2000, radius: 15 },
  
  // Таттинский улус  
  { id: 'ytyk-kyuel', name: 'Ытык-Кюёль', districtId: 'yakutsk-tattinsky', type: 'settlement', latitude: 63.2833, longitude: 130.9167, radius: 10 },
  { id: 'cherkeh', name: 'Черкёх', districtId: 'yakutsk-tattinsky', type: 'nasleg', latitude: 63.3500, longitude: 131.0000, radius: 15 },
  { id: 'tuoy-haya', name: 'Туой-Хая', districtId: 'yakutsk-tattinsky', type: 'nasleg', latitude: 63.2000, longitude: 130.8000, radius: 15 },
  
  // Амгинский улус
  { id: 'amga', name: 'Амга', districtId: 'yakutsk-amginsky', type: 'settlement', latitude: 60.8833, longitude: 132.0167, radius: 10 },
  { id: 'bolugur', name: 'Болугур', districtId: 'yakutsk-amginsky', type: 'nasleg', latitude: 60.9500, longitude: 132.1000, radius: 15 },
  { id: 'abaga', name: 'Абага', districtId: 'yakutsk-amginsky', type: 'nasleg', latitude: 60.8000, longitude: 131.9000, radius: 15 },
  
  // Чурапчинский улус
  { id: 'churapcha', name: 'Чурапча', districtId: 'yakutsk-churapchinsky', type: 'settlement', latitude: 61.9833, longitude: 132.4333, radius: 10 },
  { id: 'myndagay', name: 'Мындагай', districtId: 'yakutsk-churapchinsky', type: 'nasleg', latitude: 62.0500, longitude: 132.5000, radius: 15 },
  
  // Горный улус
  { id: 'berdigestyakh', name: 'Бердигестях', districtId: 'yakutsk-gorny', type: 'settlement', latitude: 62.0667, longitude: 127.6333, radius: 10 },
  { id: 'hatyn-tumul', name: 'Хатын-Тумул', districtId: 'yakutsk-gorny', type: 'nasleg', latitude: 62.1000, longitude: 127.7000, radius: 15 },
  
  // Вилюйский улус
  { id: 'vilyuisk', name: 'Вилюйск', districtId: 'yakutsk-vilyuisky', type: 'settlement', latitude: 63.7500, longitude: 121.6167, radius: 10 },
  { id: 'usun', name: 'Усун', districtId: 'yakutsk-vilyuisky', type: 'nasleg', latitude: 63.8000, longitude: 121.7000, radius: 15 },
  { id: 'kyukyan', name: 'Кюкяй', districtId: 'yakutsk-vilyuisky', type: 'nasleg', latitude: 63.7000, longitude: 121.5000, radius: 15 },
  
  // Верхневилюйский улус
  { id: 'verkhnevilyuisk', name: 'Верхневилюйск', districtId: 'yakutsk-verkhnevilyuisky', type: 'settlement', latitude: 63.4500, longitude: 120.3167, radius: 10 },
  { id: 'baytyk', name: 'Байтык', districtId: 'yakutsk-verkhnevilyuisky', type: 'nasleg', latitude: 63.5000, longitude: 120.4000, radius: 15 },
  
  // Сунтарский улус
  { id: 'suntar', name: 'Сунтар', districtId: 'yakutsk-suntarsky', type: 'settlement', latitude: 62.1500, longitude: 117.6333, radius: 10 },
  { id: 'elgyay', name: 'Эльгяй', districtId: 'yakutsk-suntarsky', type: 'nasleg', latitude: 62.2000, longitude: 117.7000, radius: 15 },
  
  // Нюрбинский улус
  { id: 'nyurba', name: 'Нюрба', districtId: 'yakutsk-nyurbinsky', type: 'settlement', latitude: 63.2833, longitude: 118.3333, radius: 10 },
  { id: 'malykai', name: 'Малыкай', districtId: 'yakutsk-nyurbinsky', type: 'nasleg', latitude: 63.3500, longitude: 118.4000, radius: 15 },
  
  // Мирнинский улус
  { id: 'mirny', name: 'Мирный', districtId: 'yakutsk-mirny', type: 'settlement', latitude: 62.5333, longitude: 113.9667, radius: 10 },
  { id: 'chernyshevsky', name: 'Чернышевский', districtId: 'yakutsk-mirny', type: 'settlement', latitude: 63.0167, longitude: 112.4667, radius: 10 },
  
  // Ленский улус
  { id: 'lensk', name: 'Ленск', districtId: 'yakutsk-lensky', type: 'settlement', latitude: 60.7333, longitude: 114.9167, radius: 10 },
  { id: 'peleduy', name: 'Пеледуй', districtId: 'yakutsk-lensky', type: 'settlement', latitude: 59.6333, longitude: 112.7667, radius: 10 },
  
  // Олёкминский улус
  { id: 'olekminsk', name: 'Олёкминск', districtId: 'yakutsk-olekminsk', type: 'settlement', latitude: 60.3667, longitude: 120.4167, radius: 10 },
  { id: 'uritskoye', name: 'Урицкое', districtId: 'yakutsk-olekminsk', type: 'nasleg', latitude: 60.4000, longitude: 120.5000, radius: 15 },
  
  // Алданский улус
  { id: 'aldan', name: 'Алдан', districtId: 'yakutsk-aldansky', type: 'settlement', latitude: 58.6167, longitude: 125.3833, radius: 10 },
  { id: 'tommot', name: 'Томмот', districtId: 'yakutsk-aldansky', type: 'settlement', latitude: 58.9500, longitude: 126.2833, radius: 10 },
  
  // Нерюнгринский улус
  { id: 'neryungri', name: 'Нерюнгри', districtId: 'yakutsk-neryungrinsky', type: 'settlement', latitude: 56.6667, longitude: 124.7167, radius: 10 },
  { id: 'chulman', name: 'Чульман', districtId: 'yakutsk-neryungrinsky', type: 'settlement', latitude: 56.8500, longitude: 124.9000, radius: 10 },
  
  // Усть-Майский улус
  { id: 'ust-maya', name: 'Усть-Мая', districtId: 'yakutsk-ust-maisky', type: 'settlement', latitude: 60.4167, longitude: 134.5333, radius: 10 },
  
  // Томпонский улус
  { id: 'handyga', name: 'Хандыга', districtId: 'yakutsk-tomponsky', type: 'settlement', latitude: 62.6500, longitude: 135.6000, radius: 10 },
  
  // Оймяконский улус
  { id: 'ust-nera', name: 'Усть-Нера', districtId: 'yakutsk-oymyakonsky', type: 'settlement', latitude: 64.5667, longitude: 143.2000, radius: 10 },
  { id: 'tomtor', name: 'Томтор', districtId: 'yakutsk-oymyakonsky', type: 'settlement', latitude: 63.2667, longitude: 143.1500, radius: 10 },
  
  // Момский улус
  { id: 'honuu', name: 'Хонуу', districtId: 'yakutsk-momsky', type: 'settlement', latitude: 66.4500, longitude: 143.2333, radius: 10 },
  
  // Кобяйский улус
  { id: 'sangar', name: 'Сангар', districtId: 'yakutsk-kobyaisky', type: 'settlement', latitude: 63.9167, longitude: 127.4667, radius: 10 },
  
  // Булунский улус
  { id: 'tiksi', name: 'Тикси', districtId: 'yakutsk-bulunsky', type: 'settlement', latitude: 71.6408, longitude: 128.8719, radius: 10 },
  { id: 'nayba', name: 'Найба', districtId: 'yakutsk-bulunsky', type: 'nasleg', latitude: 71.5000, longitude: 128.7000, radius: 15 },
  
  // Верхоянский улус
  { id: 'verkhoyansk', name: 'Верхоянск', districtId: 'yakutsk-verkhoyansk', type: 'settlement', latitude: 67.5500, longitude: 133.3833, radius: 10 },
  { id: 'batagay', name: 'Батагай', districtId: 'yakutsk-verkhoyansk', type: 'settlement', latitude: 67.6500, longitude: 134.6333, radius: 10 },
  
  // Оленёкский улус
  { id: 'olenek', name: 'Оленёк', districtId: 'yakutsk-oleneksky', type: 'settlement', latitude: 68.5000, longitude: 112.4333, radius: 10 },
  
  // Анабарский улус
  { id: 'saskylakh', name: 'Саскылах', districtId: 'yakutsk-anabarsky', type: 'settlement', latitude: 71.9667, longitude: 114.0833, radius: 10 },
  
  // Жиганский улус
  { id: 'zhigansk', name: 'Жиганск', districtId: 'yakutsk-zhigansky', type: 'settlement', latitude: 66.7667, longitude: 123.3667, radius: 10 },
  
  // Аллаиховский улус
  { id: 'chokurdakh', name: 'Чокурдах', districtId: 'yakutsk-allaikhovsky', type: 'settlement', latitude: 70.6167, longitude: 147.8833, radius: 10 },
  
  // Нижнеколымский улус
  { id: 'chersky', name: 'Черский', districtId: 'yakutsk-nizhnekolymsky', type: 'settlement', latitude: 68.7500, longitude: 161.3167, radius: 10 },
  
  // Среднеколымский улус
  { id: 'srednekolymsk', name: 'Среднеколымск', districtId: 'yakutsk-srednekolymsky', type: 'settlement', latitude: 67.4500, longitude: 153.7167, radius: 10 },
  
  // Верхнеколымский улус
  { id: 'zyryanka', name: 'Зырянка', districtId: 'yakutsk-verkhnekolymsky', type: 'settlement', latitude: 65.7333, longitude: 150.9000, radius: 10 },
  
  // Усть-Янский улус
  { id: 'deputatsky', name: 'Депутатский', districtId: 'yakutsk-ust-yansky', type: 'settlement', latitude: 69.3000, longitude: 139.9000, radius: 10 },
  
  // Абыйский улус
  { id: 'belaya-gora', name: 'Белая Гора', districtId: 'yakutsk-abyysky', type: 'settlement', latitude: 68.5333, longitude: 146.4333, radius: 10 },
  
  // Эвено-Бытантайский улус
  { id: 'batagay-alyta', name: 'Батагай-Алыта', districtId: 'yakutsk-evensky', type: 'settlement', latitude: 67.8000, longitude: 130.4167, radius: 10 },
];

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export function findNaslegByCoordinates(latitude: number, longitude: number): Nasleg | null {
  let closestNasleg: Nasleg | null = null;
  let minDistance = Infinity;

  for (const nasleg of NASLEGS) {
    if (!nasleg.latitude || !nasleg.longitude) continue;

    const distance = calculateDistance(
      latitude,
      longitude,
      nasleg.latitude,
      nasleg.longitude
    );

    const maxDistance = nasleg.radius || 20;

    if (distance <= maxDistance && distance < minDistance) {
      minDistance = distance;
      closestNasleg = nasleg;
    }
  }

  return closestNasleg;
}

export function getNaslegsByDistrict(districtId: string): Nasleg[] {
  return NASLEGS.filter(n => n.districtId === districtId);
}
