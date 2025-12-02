export interface Settlement {
  id: string;
  name: string;
  regionId: string;
  districtId?: string;
  type: 'city' | 'town' | 'village' | 'settlement';
  population?: number;
  latitude?: number;
  longitude?: number;
}

export const SETTLEMENTS: Settlement[] = [
  { id: 'moscow-center', name: 'Москва', regionId: 'moscow', type: 'city', population: 13010112, latitude: 55.7558, longitude: 37.6173 },
  { id: 'spb-center', name: 'Санкт-Петербург', regionId: 'spb', type: 'city', population: 5601911, latitude: 59.9311, longitude: 30.3609 },
  
  { id: 'novosibirsk-center', name: 'Новосибирск', regionId: 'novosibirsk', type: 'city', population: 1633595, latitude: 55.0084, longitude: 82.9357 },
  { id: 'ekaterinburg-center', name: 'Екатеринбург', regionId: 'sverdlovsk', districtId: 'ekaterinburg-leninsky', type: 'city', population: 1544376, latitude: 56.8389, longitude: 60.6057 },
  { id: 'kazan-center', name: 'Казань', regionId: 'tatarstan', type: 'city', population: 1308660, latitude: 55.7887, longitude: 49.1221 },
  { id: 'nizhny-novgorod-center', name: 'Нижний Новгород', regionId: 'nizhny-novgorod', type: 'city', population: 1228199, latitude: 56.2965, longitude: 43.9361 },
  { id: 'chelyabinsk-center', name: 'Челябинск', regionId: 'chelyabinsk', type: 'city', population: 1189525, latitude: 55.1644, longitude: 61.4368 },
  { id: 'samara-center', name: 'Самара', regionId: 'samara', type: 'city', population: 1173393, latitude: 53.1952, longitude: 50.1069 },
  { id: 'omsk-center', name: 'Омск', regionId: 'omsk', type: 'city', population: 1125695, latitude: 54.9885, longitude: 73.3242 },
  { id: 'rostov-center', name: 'Ростов-на-Дону', regionId: 'rostov', type: 'city', population: 1142162, latitude: 47.2357, longitude: 39.7015 },
  { id: 'ufa-center', name: 'Уфа', regionId: 'bashkortostan', type: 'city', population: 1144809, latitude: 54.7388, longitude: 55.9721 },
  { id: 'krasnoyarsk-center', name: 'Красноярск', regionId: 'krasnoyarsk', type: 'city', population: 1187771, latitude: 56.0153, longitude: 92.8932 },
  { id: 'voronezh-center', name: 'Воронеж', regionId: 'voronezh', type: 'city', population: 1058261, latitude: 51.6605, longitude: 39.2006 },
  { id: 'perm-center', name: 'Пермь', regionId: 'perm', type: 'city', population: 1055397, latitude: 58.0105, longitude: 56.2502 },
  { id: 'volgograd-center', name: 'Волгоград', regionId: 'volgograd', type: 'city', population: 1008998, latitude: 48.7080, longitude: 44.5133 },
  
  { id: 'krasnodar-center', name: 'Краснодар', regionId: 'krasnodar', type: 'city', population: 1099344, latitude: 45.0355, longitude: 38.9753 },
  { id: 'sochi-city', name: 'Сочи', regionId: 'krasnodar', type: 'city', population: 466078, latitude: 43.5855, longitude: 39.7231 },
  { id: 'vladivostok-center', name: 'Владивосток', regionId: 'primorsky', type: 'city', population: 603519, latitude: 43.1056, longitude: 131.8735 },
  { id: 'khabarovsk-center', name: 'Хабаровск', regionId: 'khabarovsk', type: 'city', population: 617441, latitude: 48.4827, longitude: 135.0838 },
  { id: 'irkutsk-center', name: 'Иркутск', regionId: 'irkutsk', type: 'city', population: 623562, latitude: 52.2869, longitude: 104.3050 },
  { id: 'tyumen-center', name: 'Тюмень', regionId: 'tyumen', type: 'city', population: 847488, latitude: 57.1522, longitude: 65.5272 },
  { id: 'barnaul-center', name: 'Барнаул', regionId: 'altai-krai', type: 'city', population: 631131, latitude: 53.3484, longitude: 83.7769 },
  { id: 'tomsk-center', name: 'Томск', regionId: 'tomsk', type: 'city', population: 617473, latitude: 56.4977, longitude: 84.9744 },
  { id: 'kemerovo-center', name: 'Кемерово', regionId: 'kemerovo', type: 'city', population: 556382, latitude: 55.3547, longitude: 86.0861 },
  { id: 'novokuznetsk-city', name: 'Новокузнецк', regionId: 'kemerovo', type: 'city', population: 537480, latitude: 53.7596, longitude: 87.1216 },
  { id: 'ryazan-center', name: 'Рязань', regionId: 'ryazan', type: 'city', population: 538962, latitude: 54.6269, longitude: 39.6916 },
  { id: 'astrakhan-center', name: 'Астрахань', regionId: 'astrakhan', type: 'city', population: 475629, latitude: 46.3497, longitude: 48.0408 },
  { id: 'penza-center', name: 'Пенза', regionId: 'penza', type: 'city', population: 520300, latitude: 53.2001, longitude: 45.0047 },
  { id: 'lipetsk-center', name: 'Липецк', regionId: 'lipetsk', type: 'city', population: 510439, latitude: 52.6103, longitude: 39.5708 },
  { id: 'tula-center', name: 'Тула', regionId: 'tula', type: 'city', population: 556480, latitude: 54.1961, longitude: 37.6182 },
  { id: 'kirov-center', name: 'Киров', regionId: 'kirov', type: 'city', population: 531950, latitude: 58.6035, longitude: 49.6680 },
  { id: 'cheboksary-center', name: 'Чебоксары', regionId: 'chuvashia', type: 'city', population: 497618, latitude: 56.1439, longitude: 47.2489 },
  { id: 'kaliningrad-center', name: 'Калининград', regionId: 'kaliningrad', type: 'city', population: 489359, latitude: 54.7104, longitude: 20.4522 },
  { id: 'bryansk-center', name: 'Брянск', regionId: 'bryansk', type: 'city', population: 379152, latitude: 53.2521, longitude: 34.3717 },
  { id: 'ivanovo-center', name: 'Иваново', regionId: 'ivanovo', type: 'city', population: 401274, latitude: 57.0000, longitude: 40.9737 },
  { id: 'magnitogorsk-city', name: 'Магнитогорск', regionId: 'chelyabinsk', type: 'city', population: 413351, latitude: 53.4071, longitude: 58.9794 },
  { id: 'kursk-center', name: 'Курск', regionId: 'kursk', type: 'city', population: 440052, latitude: 51.7304, longitude: 36.1926 },
  { id: 'tver-center', name: 'Тверь', regionId: 'tver', type: 'city', population: 424969, latitude: 56.8587, longitude: 35.9176 },
  { id: 'yaroslavl-center', name: 'Ярославль', regionId: 'yaroslavl', type: 'city', population: 608353, latitude: 57.6261, longitude: 39.8845 },
  { id: 'vladikavkaz-center', name: 'Владикавказ', regionId: 'north-ossetia', type: 'city', population: 295830, latitude: 43.0368, longitude: 44.6681 },
  { id: 'makhachkala-center', name: 'Махачкала', regionId: 'dagestan', type: 'city', population: 623254, latitude: 42.9849, longitude: 47.5047 },
  { id: 'grozny-center', name: 'Грозный', regionId: 'chechnya', type: 'city', population: 328533, latitude: 43.3181, longitude: 45.6986 },
  { id: 'surgut-city', name: 'Сургут', regionId: 'khanty-mansi', type: 'city', population: 405335, latitude: 61.2500, longitude: 73.4167 },
  { id: 'nizhnevartovsk-city', name: 'Нижневартовск', regionId: 'khanty-mansi', type: 'city', population: 283256, latitude: 60.9344, longitude: 76.5531 },
  { id: 'novy-urengoy-city', name: 'Новый Уренгой', regionId: 'yamalo-nenets', type: 'city', population: 118035, latitude: 66.0833, longitude: 76.6333 },
  { id: 'murmansk-center', name: 'Мурманск', regionId: 'murmansk', type: 'city', population: 270384, latitude: 68.9585, longitude: 33.0827 },
  { id: 'arkhangelsk-center', name: 'Архангельск', regionId: 'arkhangelsk', type: 'city', population: 301199, latitude: 64.5401, longitude: 40.5433 },
  { id: 'vologda-center', name: 'Вологда', regionId: 'vologda', type: 'city', population: 301755, latitude: 59.2180, longitude: 39.8920 },
  { id: 'petrozavodsk-center', name: 'Петрозаводск', regionId: 'karelia', type: 'city', population: 280746, latitude: 61.7849, longitude: 34.3469 },
  { id: 'syktyvkar-center', name: 'Сыктывкар', regionId: 'komi', type: 'city', population: 244570, latitude: 61.6681, longitude: 50.8372 },
  
  { id: 'yakutsk-center', name: 'Якутск', regionId: 'sakha', districtId: 'yakutsk-city', type: 'city', population: 355443, latitude: 62.0355, longitude: 129.6755 },
  { id: 'neryungri-city', name: 'Нерюнгри', regionId: 'sakha', districtId: 'yakutsk-neryungrinsky', type: 'city', population: 57783, latitude: 56.6667, longitude: 124.7167 },
  { id: 'aldan-city', name: 'Алдан', regionId: 'sakha', districtId: 'yakutsk-aldansky', type: 'town', population: 20426, latitude: 58.6167, longitude: 125.3833 },
  { id: 'mirny-city', name: 'Мирный', regionId: 'sakha', districtId: 'yakutsk-mirny', type: 'city', population: 37188, latitude: 62.5333, longitude: 113.9667 },
  { id: 'lensk-city', name: 'Ленск', regionId: 'sakha', districtId: 'yakutsk-lensky', type: 'city', population: 22424, latitude: 60.7333, longitude: 114.9167 },
  { id: 'pokrovsk-city', name: 'Покровск', regionId: 'sakha', districtId: 'yakutsk-khangalassky', type: 'town', population: 9865, latitude: 61.4833, longitude: 129.1500 },
  { id: 'vilyuisk-city', name: 'Вилюйск', regionId: 'sakha', districtId: 'yakutsk-vilyuisky', type: 'town', population: 10584, latitude: 63.7500, longitude: 121.6167 },
  { id: 'verkhoyansk-city', name: 'Верхоянск', regionId: 'sakha', districtId: 'yakutsk-verkhoyansk', type: 'town', population: 1122, latitude: 67.5500, longitude: 133.3833 },
  { id: 'tiksi-city', name: 'Тикси', regionId: 'sakha', districtId: 'yakutsk-bulunsky', type: 'settlement', population: 4547, latitude: 71.6408, longitude: 128.8719 },
  { id: 'olenek-city', name: 'Оленёк', regionId: 'sakha', districtId: 'yakutsk-oleneksky', type: 'village', population: 2154, latitude: 68.5000, longitude: 112.4333 },
  { id: 'zyryanka-city', name: 'Зырянка', regionId: 'sakha', districtId: 'yakutsk-verkhnekolymsky', type: 'settlement', population: 2472, latitude: 65.7333, longitude: 150.9000 },
  { id: 'chersky-city', name: 'Черский', regionId: 'sakha', districtId: 'yakutsk-nizhnekolymsky', type: 'settlement', population: 2765, latitude: 68.7500, longitude: 161.3167 },
  { id: 'srednekolymsk-city', name: 'Среднеколымск', regionId: 'sakha', districtId: 'yakutsk-srednekolymsky', type: 'town', population: 3277, latitude: 67.4500, longitude: 153.7167 },
  
  { id: 'yuzhno-sakhalinsk-center', name: 'Южно-Сахалинск', regionId: 'sakhalin', type: 'city', population: 200719, latitude: 46.9590, longitude: 142.7386 },
  { id: 'petropavlovsk-kamchatsky-center', name: 'Петропавловск-Камчатский', regionId: 'kamchatka', type: 'city', population: 164900, latitude: 53.0452, longitude: 158.6483 },
  { id: 'blagoveshchensk-center', name: 'Благовещенск', regionId: 'amur', type: 'city', population: 241437, latitude: 50.2903, longitude: 127.5270 },
  { id: 'magadan-center', name: 'Магадан', regionId: 'magadan', type: 'city', population: 91797, latitude: 59.5606, longitude: 150.8102 },
  { id: 'birobidzhan-center', name: 'Биробиджан', regionId: 'jewish', type: 'city', population: 70669, latitude: 48.7947, longitude: 132.9211 },
  { id: 'anadyr-center', name: 'Анадырь', regionId: 'chukotka', type: 'city', population: 13045, latitude: 64.7339, longitude: 177.4975 },
  
  { id: 'simferopol-center', name: 'Симферополь', regionId: 'crimea', type: 'city', population: 336460, latitude: 44.9521, longitude: 34.1024 },
  { id: 'sevastopol-center', name: 'Севастополь', regionId: 'sevastopol', type: 'city', population: 509992, latitude: 44.6167, longitude: 33.5254 },
  { id: 'yalta-city', name: 'Ялта', regionId: 'crimea', type: 'city', population: 76746, latitude: 44.4952, longitude: 34.1661 },
  { id: 'yevpatoria-city', name: 'Евпатория', regionId: 'crimea', type: 'city', population: 105719, latitude: 45.1909, longitude: 33.3665 },
  { id: 'feodosia-city', name: 'Феодосия', regionId: 'crimea', type: 'city', population: 67142, latitude: 45.0317, longitude: 35.3785 },
  { id: 'kerch-city', name: 'Керчь', regionId: 'crimea', type: 'city', population: 147033, latitude: 45.3569, longitude: 36.4706 },
  
  { id: 'ulan-ude-center', name: 'Улан-Удэ', regionId: 'buryatia', type: 'city', population: 439128, latitude: 51.8272, longitude: 107.6063 },
  { id: 'chita-center', name: 'Чита', regionId: 'zabaykalsky', type: 'city', population: 349005, latitude: 52.0330, longitude: 113.4994 },
  { id: 'abakan-center', name: 'Абакан', regionId: 'khakassia', type: 'city', population: 187239, latitude: 53.7153, longitude: 91.4297 },
  { id: 'kyzyl-center', name: 'Кызыл', regionId: 'tuva', type: 'city', population: 119391, latitude: 51.7191, longitude: 94.4536 },
  { id: 'gorno-altaysk-center', name: 'Горно-Алтайск', regionId: 'altai-republic', type: 'city', population: 64861, latitude: 51.9581, longitude: 85.9603 },
  { id: 'elista-center', name: 'Элиста', regionId: 'kalmykia', type: 'city', population: 102578, latitude: 46.3081, longitude: 44.2553 },
  { id: 'maykop-center', name: 'Майкоп', regionId: 'adygea', type: 'city', population: 144246, latitude: 44.6098, longitude: 40.1006 },
  { id: 'nalchik-center', name: 'Нальчик', regionId: 'kabardino-balkaria', type: 'city', population: 240203, latitude: 43.4981, longitude: 43.6189 },
  { id: 'cherkessk-center', name: 'Черкесск', regionId: 'karachay-cherkessia', type: 'city', population: 129069, latitude: 44.2233, longitude: 42.0578 },
  { id: 'saransk-center', name: 'Саранск', regionId: 'mordovia', type: 'city', population: 297415, latitude: 54.1838, longitude: 45.1749 },
  { id: 'yoshkar-ola-center', name: 'Йошкар-Ола', regionId: 'mariy-el', type: 'city', population: 277461, latitude: 56.6344, longitude: 47.8908 },
  { id: 'izhevsk-center', name: 'Ижевск', regionId: 'udmurtia', type: 'city', population: 648146, latitude: 56.8498, longitude: 53.2045 },
  { id: 'vladimir-center', name: 'Владимир', regionId: 'vladimir', type: 'city', population: 349951, latitude: 56.1366, longitude: 40.3966 },
  { id: 'saratov-center', name: 'Саратов', regionId: 'saratov', type: 'city', population: 830155, latitude: 51.5406, longitude: 46.0086 },
  { id: 'belgorod-center', name: 'Белгород', regionId: 'belgorod', type: 'city', population: 391554, latitude: 50.5950, longitude: 36.5870 },
  { id: 'kostroma-center', name: 'Кострома', regionId: 'kostroma', type: 'city', population: 277648, latitude: 57.7665, longitude: 40.9265 },
  { id: 'orenburg-center', name: 'Оренбург', regionId: 'orenburg', type: 'city', population: 572188, latitude: 51.7727, longitude: 55.0988 },
  { id: 'ulyanovsk-center', name: 'Ульяновск', regionId: 'ulyanovsk', type: 'city', population: 613786, latitude: 54.3142, longitude: 48.4031 },
  { id: 'tambov-center', name: 'Тамбов', regionId: 'tambov', type: 'city', population: 261803, latitude: 52.7213, longitude: 41.4522 },
  { id: 'kaluga-center', name: 'Калуга', regionId: 'kaluga', type: 'city', population: 332039, latitude: 54.5293, longitude: 36.2754 },
  { id: 'smolensk-center', name: 'Смоленск', regionId: 'smolensk', type: 'city', population: 320991, latitude: 54.7818, longitude: 32.0401 },
  { id: 'oryol-center', name: 'Орёл', regionId: 'oryol', type: 'city', population: 301731, latitude: 52.9651, longitude: 36.0785 },
  { id: 'stavropol-center', name: 'Ставрополь', regionId: 'stavropol', type: 'city', population: 547820, latitude: 45.0428, longitude: 41.9734 },
];

export function findSettlementByCoordinates(latitude: number, longitude: number, maxDistance: number = 100): Settlement | null {
  let closestSettlement: Settlement | null = null;
  let minDistance = maxDistance;

  for (const settlement of SETTLEMENTS) {
    if (!settlement.latitude || !settlement.longitude) continue;

    const distance = calculateDistance(
      latitude,
      longitude,
      settlement.latitude,
      settlement.longitude
    );

    if (distance < minDistance) {
      minDistance = distance;
      closestSettlement = settlement;
    }
  }

  return closestSettlement;
}

export function findSettlementByName(name: string): Settlement | null {
  const normalizedName = name.toLowerCase().trim();
  
  return SETTLEMENTS.find(settlement => 
    settlement.name.toLowerCase() === normalizedName ||
    settlement.name.toLowerCase().includes(normalizedName) ||
    normalizedName.includes(settlement.name.toLowerCase())
  ) || null;
}

export function getSettlementsByRegion(regionId: string): Settlement[] {
  return SETTLEMENTS.filter(s => s.regionId === regionId);
}

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
