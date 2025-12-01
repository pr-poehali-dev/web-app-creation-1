export interface Settlement {
  id: string;
  name: string;
  districtId: string;
}

export const SETTLEMENTS: Settlement[] = [
  { id: 'yakutsk', name: 'г. Якутск', districtId: 'yakutsk' },
  
  { id: 'aldan', name: 'г. Алдан', districtId: 'aldan' },
  { id: 'tommot', name: 'пгт. Tommot', districtId: 'aldan' },
  { id: 'khатыstыrах', name: 'с. Хатыstырах', districtId: 'aldan' },
  
  { id: 'amga', name: 'с. Амга', districtId: 'amga' },
  { id: 'bolshaya-oimyakon', name: 'с. Большая Оймякон', districtId: 'amga' },
  
  { id: 'saskylakh', name: 'пгт. Саскылах', districtId: 'anabar' },
  { id: 'yuryung-khaya', name: 'с. Юрюнг-Хая', districtId: 'anabar' },
  
  { id: 'tiksi', name: 'пгт. Тикси', districtId: 'bulun' },
  { id: 'bulun', name: 'с. Булун', districtId: 'bulun' },
  { id: 'bykovsky', name: 'с. Быковский', districtId: 'bulun' },
  
  { id: 'zyryanka', name: 'пгт. Зырянка', districtId: 'verkhnekolymsk' },
  { id: 'nelemnoe', name: 'с. Нелемное', districtId: 'verkhnekolymsk' },
  
  { id: 'verkhnevilyuisk', name: 'с. Верхневилюйск', districtId: 'verkhnevilyuisk' },
  { id: 'kysyl-syr', name: 'с. Кысыл-Сыр', districtId: 'verkhnevilyuisk' },
  
  { id: 'verkhoyansk', name: 'пгт. Верхоянск', districtId: 'verkhoyansk' },
  { id: 'batagay', name: 'пгт. Батагай', districtId: 'verkhoyansk' },
  
  { id: 'vilyuisk', name: 'г. Вилюйск', districtId: 'vilyuisk' },
  { id: 'suntar', name: 'пгт. Сунтар', districtId: 'vilyuisk' },
  { id: 'nyurba', name: 'г. Нюрба', districtId: 'nyurbinsky' },
  
  { id: 'berdigestyakh', name: 'с. Бердигестях', districtId: 'gorny' },
  { id: 'bestyakh', name: 'с. Бестях', districtId: 'gorny' },
  
  { id: 'zhigansk', name: 'с. Жиганск', districtId: 'zhigansky' },
  { id: 'kyusyur', name: 'с. Кюсюр', districtId: 'zhigansky' },
  
  { id: 'sangar', name: 'пгт. Сангар', districtId: 'kobyai' },
  { id: 'sebyan-kyuyol', name: 'с. Себян-Кюёль', districtId: 'kobyai' },
  
  { id: 'lensk', name: 'г. Ленск', districtId: 'lensk' },
  { id: 'peleduy', name: 'с. Пеледуй', districtId: 'lensk' },
  { id: 'vitim', name: 'с. Витим', districtId: 'lensk' },
  
  { id: 'maya', name: 'с. Майя', districtId: 'megino-kangalassky' },
  { id: 'nizhny-bestyakh', name: 'с. Нижний Бестях', districtId: 'megino-kangalassky' },
  
  { id: 'mirny', name: 'г. Мирный', districtId: 'mirny' },
  { id: 'udachny', name: 'пгт. Удачный', districtId: 'mirny' },
  { id: 'aikhal', name: 'пгт. Айхал', districtId: 'mirny' },
  { id: 'chernyshevsky', name: 'пгт. Чернышевский', districtId: 'mirny' },
  
  { id: 'khonuu', name: 'с. Хонуу', districtId: 'momsky' },
  { id: 'sobolokh', name: 'с. Соболох', districtId: 'momsky' },
  
  { id: 'namtsy', name: 'с. Намцы', districtId: 'namsky' },
  { id: 'bytantay', name: 'с. Бытантай', districtId: 'namsky' },
  
  { id: 'neryungri', name: 'г. Нерюнгри', districtId: 'neryungri' },
  { id: 'berkakit', name: 'пгт. Беркакит', districtId: 'neryungri' },
  { id: 'chulman', name: 'пгт. Чульман', districtId: 'neryungri' },
  { id: 'serebryany-bor', name: 'пгт. Серебряный Бор', districtId: 'neryungri' },
  
  { id: 'chersky', name: 'пгт. Черский', districtId: 'nizhnekolymsk' },
  { id: 'nizhnеkolymsk', name: 'с. Нижнеколымск', districtId: 'nizhnekolymsk' },
  
  { id: 'ust-nera', name: 'пгт. Усть-Нера', districtId: 'oymyakon' },
  { id: 'tomtor', name: 'с. Томтор', districtId: 'oymyakon' },
  { id: 'oymyakon', name: 'с. Оймякон', districtId: 'oymyakon' },
  
  { id: 'olekminsk', name: 'г. Олёкминск', districtId: 'olekminsk' },
  { id: 'tас', name: 'с. Тас', districtId: 'olekminsk' },
  
  { id: 'borогontsy', name: 'с. Борогонцы', districtId: 'ust-aldan' },
  { id: 'khamagatta', name: 'с. Хамагатта', districtId: 'ust-aldan' },
  
  { id: 'ust-maya', name: 'пгт. Усть-Мая', districtId: 'ust-maya' },
  { id: 'yugaryonok', name: 'с. Югарёнок', districtId: 'ust-maya' },
  
  { id: 'deputatsky', name: 'пгт. Депутатский', districtId: 'ust-yan' },
  { id: 'kazachye', name: 'с. Казачье', districtId: 'ust-yan' },
  
  { id: 'pokrovsk', name: 'г. Покровск', districtId: 'khangalassky' },
  { id: 'magan', name: 'с. Маган', districtId: 'khangalassky' },
  { id: 'nizhny-bestyakh', name: 'с. Нижний Бестях', districtId: 'khangalassky' },
  
  { id: 'churapcha', name: 'с. Чурапча', districtId: 'churapcha' },
  { id: 'ytyk-kel', name: 'с. Ытык-Кёль', districtId: 'churapcha' },
  
  { id: 'batagay-alyta', name: 'с. Батагай-Алыта', districtId: 'eveno-bytantai' },
  { id: 'dzharbardakh', name: 'с. Джарбардах', districtId: 'eveno-bytantai' },
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
