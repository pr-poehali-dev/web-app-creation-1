export interface Settlement {
  id: string;
  name: string;
  districtId: string;
}

export const SETTLEMENTS: Settlement[] = [
  { id: 'moscow', name: 'г. Москва', districtId: 'moscow' },
  { id: 'spb', name: 'г. Санкт-Петербург', districtId: 'spb' },
  { id: 'novosibirsk', name: 'г. Новосибирск', districtId: 'novosibirsk' },
  { id: 'yekaterinburg', name: 'г. Екатеринбург', districtId: 'sverdlovsk' },
  { id: 'kazan', name: 'г. Казань', districtId: 'tatarstan' },
  { id: 'nizhny-novgorod', name: 'г. Нижний Новгород', districtId: 'nizhny-novgorod' },
  { id: 'chelyabinsk', name: 'г. Челябинск', districtId: 'chelyabinsk' },
  { id: 'samara', name: 'г. Самара', districtId: 'samara' },
  { id: 'omsk', name: 'г. Омск', districtId: 'omsk' },
  { id: 'rostov-na-donu', name: 'г. Ростов-на-Дону', districtId: 'rostov' },
  { id: 'ufa', name: 'г. Уфа', districtId: 'bashkortostan' },
  { id: 'krasnoyarsk', name: 'г. Красноярск', districtId: 'krasnoyarsk' },
  { id: 'voronezh', name: 'г. Воронеж', districtId: 'voronezh' },
  { id: 'perm', name: 'г. Пермь', districtId: 'perm' },
  { id: 'volgograd', name: 'г. Волгоград', districtId: 'volgograd' },
  { id: 'krasnodar', name: 'г. Краснодар', districtId: 'krasnodar' },
  { id: 'saratov', name: 'г. Саратов', districtId: 'saratov' },
  { id: 'tyumen', name: 'г. Тюмень', districtId: 'tyumen' },
  { id: 'tolyatti', name: 'г. Тольятти', districtId: 'samara' },
  { id: 'izhevsk', name: 'г. Ижевск', districtId: 'udmurtia' },
  { id: 'barnaul', name: 'г. Барнаул', districtId: 'altai-krai' },
  { id: 'ulyanovsk', name: 'г. Ульяновск', districtId: 'ulyanovsk' },
  { id: 'irkutsk', name: 'г. Иркутск', districtId: 'irkutsk' },
  { id: 'khabarovsk', name: 'г. Хабаровск', districtId: 'khabarovsk' },
  { id: 'yaroslavl', name: 'г. Ярославль', districtId: 'yaroslavl' },
  { id: 'vladivostok', name: 'г. Владивосток', districtId: 'primorsky' },
  { id: 'makhachkala', name: 'г. Махачкала', districtId: 'dagestan' },
  { id: 'tomsk', name: 'г. Томск', districtId: 'tomsk' },
  { id: 'orenburg', name: 'г. Оренбург', districtId: 'orenburg' },
  { id: 'kemerovo', name: 'г. Кемерово', districtId: 'kemerovo' },
  { id: 'novokuznetsk', name: 'г. Новокузнецк', districtId: 'kemerovo' },
  { id: 'ryazan', name: 'г. Рязань', districtId: 'ryazan' },
  { id: 'naberezhnye-chelny', name: 'г. Набережные Челны', districtId: 'tatarstan' },
  { id: 'astrakhan', name: 'г. Астрахань', districtId: 'astrakhan' },
  { id: 'penza', name: 'г. Пенза', districtId: 'penza' },
  { id: 'kirov', name: 'г. Киров', districtId: 'kirov' },
  { id: 'lipetsk', name: 'г. Липецк', districtId: 'lipetsk' },
  { id: 'cheboksary', name: 'г. Чебоксары', districtId: 'chuvashia' },
  { id: 'kaliningrad', name: 'г. Калининград', districtId: 'kaliningrad' },
  { id: 'tula', name: 'г. Тула', districtId: 'tula' },
  { id: 'kursk', name: 'г. Курск', districtId: 'kursk' },
  { id: 'stavropol', name: 'г. Ставрополь', districtId: 'stavropol' },
  { id: 'ulan-ude', name: 'г. Улан-Удэ', districtId: 'buryatia' },
  { id: 'tver', name: 'г. Тверь', districtId: 'tver' },
  { id: 'magnitogorsk', name: 'г. Магнитогорск', districtId: 'chelyabinsk' },
  { id: 'ivanovo', name: 'г. Иваново', districtId: 'ivanovo' },
  { id: 'bryansk', name: 'г. Брянск', districtId: 'bryansk' },
  { id: 'belgorod', name: 'г. Белгород', districtId: 'belgorod' },
  { id: 'surgut', name: 'г. Сургут', districtId: 'khanty-mansi' },
  { id: 'vladimir', name: 'г. Владимир', districtId: 'vladimir' },
  { id: 'chita', name: 'г. Чита', districtId: 'zabaykalsky' },
  { id: 'nizhny-tagil', name: 'г. Нижний Тагил', districtId: 'sverdlovsk' },
  { id: 'arkhangelsk', name: 'г. Архангельск', districtId: 'arkhangelsk' },
  { id: 'simferopol', name: 'г. Симферополь', districtId: 'crimea' },
  { id: 'kaluga', name: 'г. Калуга', districtId: 'kaluga' },
  { id: 'smolensk', name: 'г. Смоленск', districtId: 'smolensk' },
  { id: 'volzhsky', name: 'г. Волжский', districtId: 'volgograd' },
  { id: 'yakutsk', name: 'г. Якутск', districtId: 'yakutia' },
  { id: 'murmansk', name: 'г. Мурманск', districtId: 'murmansk' },
  { id: 'yuzhno-sakhalinsk', name: 'г. Южно-Сахалинск', districtId: 'sakhalin' },
  { id: 'petropavlovsk-kamchatsky', name: 'г. Петропавловск-Камчатский', districtId: 'kamchatka' },
  { id: 'vologda', name: 'г. Вологда', districtId: 'vologda' },
  { id: 'saransk', name: 'г. Саранск', districtId: 'mordovia' },
  { id: 'tambov', name: 'г. Тамбов', districtId: 'tambov' },
  { id: 'vladikavkaz', name: 'г. Владикавказ', districtId: 'north-ossetia' },
  { id: 'grozny', name: 'г. Грозный', districtId: 'chechnya' },
  { id: 'kostroma', name: 'г. Кострома', districtId: 'kostroma' },
  { id: 'petrozavodsk', name: 'г. Петрозаводск', districtId: 'karelia' },
  { id: 'nizhnevartovsk', name: 'г. Нижневартовск', districtId: 'khanty-mansi' },
  { id: 'novokuybyshevsk', name: 'г. Новокуйбышевск', districtId: 'samara' },
  { id: 'syktyvkar', name: 'г. Сыктывкар', districtId: 'komi' },
  { id: 'yoshkar-ola', name: 'г. Йошкар-Ола', districtId: 'mariy-el' },
];

export function findSettlementByName(query: string): Settlement | undefined {
  const normalizedQuery = query.toLowerCase().trim();
  
  return SETTLEMENTS.find(settlement => 
    settlement.name.toLowerCase().includes(normalizedQuery) ||
    normalizedQuery.includes(settlement.name.toLowerCase())
  );
}

export function getSettlementsByDistrict(districtId: string): Settlement[] {
  return SETTLEMENTS.filter(s => s.districtId === districtId);
}
