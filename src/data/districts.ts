export interface District {
  id: string;
  name: string;
  regionId: string;
  type: 'city' | 'district' | 'municipality';
}

export const DISTRICTS: District[] = [
  { id: 'moscow-cao', name: 'Центральный административный округ', regionId: 'moscow', type: 'district' },
  { id: 'moscow-sao', name: 'Северный административный округ', regionId: 'moscow', type: 'district' },
  { id: 'moscow-svao', name: 'Северо-Восточный административный округ', regionId: 'moscow', type: 'district' },
  { id: 'moscow-vao', name: 'Восточный административный округ', regionId: 'moscow', type: 'district' },
  { id: 'moscow-uvao', name: 'Юго-Восточный административный округ', regionId: 'moscow', type: 'district' },
  { id: 'moscow-uao', name: 'Южный административный округ', regionId: 'moscow', type: 'district' },
  { id: 'moscow-uzao', name: 'Юго-Западный административный округ', regionId: 'moscow', type: 'district' },
  { id: 'moscow-zao', name: 'Западный административный округ', regionId: 'moscow', type: 'district' },
  { id: 'moscow-szao', name: 'Северо-Западный административный округ', regionId: 'moscow', type: 'district' },
  { id: 'moscow-zelenograd', name: 'Зеленоградский административный округ', regionId: 'moscow', type: 'district' },
  { id: 'moscow-novomoskovsky', name: 'Новомосковский административный округ', regionId: 'moscow', type: 'district' },
  { id: 'moscow-troitsky', name: 'Троицкий административный округ', regionId: 'moscow', type: 'district' },

  { id: 'spb-admiralteisky', name: 'Адмиралтейский район', regionId: 'spb', type: 'district' },
  { id: 'spb-vasileostrovsky', name: 'Васильеостровский район', regionId: 'spb', type: 'district' },
  { id: 'spb-vyborgsky', name: 'Выборгский район', regionId: 'spb', type: 'district' },
  { id: 'spb-kalininsky', name: 'Калининский район', regionId: 'spb', type: 'district' },
  { id: 'spb-kirovsky', name: 'Кировский район', regionId: 'spb', type: 'district' },
  { id: 'spb-kolpinsky', name: 'Колпинский район', regionId: 'spb', type: 'district' },
  { id: 'spb-krasnogvardeisky', name: 'Красногвардейский район', regionId: 'spb', type: 'district' },
  { id: 'spb-krasnoselsky', name: 'Красносельский район', regionId: 'spb', type: 'district' },
  { id: 'spb-kronshtadtsky', name: 'Кронштадтский район', regionId: 'spb', type: 'district' },
  { id: 'spb-kurortny', name: 'Курортный район', regionId: 'spb', type: 'district' },
  { id: 'spb-moskovsky', name: 'Московский район', regionId: 'spb', type: 'district' },
  { id: 'spb-nevsky', name: 'Невский район', regionId: 'spb', type: 'district' },
  { id: 'spb-petrogradsky', name: 'Петроградский район', regionId: 'spb', type: 'district' },
  { id: 'spb-petrodzerzhinskiy', name: 'Петродворцовый район', regionId: 'spb', type: 'district' },
  { id: 'spb-primorsky', name: 'Приморский район', regionId: 'spb', type: 'district' },
  { id: 'spb-pushkinsky', name: 'Пушкинский район', regionId: 'spb', type: 'district' },
  { id: 'spb-frunzensky', name: 'Фрунзенский район', regionId: 'spb', type: 'district' },
  { id: 'spb-centralny', name: 'Центральный район', regionId: 'spb', type: 'district' },

  { id: 'yakutsk-city', name: 'г. Якутск', regionId: 'sakha', type: 'city' },
  { id: 'yakutsk-abyysky', name: 'Абыйский улус', regionId: 'sakha', type: 'district' },
  { id: 'yakutsk-aldansky', name: 'Алданский улус', regionId: 'sakha', type: 'district' },
  { id: 'yakutsk-allaikhovsky', name: 'Аллаиховский улус', regionId: 'sakha', type: 'district' },
  { id: 'yakutsk-amginsky', name: 'Амгинский улус', regionId: 'sakha', type: 'district' },
  { id: 'yakutsk-anabarsky', name: 'Анабарский улус', regionId: 'sakha', type: 'district' },
  { id: 'yakutsk-bulunsky', name: 'Булунский улус', regionId: 'sakha', type: 'district' },
  { id: 'yakutsk-verkhnekolymsky', name: 'Верхнеколымский улус', regionId: 'sakha', type: 'district' },
  { id: 'yakutsk-verkhnevilyuisky', name: 'Верхневилюйский улус', regionId: 'sakha', type: 'district' },
  { id: 'yakutsk-verkhoyansk', name: 'Верхоянский улус', regionId: 'sakha', type: 'district' },
  { id: 'yakutsk-vilyuisky', name: 'Вилюйский улус', regionId: 'sakha', type: 'district' },
  { id: 'yakutsk-gorny', name: 'Горный улус', regionId: 'sakha', type: 'district' },
  { id: 'yakutsk-zhigansky', name: 'Жиганский улус', regionId: 'sakha', type: 'district' },
  { id: 'yakutsk-kobyaisky', name: 'Кобяйский улус', regionId: 'sakha', type: 'district' },
  { id: 'yakutsk-lensky', name: 'Ленский улус', regionId: 'sakha', type: 'district' },
  { id: 'yakutsk-megino-kangalassky', name: 'Мегино-Кангаласский улус', regionId: 'sakha', type: 'district' },
  { id: 'yakutsk-mirny', name: 'Мирнинский улус', regionId: 'sakha', type: 'district' },
  { id: 'yakutsk-momsky', name: 'Момский улус', regionId: 'sakha', type: 'district' },
  { id: 'yakutsk-namsky', name: 'Намский улус', regionId: 'sakha', type: 'district' },
  { id: 'yakutsk-neryungrinsky', name: 'Нерюнгринский улус', regionId: 'sakha', type: 'district' },
  { id: 'yakutsk-nizhnekolymsky', name: 'Нижнеколымский улус', regionId: 'sakha', type: 'district' },
  { id: 'yakutsk-nyurbinsky', name: 'Нюрбинский улус', regionId: 'sakha', type: 'district' },
  { id: 'yakutsk-oymyakonsky', name: 'Оймяконский улус', regionId: 'sakha', type: 'district' },
  { id: 'yakutsk-olekminsk', name: 'Олёкминский улус', regionId: 'sakha', type: 'district' },
  { id: 'yakutsk-oleneksky', name: 'Оленёкский улус', regionId: 'sakha', type: 'district' },
  { id: 'yakutsk-srednekolymsky', name: 'Среднеколымский улус', regionId: 'sakha', type: 'district' },
  { id: 'yakutsk-suntarsky', name: 'Сунтарский улус', regionId: 'sakha', type: 'district' },
  { id: 'yakutsk-tattinsky', name: 'Таттинский улус', regionId: 'sakha', type: 'district' },
  { id: 'yakutsk-tomponsky', name: 'Томпонский улус', regionId: 'sakha', type: 'district' },
  { id: 'yakutsk-ust-aldansky', name: 'Усть-Алданский улус', regionId: 'sakha', type: 'district' },
  { id: 'yakutsk-ust-maisky', name: 'Усть-Майский улус', regionId: 'sakha', type: 'district' },
  { id: 'yakutsk-ust-yansky', name: 'Усть-Янский улус', regionId: 'sakha', type: 'district' },
  { id: 'yakutsk-khangalassky', name: 'Хангаласский улус', regionId: 'sakha', type: 'district' },
  { id: 'yakutsk-churapchinsky', name: 'Чурапчинский улус', regionId: 'sakha', type: 'district' },
  { id: 'yakutsk-evensky', name: 'Эвено-Бытантайский улус', regionId: 'sakha', type: 'district' },

  { id: 'novosibirsk-central', name: 'Центральный район', regionId: 'novosibirsk', type: 'district' },
  { id: 'novosibirsk-zheleznodorozhny', name: 'Железнодорожный район', regionId: 'novosibirsk', type: 'district' },
  { id: 'novosibirsk-zaeltsovsky', name: 'Заельцовский район', regionId: 'novosibirsk', type: 'district' },
  { id: 'novosibirsk-kalininsky', name: 'Калининский район', regionId: 'novosibirsk', type: 'district' },
  { id: 'novosibirsk-kirovsky', name: 'Кировский район', regionId: 'novosibirsk', type: 'district' },
  { id: 'novosibirsk-leninsky', name: 'Ленинский район', regionId: 'novosibirsk', type: 'district' },
  { id: 'novosibirsk-oktyabrsky', name: 'Октябрьский район', regionId: 'novosibirsk', type: 'district' },
  { id: 'novosibirsk-pervomaisky', name: 'Первомайский район', regionId: 'novosibirsk', type: 'district' },
  { id: 'novosibirsk-sovetsky', name: 'Советский район', regionId: 'novosibirsk', type: 'district' },
  { id: 'novosibirsk-dzerzhinsky', name: 'Дзержинский район', regionId: 'novosibirsk', type: 'district' },

  { id: 'ekaterinburg-verh-isetsky', name: 'Верх-Исетский район', regionId: 'sverdlovsk', type: 'district' },
  { id: 'ekaterinburg-zheleznodorozhny', name: 'Железнодорожный район', regionId: 'sverdlovsk', type: 'district' },
  { id: 'ekaterinburg-kirovsky', name: 'Кировский район', regionId: 'sverdlovsk', type: 'district' },
  { id: 'ekaterinburg-leninsky', name: 'Ленинский район', regionId: 'sverdlovsk', type: 'district' },
  { id: 'ekaterinburg-oktyabrsky', name: 'Октябрьский район', regionId: 'sverdlovsk', type: 'district' },
  { id: 'ekaterinburg-ordzhonikidzevsky', name: 'Орджоникидзевский район', regionId: 'sverdlovsk', type: 'district' },
  { id: 'ekaterinburg-chkalovsky', name: 'Чкаловский район', regionId: 'sverdlovsk', type: 'district' },

  // Казань (Татарстан)
  { id: 'kazan-vakhitovsky', name: 'Вахитовский район', regionId: 'tatarstan', type: 'district' },
  { id: 'kazan-aviastroitelny', name: 'Авиастроительный район', regionId: 'tatarstan', type: 'district' },
  { id: 'kazan-kirovsky', name: 'Кировский район', regionId: 'tatarstan', type: 'district' },
  { id: 'kazan-moskovsky', name: 'Московский район', regionId: 'tatarstan', type: 'district' },
  { id: 'kazan-novo-savinovsky', name: 'Ново-Савиновский район', regionId: 'tatarstan', type: 'district' },
  { id: 'kazan-privolzhsky', name: 'Приволжский район', regionId: 'tatarstan', type: 'district' },
  { id: 'kazan-sovetsky', name: 'Советский район', regionId: 'tatarstan', type: 'district' },

  // Нижний Новгород
  { id: 'nn-nizhegorodsky', name: 'Нижегородский район', regionId: 'nizhny-novgorod', type: 'district' },
  { id: 'nn-avtozavodsky', name: 'Автозаводский район', regionId: 'nizhny-novgorod', type: 'district' },
  { id: 'nn-kanавинский', name: 'Канавинский район', regionId: 'nizhny-novgorod', type: 'district' },
  { id: 'nn-leninsky', name: 'Ленинский район', regionId: 'nizhny-novgorod', type: 'district' },
  { id: 'nn-moskovsky', name: 'Московский район', regionId: 'nizhny-novgorod', type: 'district' },
  { id: 'nn-prioksky', name: 'Приокский район', regionId: 'nizhny-novgorod', type: 'district' },
  { id: 'nn-sovetsky', name: 'Советский район', regionId: 'nizhny-novgorod', type: 'district' },
  { id: 'nn-sormovsky', name: 'Сормовский район', regionId: 'nizhny-novgorod', type: 'district' },

  // Челябинск
  { id: 'chelyabinsk-central', name: 'Центральный район', regionId: 'chelyabinsk', type: 'district' },
  { id: 'chelyabinsk-kalininsky', name: 'Калининский район', regionId: 'chelyabinsk', type: 'district' },
  { id: 'chelyabinsk-kurсhatovsky', name: 'Курчатовский район', regionId: 'chelyabinsk', type: 'district' },
  { id: 'chelyabinsk-leninsky', name: 'Ленинский район', regionId: 'chelyabinsk', type: 'district' },
  { id: 'chelyabinsk-metallurgichesky', name: 'Металлургический район', regionId: 'chelyabinsk', type: 'district' },
  { id: 'chelyabinsk-sovetsky', name: 'Советский район', regionId: 'chelyabinsk', type: 'district' },
  { id: 'chelyabinsk-traktorozavodsky', name: 'Тракторозаводский район', regionId: 'chelyabinsk', type: 'district' },

  // Самара
  { id: 'samara-leninsky', name: 'Ленинский район', regionId: 'samara', type: 'district' },
  { id: 'samara-zheleznodorozhny', name: 'Железнодорожный район', regionId: 'samara', type: 'district' },
  { id: 'samara-kirovsky', name: 'Кировский район', regionId: 'samara', type: 'district' },
  { id: 'samara-krasnoglinsky', name: 'Красноглинский район', regionId: 'samara', type: 'district' },
  { id: 'samara-kuybyshevsky', name: 'Куйбышевский район', regionId: 'samara', type: 'district' },
  { id: 'samara-oktyabrsky', name: 'Октябрьский район', regionId: 'samara', type: 'district' },
  { id: 'samara-promyshlenny', name: 'Промышленный район', regionId: 'samara', type: 'district' },
  { id: 'samara-sovetsky', name: 'Советский район', regionId: 'samara', type: 'district' },
  { id: 'samara-samarsky', name: 'Самарский район', regionId: 'samara', type: 'district' },

  // Омск
  { id: 'omsk-central', name: 'Центральный округ', regionId: 'omsk', type: 'district' },
  { id: 'omsk-kirovsky', name: 'Кировский округ', regionId: 'omsk', type: 'district' },
  { id: 'omsk-leninsky', name: 'Ленинский округ', regionId: 'omsk', type: 'district' },
  { id: 'omsk-oktyabrsky', name: 'Октябрьский округ', regionId: 'omsk', type: 'district' },
  { id: 'omsk-sovetsky', name: 'Советский округ', regionId: 'omsk', type: 'district' },

  // Ростов-на-Дону
  { id: 'rostov-leninsky', name: 'Ленинский район', regionId: 'rostov', type: 'district' },
  { id: 'rostov-kirovsky', name: 'Кировский район', regionId: 'rostov', type: 'district' },
  { id: 'rostov-oktyabrsky', name: 'Октябрьский район', regionId: 'rostov', type: 'district' },
  { id: 'rostov-pervomaisky', name: 'Первомайский район', regionId: 'rostov', type: 'district' },
  { id: 'rostov-proletarsky', name: 'Пролетарский район', regionId: 'rostov', type: 'district' },
  { id: 'rostov-sovetsky', name: 'Советский район', regionId: 'rostov', type: 'district' },
  { id: 'rostov-zheleznodorozhny', name: 'Железнодорожный район', regionId: 'rostov', type: 'district' },
  { id: 'rostov-voroshilovsky', name: 'Ворошиловский район', regionId: 'rostov', type: 'district' },

  // Уфа
  { id: 'ufa-demsky', name: 'Демский район', regionId: 'bashkortostan', type: 'district' },
  { id: 'ufa-kalinsky', name: 'Калининский район', regionId: 'bashkortostan', type: 'district' },
  { id: 'ufa-kirovsky', name: 'Кировский район', regionId: 'bashkortostan', type: 'district' },
  { id: 'ufa-leninsky', name: 'Ленинский район', regionId: 'bashkortostan', type: 'district' },
  { id: 'ufa-oktyabrsky', name: 'Октябрьский район', regionId: 'bashkortostan', type: 'district' },
  { id: 'ufa-ordzhonikidze', name: 'Орджоникидзевский район', regionId: 'bashkortostan', type: 'district' },
  { id: 'ufa-sovetsky', name: 'Советский район', regionId: 'bashkortostan', type: 'district' },

  // Красноярск
  { id: 'krasnoyarsk-central', name: 'Центральный район', regionId: 'krasnoyarsk', type: 'district' },
  { id: 'krasnoyarsk-zheleznodorozhny', name: 'Железнодорожный район', regionId: 'krasnoyarsk', type: 'district' },
  { id: 'krasnoyarsk-kirovsky', name: 'Кировский район', regionId: 'krasnoyarsk', type: 'district' },
  { id: 'krasnoyarsk-leninsky', name: 'Ленинский район', regionId: 'krasnoyarsk', type: 'district' },
  { id: 'krasnoyarsk-oktyabrsky', name: 'Октябрьский район', regionId: 'krasnoyarsk', type: 'district' },
  { id: 'krasnoyarsk-sovetsky', name: 'Советский район', regionId: 'krasnoyarsk', type: 'district' },
  { id: 'krasnoyarsk-sverdlovsky', name: 'Свердловский район', regionId: 'krasnoyarsk', type: 'district' },

  // Воронеж
  { id: 'voronezh-central', name: 'Центральный район', regionId: 'voronezh', type: 'district' },
  { id: 'voronezh-kominternovsky', name: 'Коминтерновский район', regionId: 'voronezh', type: 'district' },
  { id: 'voronezh-leninsky', name: 'Ленинский район', regionId: 'voronezh', type: 'district' },
  { id: 'voronezh-levoberezhny', name: 'Левобережный район', regionId: 'voronezh', type: 'district' },
  { id: 'voronezh-sovetsky', name: 'Советский район', regionId: 'voronezh', type: 'district' },
  { id: 'voronezh-zheleznodorozhny', name: 'Железнодорожный район', regionId: 'voronezh', type: 'district' },

  // Пермь
  { id: 'perm-leninsky', name: 'Ленинский район', regionId: 'perm', type: 'district' },
  { id: 'perm-dzerzhinsky', name: 'Дзержинский район', regionId: 'perm', type: 'district' },
  { id: 'perm-industrialny', name: 'Индустриальный район', regionId: 'perm', type: 'district' },
  { id: 'perm-kirovsky', name: 'Кировский район', regionId: 'perm', type: 'district' },
  { id: 'perm-motovilikhinsky', name: 'Мотовилихинский район', regionId: 'perm', type: 'district' },
  { id: 'perm-ordzhonikidzevsky', name: 'Орджоникидзевский район', regionId: 'perm', type: 'district' },
  { id: 'perm-sverdlovsky', name: 'Свердловский район', regionId: 'perm', type: 'district' },

  // Волгоград
  { id: 'volgograd-central', name: 'Центральный район', regionId: 'volgograd', type: 'district' },
  { id: 'volgograd-dzerzhinsk', name: 'Дзержинский район', regionId: 'volgograd', type: 'district' },
  { id: 'volgograd-kirovsky', name: 'Кировский район', regionId: 'volgograd', type: 'district' },
  { id: 'volgograd-krasnooktяbrsky', name: 'Краснооктябрьский район', regionId: 'volgograd', type: 'district' },
  { id: 'volgograd-krasnoarmeisky', name: 'Красноармейский район', regionId: 'volgograd', type: 'district' },
  { id: 'volgograd-sovetsky', name: 'Советский район', regionId: 'volgograd', type: 'district' },
  { id: 'volgograd-traktorozavodsky', name: 'Тракторозаводский район', regionId: 'volgograd', type: 'district' },
  { id: 'volgograd-voroshilovsky', name: 'Ворошиловский район', regionId: 'volgograd', type: 'district' },
];

export function getDistrictsByRegion(regionId: string): District[] {
  return DISTRICTS.filter(district => district.regionId === regionId);
}

export function findDistrictByName(districtName: string, regionId?: string): District | undefined {
  const normalizedSearch = districtName.toLowerCase().trim();
  
  return DISTRICTS.find(district => {
    const matchesName = district.name.toLowerCase().includes(normalizedSearch);
    const matchesRegion = !regionId || district.regionId === regionId;
    return matchesName && matchesRegion;
  });
}