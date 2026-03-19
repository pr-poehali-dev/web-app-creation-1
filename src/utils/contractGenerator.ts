/**
 * Клиентская генерация текста контракта (Форвардный / Бартер) по ГК РФ для печати в PDF.
 */

const MONTHS = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];

function fmtDate(d: string): string {
  if (!d) return '____________';
  const parts = d.split('-');
  if (parts.length !== 3) return d;
  return `${parseInt(parts[2])} ${MONTHS[parseInt(parts[1]) - 1]} ${parts[0]} г.`;
}

function fmtMoney(n: number): string {
  return n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

type UserData = {
  firstName?: string; lastName?: string; middleName?: string;
  userType?: string; companyName?: string; inn?: string;
  ogrnip?: string; ogrn?: string; legalAddress?: string;
  city?: string; region?: string; phone?: string; email?: string;
  directorName?: string;
};

type FormData = Record<string, string | number | boolean>;

const CATEGORY_QUALITY: Record<string, string> = {
  dairy: 'Товар должен соответствовать ГОСТ Р 52090-2003 (молоко), ГОСТ 31453-2013 (творог) или иным применимым ГОСТам. Срок годности на момент передачи — не менее 2/3 от полного срока.',
  food: 'Товар должен соответствовать действующим ГОСТ и санитарным нормам. Срок годности на момент передачи — не менее 50% от полного срока годности.',
  agriculture: 'Качество товара соответствует ГОСТ и отраслевым нормам для с/х продукции. Влажность, засорённость — согласно ГОСТ.',
  construction: 'Товар соответствует ГОСТ и строительным нормам РФ. Поставщик предоставляет сертификаты соответствия и паспорта качества.',
  durable: 'Товар новый, соответствует ТТХ производителя и ТР ТС. Поставщик предоставляет гарантийные обязательства.',
  local: 'Товар соответствует действующим нормативным документам (ГОСТ, ТУ, ТР ТС) или согласованным Сторонами ТУ.',
  other: 'Качество товара соответствует действующим нормативным документам (ГОСТ, ТУ, ТР ТС) или согласованным Сторонами ТУ.',
};

const CATEGORY_STORAGE: Record<string, string> = {
  dairy: 'Хранение при +2°C…+6°C. Транспортировка — в рефрижераторах или изотермических ТС.',
  food: 'Хранение и транспортировка в условиях, соответствующих требованиям производителя и нормам СанПиН.',
  agriculture: 'Хранение в сухих вентилируемых помещениях, исключающих порчу продукции.',
  construction: 'Хранение на открытых или закрытых складах согласно условиям производителя.',
  durable: 'Хранение в сухих отапливаемых помещениях в оригинальной упаковке производителя.',
  local: 'Хранение и транспортировка в условиях, обеспечивающих сохранность качества.',
  other: 'Хранение и транспортировка обеспечивают сохранность качества и количества товара.',
};

function partyName(u: UserData): string {
  const full = [u.lastName, u.firstName, u.middleName].filter(Boolean).join(' ');
  if (u.userType === 'legal-entity') return u.companyName || '___________';
  if (u.userType === 'entrepreneur') return `ИП ${full}`;
  if (u.userType === 'self-employed') return `Самозанятый ${full}`;
  return full || '___________';
}

function requisites(u: UserData, role: string): string {
  const full = [u.lastName, u.firstName, u.middleName].filter(Boolean).join(' ');
  const lines: string[] = [`<b>${role.toUpperCase()}:</b>`];
  if (u.userType === 'legal-entity') {
    lines.push(u.companyName || '___________');
    if (u.ogrn) lines.push(`ОГРН: ${u.ogrn}`);
    if (u.inn) lines.push(`ИНН: ${u.inn}`);
    if (u.directorName) lines.push(`Директор: ${u.directorName}`);
  } else if (u.userType === 'entrepreneur') {
    lines.push(`ИП ${full}`);
    if (u.ogrnip) lines.push(`ОГРНИП: ${u.ogrnip}`);
    if (u.inn) lines.push(`ИНН: ${u.inn}`);
  } else {
    lines.push(full || '___________');
    if (u.inn) lines.push(`ИНН: ${u.inn}`);
  }
  const addr = u.legalAddress || [u.region, u.city].filter(Boolean).join(', ');
  if (addr) lines.push(`Адрес: ${addr}`);
  if (u.phone) lines.push(`Тел.: ${u.phone}`);
  if (u.email) lines.push(`Email: ${u.email}`);
  lines.push('<br>Подпись: _______________________');
  lines.push(`/${full || '___________'}/`);
  lines.push('<br>М.П.');
  return lines.join('<br>');
}

export function generateContractHtml(formData: FormData, seller: UserData, buyer: UserData): string {
  const isBarter = formData.contractType === 'barter';
  const today = fmtDate(new Date().toISOString().split('T')[0]);
  const deliveryDate = fmtDate(String(formData.deliveryDate || ''));
  const contractEnd = fmtDate(String(formData.contractEndDate || formData.deliveryDate || ''));
  const city = seller.city || 'г. __________';
  const catKey = String(formData.category || 'other');
  const catKeyB = String(formData.categoryB || formData.category || 'other');
  const qty = formData.quantity;
  const unit = formData.unit || 'ед.';
  const product = formData.productName || '___________';
  const price = Number(formData.pricePerUnit || 0);
  const total = Number(formData.totalAmount || (Number(formData.quantity) * price) || 0);
  const prepPct = Number(formData.prepaymentPercent || 0);
  const prepAmt = Number(formData.prepaymentAmount || total * prepPct / 100 || 0);
  const delivMethod = String(formData.deliveryMethod || 'автомобильный транспорт');
  const delivAddr = String(formData.deliveryAddress || 'по месту нахождения Покупателя');
  const sellerName = partyName(seller);
  const buyerName = partyName(buyer);
  const today_num = new Date();
  const contractNum = isBarter
    ? `БД-${today_num.getFullYear()}${String(today_num.getMonth()+1).padStart(2,'0')}${String(today_num.getDate()).padStart(2,'0')}-${seller.inn?.slice(-4) || '0001'}`
    : `ФК-${today_num.getFullYear()}${String(today_num.getMonth()+1).padStart(2,'0')}${String(today_num.getDate()).padStart(2,'0')}-${seller.inn?.slice(-4) || '0001'}`;

  const quality = CATEGORY_QUALITY[catKey] || CATEGORY_QUALITY.other;
  const storage = CATEGORY_STORAGE[catKey] || CATEGORY_STORAGE.other;
  const qualityB = CATEGORY_QUALITY[catKeyB] || CATEGORY_QUALITY.other;
  const storageB = CATEGORY_STORAGE[catKeyB] || CATEGORY_STORAGE.other;

  const title = isBarter ? `ДОГОВОР МЕНЫ (БАРТЕР) № ${contractNum}` : `ФОРВАРДНЫЙ КОНТРАКТ № ${contractNum}`;
  const subtitle = isBarter ? 'на обмен товарами' : 'на поставку товара';
  const lawRef = isBarter ? 'ст. 567–571 Гражданского кодекса РФ' : 'ст. 454–524 Гражданского кодекса РФ';
  const party1role = isBarter ? '«Сторона 1»' : '«Поставщик»';
  const party2role = isBarter ? '«Сторона 2»' : '«Покупатель»';

  let body = '';

  if (!isBarter) {
    // ФОРВАРДНЫЙ КОНТРАКТ
    body = `
<p class="section">1. ПРЕДМЕТ КОНТРАКТА</p>
<p>1.1. Поставщик обязуется передать в собственность Покупателю, а Покупатель — принять и оплатить: <b>${product}</b>.</p>
<p>1.2. Количество: <b>${qty} ${unit}</b>.</p>
<p>1.3. Качество: ${quality}</p>
<p>1.4. Условия хранения и транспортировки: ${storage}</p>

<p class="section">2. ЦЕНА И ПОРЯДОК РАСЧЁТОВ</p>
<p>2.1. Цена Товара: <b>${fmtMoney(price)} руб.</b> за единицу (${unit}), НДС в соответствии с законодательством РФ.</p>
<p>2.2. Общая стоимость контракта: <b>${fmtMoney(total)} руб.</b></p>
${prepPct > 0 ? `
<p>2.3. Покупатель вносит предоплату <b>${prepPct}%</b> = <b>${fmtMoney(prepAmt)} руб.</b> в течение 5 банковских дней с момента подписания.</p>
<p>2.4. Остаток <b>${fmtMoney(total - prepAmt)} руб.</b> уплачивается в течение 3 банковских дней с момента получения Товара.</p>
` : `
<p>2.3. Оплата в течение 5 банковских дней с момента получения Товара и подписания накладной/акта приёма-передачи.</p>
`}
<p>2.${prepPct > 0 ? 5 : 4}. Расчёты — в безналичном порядке на расчётный счёт Поставщика.</p>

<p class="section">3. СРОКИ И УСЛОВИЯ ПОСТАВКИ</p>
<p>3.1. Срок поставки: <b>${deliveryDate}</b>.</p>
<p>3.2. Место поставки: ${delivAddr}.</p>
<p>3.3. Способ доставки: ${delivMethod}. Расходы по доставке несёт Поставщик, если иное не согласовано письменно.</p>
<p>3.4. Датой поставки считается дата подписания товарной накладной или акта приёма-передачи.</p>

<p class="section">4. ПРИЁМКА ТОВАРА</p>
<p>4.1. Приёмка по количеству и качеству производится в момент получения Товара.</p>
<p>4.2. При обнаружении несоответствия составляется акт в присутствии представителя Поставщика.</p>
<p>4.3. Претензии по качеству предъявляются в течение 14 календарных дней с момента получения Товара.</p>

<p class="section">5. ПРАВА И ОБЯЗАННОСТИ СТОРОН</p>
<p>5.1. Поставщик обязан: поставить Товар в срок; обеспечить качество; передать все необходимые документы; уведомить о готовности к отгрузке за 3 рабочих дня.</p>
<p>5.2. Покупатель обязан: принять Товар; произвести оплату в срок; обеспечить приёмку в согласованном месте.</p>

<p class="section">6. ОТВЕТСТВЕННОСТЬ СТОРОН</p>
<p>6.1. За просрочку поставки — неустойка 0,1% от стоимости непоставленного Товара за каждый день, но не более 10% от общей стоимости.</p>
<p>6.2. За просрочку оплаты — неустойка 0,1% от суммы задолженности за каждый день, но не более 10%.</p>
<p>6.3. Уплата неустойки не освобождает от исполнения обязательств.</p>

<p class="section">7. ФОРС-МАЖОР</p>
<p>7.1. Стороны освобождаются от ответственности при обстоятельствах непреодолимой силы. Уведомление — не позднее 5 рабочих дней.</p>
<p>7.2. Если форс-мажор длится более 60 дней — каждая Сторона вправе расторгнуть Контракт.</p>

<p class="section">8. КОНФИДЕНЦИАЛЬНОСТЬ</p>
<p>8.1. Стороны не разглашают условия настоящего Контракта третьим лицам без письменного согласия.</p>

<p class="section">9. РАЗРЕШЕНИЕ СПОРОВ</p>
<p>9.1. Споры урегулируются путём переговоров. При недостижении согласия в течение 30 дней — в Арбитражном суде по месту нахождения Поставщика согласно законодательству РФ.</p>

<p class="section">10. СРОК ДЕЙСТВИЯ И РАСТОРЖЕНИЕ</p>
<p>10.1. Контракт вступает в силу с момента подписания и действует до ${contractEnd}, а в части расчётов — до полного исполнения обязательств.</p>
<p>10.2. Расторжение — по соглашению Сторон или в одностороннем порядке при существенном нарушении с уведомлением за 10 рабочих дней.</p>

<p class="section">11. ЗАКЛЮЧИТЕЛЬНЫЕ ПОЛОЖЕНИЯ</p>
<p>11.1. Контракт составлен в 2 экземплярах, по одному для каждой Стороны.</p>
<p>11.2. Изменения — только в письменной форме, подписанной обеими Сторонами.</p>
<p>11.3. Контракт регулируется законодательством РФ (${lawRef}).</p>
`;
  } else {
    // БАРТЕР
    const productB = String(formData.productNameB || '___________');
    const qtyB = formData.quantityB || '___';
    const unitB = String(formData.unitB || 'ед.');
    body = `
<p class="section">1. ПРЕДМЕТ ДОГОВОРА</p>
<p>1.1. Сторона 1 обязуется передать Стороне 2: <b>${product}</b> в количестве <b>${qty} ${unit}</b> (Товар А).</p>
<p>1.2. Сторона 2 обязуется передать Стороне 1: <b>${productB}</b> в количестве <b>${qtyB} ${unitB}</b> (Товар Б).</p>
<p>1.3. Стороны признают обмениваемые товары равноценными, если иное не предусмотрено настоящим Договором.</p>
<p>1.4. Качество Товара А: ${quality}</p>
<p>1.5. Качество Товара Б: ${qualityB}</p>

<p class="section">2. СТОИМОСТЬ ТОВАРОВ И ДОПЛАТА</p>
<p>2.1. Стоимость Товара А оценивается Сторонами в <b>${fmtMoney(total)} руб.</b></p>
<p>2.2. Стоимость Товара Б оценивается Сторонами в <b>${fmtMoney(Number(formData.totalAmountB || total))} руб.</b></p>
<p>2.3. При неравноценности Сторона, передающая товар меньшей стоимости, доплачивает разницу в течение 5 банковских дней.</p>

<p class="section">3. СРОКИ И ПОРЯДОК ПЕРЕДАЧИ ТОВАРОВ</p>
<p>3.1. Стороны передают товары в срок до <b>${deliveryDate}</b>.</p>
<p>3.2. Место передачи: ${delivAddr}.</p>
<p>3.3. Право собственности переходит одновременно после исполнения обязательств обеими Сторонами (ст. 570 ГК РФ).</p>
<p>3.4. Условия хранения и транспортировки Товара А: ${storage}</p>
<p>3.5. Условия хранения и транспортировки Товара Б: ${storageB}</p>
<p>3.6. Каждая Сторона несёт расходы по доставке передаваемого ею товара.</p>

<p class="section">4. ПРИЁМКА ТОВАРОВ</p>
<p>4.1. Приёмка производится одновременно в момент обмена.</p>
<p>4.2. При несоответствии принимающая Сторона вправе отказаться от принятия и потребовать надлежащего исполнения.</p>
<p>4.3. Претензии по качеству — в течение 14 календарных дней с момента передачи.</p>

<p class="section">5. ПРАВА И ОБЯЗАННОСТИ СТОРОН</p>
<p>5.1. Каждая Сторона обязана: передать товар надлежащего качества в срок; передать все необходимые документы; уведомить о готовности за 3 рабочих дня.</p>
<p>5.2. Каждая Сторона вправе: отказаться от исполнения при существенном нарушении; требовать возмещения убытков.</p>

<p class="section">6. ОТВЕТСТВЕННОСТЬ СТОРОН</p>
<p>6.1. За просрочку передачи — неустойка 0,1% от стоимости непереданного товара за каждый день, но не более 10%.</p>

<p class="section">7. ФОРС-МАЖОР</p>
<p>7.1. При форс-мажоре Сторона уведомляет другую в течение 5 рабочих дней. Если форс-мажор длится более 60 дней — каждая Сторона вправе расторгнуть Договор.</p>

<p class="section">8. РАЗРЕШЕНИЕ СПОРОВ</p>
<p>8.1. Споры урегулируются переговорами. При недостижении согласия — в Арбитражном суде по месту нахождения Стороны 1.</p>

<p class="section">9. СРОК ДЕЙСТВИЯ И РАСТОРЖЕНИЕ</p>
<p>9.1. Договор вступает в силу с момента подписания и действует до ${contractEnd}.</p>
<p>9.2. Расторжение — по соглашению или в одностороннем порядке с уведомлением за 10 рабочих дней.</p>

<p class="section">10. ЗАКЛЮЧИТЕЛЬНЫЕ ПОЛОЖЕНИЯ</p>
<p>10.1. Договор составлен в 2 экземплярах, по одному для каждой Стороны.</p>
<p>10.2. Изменения — только в письменной форме.</p>
<p>10.3. Договор регулируется законодательством РФ (${lawRef}).</p>
`;
  }

  const reqSeller = requisites(seller, isBarter ? 'Сторона 1' : 'Поставщик');
  const reqBuyer = requisites(buyer, isBarter ? 'Сторона 2' : 'Покупатель');

  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<title>${title}</title>
<style>
  @page { margin: 20mm 15mm 20mm 25mm; }
  body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.5; color: #000; }
  h1 { text-align: center; font-size: 14pt; font-weight: bold; margin: 0 0 4px; }
  h2 { text-align: center; font-size: 12pt; font-weight: normal; margin: 0 0 16px; }
  .city-date { display: flex; justify-content: space-between; margin-bottom: 16px; }
  p { margin: 4px 0; text-indent: 1.5cm; }
  p.section { font-weight: bold; text-indent: 0; margin: 16px 0 4px; }
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 24px; }
  .party { border-top: 1px solid #000; padding-top: 8px; }
  @media print { body { margin: 0; } button { display: none; } }
</style>
</head>
<body>
<h1>${title}</h1>
<h2>${subtitle}</h2>
<div class="city-date">
  <span>${city}</span>
  <span>${today}</span>
</div>
<p style="text-indent:1.5cm">${sellerName}, именуем(-ая) в дальнейшем ${party1role}, с одной стороны, и ${buyerName}, именуем(-ая) в дальнейшем ${party2role}, с другой стороны, совместно именуемые «Стороны», заключили настоящий ${isBarter ? 'Договор мены (бартера)' : 'Форвардный контракт'} (далее — «${isBarter ? 'Договор' : 'Контракт'}») в соответствии с ${lawRef} о нижеследующем:</p>

${body}

<p class="section">${isBarter ? '11' : '12'}. РЕКВИЗИТЫ И ПОДПИСИ СТОРОН</p>
<div class="parties">
  <div class="party">${reqSeller}</div>
  <div class="party">${reqBuyer}</div>
</div>
</body>
</html>`;
}

export function printContractAsPdf(html: string): void {
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 500);
}
