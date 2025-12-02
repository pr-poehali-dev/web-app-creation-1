export interface Region {
  id: string;
  name: string;
  federalDistrict: string;
}

export const FEDERAL_DISTRICTS = [
  { id: 'central', name: 'Центральный ФО' },
  { id: 'northwestern', name: 'Северо-Западный ФО' },
  { id: 'southern', name: 'Южный ФО' },
  { id: 'north-caucasian', name: 'Северо-Кавказский ФО' },
  { id: 'volga', name: 'Приволжский ФО' },
  { id: 'ural', name: 'Уральский ФО' },
  { id: 'siberian', name: 'Сибирский ФО' },
  { id: 'far-eastern', name: 'Дальневосточный ФО' },
];

export const REGIONS: Region[] = [
  { id: 'moscow', name: 'Москва', federalDistrict: 'central' },
  { id: 'moscow-region', name: 'Московская область', federalDistrict: 'central' },
  { id: 'belgorod', name: 'Белгородская область', federalDistrict: 'central' },
  { id: 'bryansk', name: 'Брянская область', federalDistrict: 'central' },
  { id: 'vladimir', name: 'Владимирская область', federalDistrict: 'central' },
  { id: 'voronezh', name: 'Воронежская область', federalDistrict: 'central' },
  { id: 'ivanovo', name: 'Ивановская область', federalDistrict: 'central' },
  { id: 'kaluga', name: 'Калужская область', federalDistrict: 'central' },
  { id: 'kostroma', name: 'Костромская область', federalDistrict: 'central' },
  { id: 'kursk', name: 'Курская область', federalDistrict: 'central' },
  { id: 'lipetsk', name: 'Липецкая область', federalDistrict: 'central' },
  { id: 'oryol', name: 'Орловская область', federalDistrict: 'central' },
  { id: 'ryazan', name: 'Рязанская область', federalDistrict: 'central' },
  { id: 'smolensk', name: 'Смоленская область', federalDistrict: 'central' },
  { id: 'tambov', name: 'Тамбовская область', federalDistrict: 'central' },
  { id: 'tver', name: 'Тверская область', federalDistrict: 'central' },
  { id: 'tula', name: 'Тульская область', federalDistrict: 'central' },
  { id: 'yaroslavl', name: 'Ярославская область', federalDistrict: 'central' },

  { id: 'spb', name: 'Санкт-Петербург', federalDistrict: 'northwestern' },
  { id: 'leningrad', name: 'Ленинградская область', federalDistrict: 'northwestern' },
  { id: 'karelia', name: 'Республика Карелия', federalDistrict: 'northwestern' },
  { id: 'komi', name: 'Республика Коми', federalDistrict: 'northwestern' },
  { id: 'arkhangelsk', name: 'Архангельская область', federalDistrict: 'northwestern' },
  { id: 'nenets', name: 'Ненецкий АО', federalDistrict: 'northwestern' },
  { id: 'vologda', name: 'Вологодская область', federalDistrict: 'northwestern' },
  { id: 'kaliningrad', name: 'Калининградская область', federalDistrict: 'northwestern' },
  { id: 'murmansk', name: 'Мурманская область', federalDistrict: 'northwestern' },
  { id: 'novgorod', name: 'Новгородская область', federalDistrict: 'northwestern' },
  { id: 'pskov', name: 'Псковская область', federalDistrict: 'northwestern' },

  { id: 'adygea', name: 'Республика Адыгея', federalDistrict: 'southern' },
  { id: 'kalmykia', name: 'Республика Калмыкия', federalDistrict: 'southern' },
  { id: 'crimea', name: 'Республика Крым', federalDistrict: 'southern' },
  { id: 'krasnodar', name: 'Краснодарский край', federalDistrict: 'southern' },
  { id: 'astrakhan', name: 'Астраханская область', federalDistrict: 'southern' },
  { id: 'volgograd', name: 'Волгоградская область', federalDistrict: 'southern' },
  { id: 'rostov', name: 'Ростовская область', federalDistrict: 'southern' },
  { id: 'sevastopol', name: 'Севастополь', federalDistrict: 'southern' },

  { id: 'dagestan', name: 'Республика Дагестан', federalDistrict: 'north-caucasian' },
  { id: 'ingushetia', name: 'Республика Ингушетия', federalDistrict: 'north-caucasian' },
  { id: 'kabardino-balkaria', name: 'Кабардино-Балкарская Республика', federalDistrict: 'north-caucasian' },
  { id: 'karachaevo-cherkessia', name: 'Карачаево-Черкесская Республика', federalDistrict: 'north-caucasian' },
  { id: 'north-ossetia', name: 'Республика Северная Осетия — Алания', federalDistrict: 'north-caucasian' },
  { id: 'chechnya', name: 'Чеченская Республика', federalDistrict: 'north-caucasian' },
  { id: 'stavropol', name: 'Ставропольский край', federalDistrict: 'north-caucasian' },

  { id: 'bashkortostan', name: 'Республика Башкортостан', federalDistrict: 'volga' },
  { id: 'mariy-el', name: 'Республика Марий Эл', federalDistrict: 'volga' },
  { id: 'mordovia', name: 'Республика Мордовия', federalDistrict: 'volga' },
  { id: 'tatarstan', name: 'Республика Татарстан', federalDistrict: 'volga' },
  { id: 'udmurtia', name: 'Удмуртская Республика', federalDistrict: 'volga' },
  { id: 'chuvashia', name: 'Чувашская Республика', federalDistrict: 'volga' },
  { id: 'perm', name: 'Пермский край', federalDistrict: 'volga' },
  { id: 'kirov', name: 'Кировская область', federalDistrict: 'volga' },
  { id: 'nizhny-novgorod', name: 'Нижегородская область', federalDistrict: 'volga' },
  { id: 'orenburg', name: 'Оренбургская область', federalDistrict: 'volga' },
  { id: 'penza', name: 'Пензенская область', federalDistrict: 'volga' },
  { id: 'samara', name: 'Самарская область', federalDistrict: 'volga' },
  { id: 'saratov', name: 'Саратовская область', federalDistrict: 'volga' },
  { id: 'ulyanovsk', name: 'Ульяновская область', federalDistrict: 'volga' },

  { id: 'kurgan', name: 'Курганская область', federalDistrict: 'ural' },
  { id: 'sverdlovsk', name: 'Свердловская область', federalDistrict: 'ural' },
  { id: 'tyumen', name: 'Тюменская область', federalDistrict: 'ural' },
  { id: 'khanty-mansi', name: 'Ханты-Мансийский АО — Югра', federalDistrict: 'ural' },
  { id: 'yamalo-nenets', name: 'Ямало-Ненецкий АО', federalDistrict: 'ural' },
  { id: 'chelyabinsk', name: 'Челябинская область', federalDistrict: 'ural' },

  { id: 'altai-republic', name: 'Республика Алтай', federalDistrict: 'siberian' },
  { id: 'tyva', name: 'Республика Тыва', federalDistrict: 'siberian' },
  { id: 'khakassia', name: 'Республика Хакасия', federalDistrict: 'siberian' },
  { id: 'altai-krai', name: 'Алтайский край', federalDistrict: 'siberian' },
  { id: 'krasnoyarsk', name: 'Красноярский край', federalDistrict: 'siberian' },
  { id: 'irkutsk', name: 'Иркутская область', federalDistrict: 'siberian' },
  { id: 'kemerovo', name: 'Кемеровская область — Кузбасс', federalDistrict: 'siberian' },
  { id: 'novosibirsk', name: 'Новосибирская область', federalDistrict: 'siberian' },
  { id: 'omsk', name: 'Омская область', federalDistrict: 'siberian' },
  { id: 'tomsk', name: 'Томская область', federalDistrict: 'siberian' },

  { id: 'buryatia', name: 'Республика Бурятия', federalDistrict: 'far-eastern' },
  { id: 'sakha', name: 'Республика Саха (Якутия)', federalDistrict: 'far-eastern' },
  { id: 'zabaykalsky', name: 'Забайкальский край', federalDistrict: 'far-eastern' },
  { id: 'kamchatka', name: 'Камчатский край', federalDistrict: 'far-eastern' },
  { id: 'primorsky', name: 'Приморский край', federalDistrict: 'far-eastern' },
  { id: 'khabarovsk', name: 'Хабаровский край', federalDistrict: 'far-eastern' },
  { id: 'amur', name: 'Амурская область', federalDistrict: 'far-eastern' },
  { id: 'magadan', name: 'Магаданская область', federalDistrict: 'far-eastern' },
  { id: 'sakhalin', name: 'Сахалинская область', federalDistrict: 'far-eastern' },
  { id: 'jewish', name: 'Еврейская автономная область', federalDistrict: 'far-eastern' },
  { id: 'chukotka', name: 'Чукотский АО', federalDistrict: 'far-eastern' },
];

export const REGION_KEYWORDS: Record<string, string[]> = {
  'moscow': ['москва', 'moscow'],
  'spb': ['санкт-петербург', 'петербург', 'saint petersburg', 'spb', 'питер'],
  'sakha': ['якутия', 'yakutia', 'якутск', 'yakutsk', 'саха'],
  'krasnodar': ['краснодар', 'krasnodar', 'сочи', 'sochi'],
  'sverdlovsk': ['екатеринбург', 'yekaterinburg', 'свердловск'],
  'novosibirsk': ['новосибирск', 'novosibirsk'],
  'tatarstan': ['татарстан', 'tatarstan', 'казань', 'kazan'],
  'khabarovsk': ['хабаровск', 'khabarovsk'],
  'primorsky': ['владивосток', 'vladivostok', 'приморский'],
  'krasnoyarsk': ['красноярск', 'krasnoyarsk'],
  'samara': ['самара', 'samara'],
  'rostov': ['ростов', 'rostov', 'ростов-на-дону'],
  'bashkortostan': ['башкортостан', 'bashkortostan', 'уфа', 'ufa'],
  'perm': ['пермь', 'perm'],
  'volgograd': ['волгоград', 'volgograd'],
  'voronezh': ['воронеж', 'voronezh'],
  'nizhny-novgorod': ['нижний новгород', 'nizhny novgorod'],
  'chelyabinsk': ['челябинск', 'chelyabinsk'],
  'omsk': ['омск', 'omsk'],
  'tyumen': ['тюмень', 'tyumen'],
  'khanty-mansi': ['ханты-мансийск', 'khanty-mansiysk', 'сургут', 'surgut', 'нижневартовск'],
  'yamalo-nenets': ['ямало-ненецкий', 'салехард', 'новый уренгой'],
  'irkutsk': ['иркутск', 'irkutsk'],
  'dagestan': ['дагестан', 'dagestan', 'махачкала', 'makhachkala'],
  'crimea': ['крым', 'crimea', 'симферополь', 'simferopol'],
  'kamchatka': ['камчатка', 'kamchatka', 'петропавловск-камчатский'],
  'sakhalin': ['сахалин', 'sakhalin', 'южно-сахалинск'],
  'murmansk': ['мурманск', 'murmansk'],
  'kaliningrad': ['калининград', 'kaliningrad'],
  'arkhangelsk': ['архангельск', 'arkhangelsk'],
};

export function findRegionByLocation(city: string, region: string): string {
  const searchText = `${city} ${region}`.toLowerCase();
  
  console.log('Finding region for:', { city, region, searchText });
  
  for (const [regionId, keywords] of Object.entries(REGION_KEYWORDS)) {
    for (const keyword of keywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        console.log('Found region:', regionId, 'by keyword:', keyword);
        return regionId;
      }
    }
  }
  
  const regionData = REGIONS.find(r => 
    r.name.toLowerCase().includes(searchText) || 
    searchText.includes(r.name.toLowerCase())
  );
  
  if (regionData) {
    console.log('Found region by name match:', regionData.id);
    return regionData.id;
  }
  
  console.log('No region found, returning all');
  return 'all';
}

export function getRegionsByFederalDistrict(federalDistrictId: string): Region[] {
  return REGIONS.filter(r => r.federalDistrict === federalDistrictId);
}