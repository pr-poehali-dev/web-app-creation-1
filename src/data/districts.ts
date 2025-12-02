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
