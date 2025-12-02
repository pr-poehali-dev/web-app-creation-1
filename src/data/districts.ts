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

  // Московская область
  { id: 'moscow-region-balashikha', name: 'Балашиха', regionId: 'moscow-region', type: 'city' },
  { id: 'moscow-region-khimki', name: 'Химки', regionId: 'moscow-region', type: 'city' },
  { id: 'moscow-region-podolsk', name: 'Подольск', regionId: 'moscow-region', type: 'city' },
  { id: 'moscow-region-mytishchi', name: 'Мытищи', regionId: 'moscow-region', type: 'city' },
  { id: 'moscow-region-kolomna', name: 'Коломна', regionId: 'moscow-region', type: 'city' },
  { id: 'moscow-region-lyubertsy', name: 'Люберцы', regionId: 'moscow-region', type: 'city' },
  { id: 'moscow-region-elektrostal', name: 'Электросталь', regionId: 'moscow-region', type: 'city' },
  { id: 'moscow-region-odintsovo', name: 'Одинцово', regionId: 'moscow-region', type: 'city' },

  // Ленинградская область
  { id: 'leningrad-gatchina', name: 'Гатчина', regionId: 'leningrad', type: 'city' },
  { id: 'leningrad-vyborg', name: 'Выборг', regionId: 'leningrad', type: 'city' },
  { id: 'leningrad-vsevolozhsk', name: 'Всеволожск', regionId: 'leningrad', type: 'city' },
  { id: 'leningrad-tikhvin', name: 'Тихвин', regionId: 'leningrad', type: 'city' },
  { id: 'leningrad-kirishi', name: 'Кириши', regionId: 'leningrad', type: 'city' },

  // Краснодарский край
  { id: 'krasnodar-krasnodar', name: 'Краснодар', regionId: 'krasnodar', type: 'city' },
  { id: 'krasnodar-sochi', name: 'Сочи', regionId: 'krasnodar', type: 'city' },
  { id: 'krasnodar-novorossiysk', name: 'Новороссийск', regionId: 'krasnodar', type: 'city' },
  { id: 'krasnodar-armavir', name: 'Армавир', regionId: 'krasnodar', type: 'city' },
  { id: 'krasnodar-gelendzhik', name: 'Геленджик', regionId: 'krasnodar', type: 'city' },
  { id: 'krasnodar-tuapse', name: 'Туапсе', regionId: 'krasnodar', type: 'city' },

  // Свердловская область (дополнительные города)
  { id: 'sverdlovsk-nizhny-tagil', name: 'Нижний Тагил', regionId: 'sverdlovsk', type: 'city' },
  { id: 'sverdlovsk-kamensk-uralsky', name: 'Каменск-Уральский', regionId: 'sverdlovsk', type: 'city' },
  { id: 'sverdlovsk-pervouralsk', name: 'Первоуральск', regionId: 'sverdlovsk', type: 'city' },
  { id: 'sverdlovsk-serov', name: 'Серов', regionId: 'sverdlovsk', type: 'city' },

  // Приморский край
  { id: 'primorsky-vladivostok', name: 'Владивосток', regionId: 'primorsky', type: 'city' },
  { id: 'primorsky-ussuriysk', name: 'Уссурийск', regionId: 'primorsky', type: 'city' },
  { id: 'primorsky-nakhodka', name: 'Находка', regionId: 'primorsky', type: 'city' },
  { id: 'primorsky-artem', name: 'Артём', regionId: 'primorsky', type: 'city' },

  // Хабаровский край
  { id: 'khabarovsk-khabarovsk', name: 'Хабаровск', regionId: 'khabarovsk', type: 'city' },
  { id: 'khabarovsk-komsomolsk', name: 'Комсомольск-на-Амуре', regionId: 'khabarovsk', type: 'city' },
  { id: 'khabarovsk-amursk', name: 'Амурск', regionId: 'khabarovsk', type: 'city' },

  // Иркутская область
  { id: 'irkutsk-irkutsk', name: 'Иркутск', regionId: 'irkutsk', type: 'city' },
  { id: 'irkutsk-bratsk', name: 'Братск', regionId: 'irkutsk', type: 'city' },
  { id: 'irkutsk-angarsk', name: 'Ангарск', regionId: 'irkutsk', type: 'city' },
  { id: 'irkutsk-ust-ilimsk', name: 'Усть-Илимск', regionId: 'irkutsk', type: 'city' },

  // Тюменская область
  { id: 'tyumen-tyumen', name: 'Тюмень', regionId: 'tyumen', type: 'city' },
  { id: 'tyumen-tobolsk', name: 'Тобольск', regionId: 'tyumen', type: 'city' },
  { id: 'tyumen-ishim', name: 'Ишим', regionId: 'tyumen', type: 'city' },

  // Ханты-Мансийский АО
  { id: 'khanty-mansi-surgut', name: 'Сургут', regionId: 'khanty-mansi', type: 'city' },
  { id: 'khanty-mansi-nizhnevartovsk', name: 'Нижневартовск', regionId: 'khanty-mansi', type: 'city' },
  { id: 'khanty-mansi-khanty-mansiysk', name: 'Ханты-Мансийск', regionId: 'khanty-mansi', type: 'city' },
  { id: 'khanty-mansi-nefteyugansk', name: 'Нефтеюганск', regionId: 'khanty-mansi', type: 'city' },

  // Ямало-Ненецкий АО
  { id: 'yamalo-nenets-novy-urengoy', name: 'Новый Уренгой', regionId: 'yamalo-nenets', type: 'city' },
  { id: 'yamalo-nenets-noyabrsk', name: 'Ноябрьск', regionId: 'yamalo-nenets', type: 'city' },
  { id: 'yamalo-nenets-salekhard', name: 'Салехард', regionId: 'yamalo-nenets', type: 'city' },

  // Алтайский край
  { id: 'altai-krai-barnaul', name: 'Барнаул', regionId: 'altai-krai', type: 'city' },
  { id: 'altai-krai-biysk', name: 'Бийск', regionId: 'altai-krai', type: 'city' },
  { id: 'altai-krai-rubtsovsk', name: 'Рубцовск', regionId: 'altai-krai', type: 'city' },

  // Кемеровская область
  { id: 'kemerovo-kemerovo', name: 'Кемерово', regionId: 'kemerovo', type: 'city' },
  { id: 'kemerovo-novokuznetsk', name: 'Новокузнецк', regionId: 'kemerovo', type: 'city' },
  { id: 'kemerovo-prokopyevsk', name: 'Прокопьевск', regionId: 'kemerovo', type: 'city' },
  { id: 'kemerovo-leninsk-kuznetsky', name: 'Ленинск-Кузнецкий', regionId: 'kemerovo', type: 'city' },

  // Томская область
  { id: 'tomsk-tomsk', name: 'Томск', regionId: 'tomsk', type: 'city' },
  { id: 'tomsk-seversk', name: 'Северск', regionId: 'tomsk', type: 'city' },
  { id: 'tomsk-strezhevoy', name: 'Стрежевой', regionId: 'tomsk', type: 'city' },

  // Саратовская область
  { id: 'saratov-saratov', name: 'Саратов', regionId: 'saratov', type: 'city' },
  { id: 'saratov-engels', name: 'Энгельс', regionId: 'saratov', type: 'city' },
  { id: 'saratov-balakovo', name: 'Балаково', regionId: 'saratov', type: 'city' },

  // Ульяновская область
  { id: 'ulyanovsk-ulyanovsk', name: 'Ульяновск', regionId: 'ulyanovsk', type: 'city' },
  { id: 'ulyanovsk-dimitrovgrad', name: 'Димитровград', regionId: 'ulyanovsk', type: 'city' },

  // Пензенская область
  { id: 'penza-penza', name: 'Пенза', regionId: 'penza', type: 'city' },
  { id: 'penza-kuznetsk', name: 'Кузнецк', regionId: 'penza', type: 'city' },

  // Оренбургская область
  { id: 'orenburg-orenburg', name: 'Оренбург', regionId: 'orenburg', type: 'city' },
  { id: 'orenburg-orsk', name: 'Орск', regionId: 'orenburg', type: 'city' },
  { id: 'orenburg-novotroitsk', name: 'Новотроицк', regionId: 'orenburg', type: 'city' },

  // Чувашская Республика
  { id: 'chuvashia-cheboksary', name: 'Чебоксары', regionId: 'chuvashia', type: 'city' },
  { id: 'chuvashia-novocheboksarsk', name: 'Новочебоксарск', regionId: 'chuvashia', type: 'city' },

  // Республика Мордовия
  { id: 'mordovia-saransk', name: 'Саранск', regionId: 'mordovia', type: 'city' },
  { id: 'mordovia-ruzaevka', name: 'Рузаевка', regionId: 'mordovia', type: 'city' },

  // Республика Марий Эл
  { id: 'mariy-el-yoshkar-ola', name: 'Йошкар-Ола', regionId: 'mariy-el', type: 'city' },
  { id: 'mariy-el-volzhsk', name: 'Волжск', regionId: 'mariy-el', type: 'city' },

  // Удмуртская Республика
  { id: 'udmurtia-izhevsk', name: 'Ижевск', regionId: 'udmurtia', type: 'city' },
  { id: 'udmurtia-sarapul', name: 'Сарапул', regionId: 'udmurtia', type: 'city' },
  { id: 'udmurtia-votkinsk', name: 'Воткинск', regionId: 'udmurtia', type: 'city' },

  // Кировская область
  { id: 'kirov-kirov', name: 'Киров', regionId: 'kirov', type: 'city' },
  { id: 'kirov-kirovo-chepetsk', name: 'Кирово-Чепецк', regionId: 'kirov', type: 'city' },

  // Ярославская область
  { id: 'yaroslavl-yaroslavl', name: 'Ярославль', regionId: 'yaroslavl', type: 'city' },
  { id: 'yaroslavl-rybinsk', name: 'Рыбинск', regionId: 'yarославl', type: 'city' },

  // Владимирская область
  { id: 'vladimir-vladimir', name: 'Владимир', regionId: 'vladimir', type: 'city' },
  { id: 'vladimir-kovrov', name: 'Ковров', regionId: 'vladimir', type: 'city' },
  { id: 'vladimir-murom', name: 'Муром', regionId: 'vladimir', type: 'city' },

  // Тверская область
  { id: 'tver-tver', name: 'Тверь', regionId: 'tver', type: 'city' },
  { id: 'tver-rzhev', name: 'Ржев', regionId: 'tver', type: 'city' },

  // Рязанская область
  { id: 'ryazan-ryazan', name: 'Рязань', regionId: 'ryazan', type: 'city' },
  { id: 'ryazan-kasimov', name: 'Касимов', regionId: 'ryazan', type: 'city' },

  // Тульская область
  { id: 'tula-tula', name: 'Тула', regionId: 'tula', type: 'city' },
  { id: 'tula-novomoskovsk', name: 'Новомосковск', regionId: 'tula', type: 'city' },

  // Липецкая область
  { id: 'lipetsk-lipetsk', name: 'Липецк', regionId: 'lipetsk', type: 'city' },
  { id: 'lipetsk-yelets', name: 'Елец', regionId: 'lipetsk', type: 'city' },

  // Калужская область
  { id: 'kaluga-kaluga', name: 'Калуга', regionId: 'kaluga', type: 'city' },
  { id: 'kaluga-obninsk', name: 'Обнинск', regionId: 'kaluga', type: 'city' },

  // Брянская область
  { id: 'bryansk-bryansk', name: 'Брянск', regionId: 'bryansk', type: 'city' },
  { id: 'bryansk-klintsy', name: 'Клинцы', regionId: 'bryansk', type: 'city' },

  // Ивановская область
  { id: 'ivanovo-ivanovo', name: 'Иваново', regionId: 'ivanovo', type: 'city' },
  { id: 'ivanovo-kineshma', name: 'Кинешма', regionId: 'ivanovo', type: 'city' },

  // Курская область
  { id: 'kursk-kursk', name: 'Курск', regionId: 'kursk', type: 'city' },
  { id: 'kursk-zheleznogorsk', name: 'Железногорск', regionId: 'kursk', type: 'city' },

  // Белгородская область
  { id: 'belgorod-belgorod', name: 'Белгород', regionId: 'belgorod', type: 'city' },
  { id: 'belgorod-stary-oskol', name: 'Старый Оскол', regionId: 'belgorod', type: 'city' },

  // Орловская область
  { id: 'oryol-oryol', name: 'Орёл', regionId: 'oryol', type: 'city' },
  { id: 'oryol-livny', name: 'Ливны', regionId: 'oryol', type: 'city' },

  // Смоленская область
  { id: 'smolensk-smolensk', name: 'Смоленск', regionId: 'smolensk', type: 'city' },
  { id: 'smolensk-vyazma', name: 'Вязьма', regionId: 'smolensk', type: 'city' },

  // Тамбовская область
  { id: 'tambov-tambov', name: 'Тамбов', regionId: 'tambov', type: 'city' },
  { id: 'tambov-michurinsk', name: 'Мичуринск', regionId: 'tambov', type: 'city' },

  // Костромская область
  { id: 'kostroma-kostroma', name: 'Кострома', regionId: 'kostroma', type: 'city' },
  { id: 'kostroma-buy', name: 'Буй', regionId: 'kostroma', type: 'city' },

  // Республика Карелия
  { id: 'karelia-petrozavodsk', name: 'Петрозаводск', regionId: 'karelia', type: 'city' },
  { id: 'karelia-kondopoga', name: 'Кондопога', regionId: 'karelia', type: 'city' },

  // Республика Коми
  { id: 'komi-syktyvkar', name: 'Сыктывкар', regionId: 'komi', type: 'city' },
  { id: 'komi-ukhta', name: 'Ухта', regionId: 'komi', type: 'city' },
  { id: 'komi-vorkuta', name: 'Воркута', regionId: 'komi', type: 'city' },

  // Архангельская область
  { id: 'arkhangelsk-arkhangelsk', name: 'Архангельск', regionId: 'arkhangelsk', type: 'city' },
  { id: 'arkhangelsk-severodvinsk', name: 'Северодвинск', regionId: 'arkhangelsk', type: 'city' },

  // Вологодская область
  { id: 'vologda-vologda', name: 'Вологда', regionId: 'vologda', type: 'city' },
  { id: 'vologda-cherepovets', name: 'Череповец', regionId: 'vologda', type: 'city' },

  // Мурманская область
  { id: 'murmansk-murmansk', name: 'Мурманск', regionId: 'murmansk', type: 'city' },
  { id: 'murmansk-apatity', name: 'Апатиты', regionId: 'murmansk', type: 'city' },
  { id: 'murmansk-severomorsk', name: 'Североморск', regionId: 'murmansk', type: 'city' },

  // Калининградская область
  { id: 'kaliningrad-kaliningrad', name: 'Калининград', regionId: 'kaliningrad', type: 'city' },
  { id: 'kaliningrad-sovetsk', name: 'Советск', regionId: 'kaliningrad', type: 'city' },

  // Астраханская область
  { id: 'astrakhan-astrakhan', name: 'Астрахань', regionId: 'astrakhan', type: 'city' },
  { id: 'astrakhan-akhtubinsk', name: 'Ахтубинск', regionId: 'astrakhan', type: 'city' },

  // Республика Адыгея
  { id: 'adygea-maykop', name: 'Майкоп', regionId: 'adygea', type: 'city' },

  // Республика Калмыкия
  { id: 'kalmykia-elista', name: 'Элиста', regionId: 'kalmykia', type: 'city' },

  // Республика Крым
  { id: 'crimea-simferopol', name: 'Симферополь', regionId: 'crimea', type: 'city' },
  { id: 'crimea-sevastopol', name: 'Севастополь', regionId: 'crimea', type: 'city' },
  { id: 'crimea-kerch', name: 'Керчь', regionId: 'crimea', type: 'city' },
  { id: 'crimea-yevpatoria', name: 'Евпатория', regionId: 'crimea', type: 'city' },
  { id: 'crimea-yalta', name: 'Ялта', regionId: 'crimea', type: 'city' },

  // Севастополь
  { id: 'sevastopol-city', name: 'Севастополь', regionId: 'sevastopol', type: 'city' },

  // Республика Дагестан
  { id: 'dagestan-makhachkala', name: 'Махачкала', regionId: 'dagestan', type: 'city' },
  { id: 'dagestan-derbent', name: 'Дербент', regionId: 'dagestan', type: 'city' },
  { id: 'dagestan-kaspiysk', name: 'Каспийск', regionId: 'dagestan', type: 'city' },

  // Кабардино-Балкарская Республика
  { id: 'kabardino-balkaria-nalchik', name: 'Нальчик', regionId: 'kabardino-balkaria', type: 'city' },
  { id: 'kabardino-balkaria-prokhladny', name: 'Прохладный', regionId: 'kabardino-balkaria', type: 'city' },

  // Карачаево-Черкесская Республика
  { id: 'karachaevo-cherkessia-cherkessk', name: 'Черкесск', regionId: 'karachaevo-cherkessia', type: 'city' },

  // Республика Северная Осетия
  { id: 'north-ossetia-vladikavkaz', name: 'Владикавказ', regionId: 'north-ossetia', type: 'city' },

  // Чеченская Республика
  { id: 'chechnya-grozny', name: 'Грозный', regionId: 'chechnya', type: 'city' },
  { id: 'chechnya-gudermes', name: 'Гудермес', regionId: 'chechnya', type: 'city' },

  // Ставропольский край
  { id: 'stavropol-stavropol', name: 'Ставрополь', regionId: 'stavropol', type: 'city' },
  { id: 'stavropol-pyatigorsk', name: 'Пятигорск', regionId: 'stavropol', type: 'city' },
  { id: 'stavropol-kislovodsk', name: 'Кисловодск', regionId: 'stavropol', type: 'city' },

  // Республика Бурятия
  { id: 'buryatia-ulan-ude', name: 'Улан-Удэ', regionId: 'buryatia', type: 'city' },
  { id: 'buryatia-severobaykalsk', name: 'Северобайкальск', regionId: 'buryatia', type: 'city' },

  // Забайкальский край
  { id: 'zabaykalsky-chita', name: 'Чита', regionId: 'zabaykalsky', type: 'city' },
  { id: 'zabaykalsky-krasnokamensk', name: 'Краснокаменск', regionId: 'zabaykalsky', type: 'city' },

  // Республика Хакасия
  { id: 'khakassia-abakan', name: 'Абакан', regionId: 'khakassia', type: 'city' },
  { id: 'khakassia-chernogorsk', name: 'Черногорск', regionId: 'khakassia', type: 'city' },

  // Республика Тыва
  { id: 'tyva-kyzyl', name: 'Кызыл', regionId: 'tyva', type: 'city' },

  // Республика Алтай
  { id: 'altai-republic-gorno-altaysk', name: 'Горно-Алтайск', regionId: 'altai-republic', type: 'city' },

  // Камчатский край
  { id: 'kamchatka-petropavlovsk', name: 'Петропавловск-Камчатский', regionId: 'kamchatka', type: 'city' },
  { id: 'kamchatka-elizovo', name: 'Елизово', regionId: 'kamchatka', type: 'city' },

  // Сахалинская область
  { id: 'sakhalin-yuzhno-sakhalinsk', name: 'Южно-Сахалинск', regionId: 'sakhalin', type: 'city' },
  { id: 'sakhalin-kholmsk', name: 'Холмск', regionId: 'sakhalin', type: 'city' },

  // Амурская область
  { id: 'amur-blagoveshchensk', name: 'Благовещенск', regionId: 'amur', type: 'city' },
  { id: 'amur-tynda', name: 'Тында', regionId: 'amur', type: 'city' },

  // Магаданская область
  { id: 'magadan-magadan', name: 'Магадан', regionId: 'magadan', type: 'city' },

  // Еврейская автономная область
  { id: 'jewish-birobidzhan', name: 'Биробиджан', regionId: 'jewish', type: 'city' },

  // Чукотский АО
  { id: 'chukotka-anadyr', name: 'Анадырь', regionId: 'chukotka', type: 'city' },

  // Курганская область
  { id: 'kurgan-kurgan', name: 'Курган', regionId: 'kurgan', type: 'city' },
  { id: 'kurgan-shadrinsk', name: 'Шадринск', regionId: 'kurgan', type: 'city' },

  // Новгородская область
  { id: 'novgorod-veliky-novgorod', name: 'Великий Новгород', regionId: 'novgorod', type: 'city' },
  { id: 'novgorod-staraya-russa', name: 'Старая Русса', regionId: 'novgorod', type: 'city' },

  // Псковская область
  { id: 'pskov-pskov', name: 'Псков', regionId: 'pskov', type: 'city' },
  { id: 'pskov-velikie-luki', name: 'Великие Луки', regionId: 'pskov', type: 'city' },

  // Ненецкий АО
  { id: 'nenets-naryan-mar', name: 'Нарьян-Мар', regionId: 'nenets', type: 'city' },

  // Республика Ингушетия
  { id: 'ingushetia-magas', name: 'Магас', regionId: 'ingushetia', type: 'city' },
  { id: 'ingushetia-nazran', name: 'Назрань', regionId: 'ingushetia', type: 'city' },
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