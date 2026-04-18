export interface ContractInfo {
  title: string;
  productName: string;
  totalAmount: number;
  currency: string;
  contractType: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  deliveryDate: string;
  contractStartDate: string;
  contractEndDate: string;
  deliveryAddress: string;
  deliveryConditions: string;
  specialTerms: string;
  termsConditions: string;
}

export interface NegotiatedTerms {
  pricePerUnit: number | null;
  deliveryDate: string | null;
  deliveryConditions: string | null;
  specialTerms: string | null;
}

export interface PartyInfo {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  companyName?: string;
  userType?: string;
  inn?: string;
  ogrn?: string;
  ogrnip?: string;
  legalAddress?: string;
  directorName?: string;
  phone?: string;
  email?: string;
}

export interface ResponseStatus {
  id: number;
  contractId: number;
  status: string;
  sellerConfirmed: boolean;
  buyerConfirmed: boolean;
  confirmedAt: string | null;
  pricePerUnit: number;
  totalAmount: number;
  comment: string;
  respondentFirstName: string;
  respondentLastName: string;
  sellerFirstName: string;
  sellerLastName: string;
  sellerId: number;
  respondentId: number;
  isSeller: boolean;
  sellerWantsAmend: boolean;
  buyerWantsAmend: boolean;
  contract: ContractInfo;
  negotiatedTerms: NegotiatedTerms;
  sellerInfo?: PartyInfo;
  respondentInfo?: PartyInfo;
}

export interface MessageAttachment {
  url: string;
  name: string;
  type: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  attachments: MessageAttachment[];
  timestamp: string;
}

export function formatDate(d: string) {
  if (!d || d === 'None' || d === 'null') return '—';
  try { return new Date(d).toLocaleDateString('ru-RU'); } catch { return '—'; }
}

export function formatAmount(n: number, currency = 'RUB') {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);
}

export function formatRecordingTime(s: number) {
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
}

const MONTHS_RU = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];

function fmtDateFull(d: string): string {
  if (!d || d === 'None' || d === 'null') return '____________';
  try {
    const parts = d.split('T')[0].split('-');
    if (parts.length !== 3) return d;
    return `${parseInt(parts[2])} ${MONTHS_RU[parseInt(parts[1]) - 1]} ${parts[0]} г.`;
  } catch { return d; }
}

function fmtMoney(n: number): string {
  return n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function buildContractHtml(status: ResponseStatus, c: ContractInfo): string {
  const confirmed = status.status === 'confirmed';
  const today = fmtDateFull(new Date().toISOString().split('T')[0]);
  const isForwardRequest = c.contractType === 'forward-request';
  const isBarter = c.contractType === 'barter';

  function partyDisplayName(info: PartyInfo | undefined, firstName: string, lastName: string): string {
    if (info?.userType === 'legal-entity' && info?.companyName) return info.companyName;
    if (info?.userType === 'entrepreneur') {
      const full = [info.lastName || lastName, info.firstName || firstName, info.middleName].filter(Boolean).join(' ');
      return `ИП ${full}`;
    }
    const full = [info?.lastName || lastName, info?.firstName || firstName, info?.middleName].filter(Boolean).join(' ');
    return full || '___________';
  }

  function partyRequisites(info: PartyInfo | undefined, firstName: string, lastName: string, roleLabel: string): string {
    const fullName = [info?.lastName || lastName, info?.firstName || firstName, info?.middleName].filter(Boolean).join(' ');
    const lines: string[] = [`<b>${roleLabel}:</b>`];
    if (info?.userType === 'legal-entity') {
      lines.push(`<b>${info.companyName || '___________'}</b>`);
      if (info.ogrn) lines.push(`ОГРН: ${info.ogrn}`);
      if (info.inn) lines.push(`ИНН: ${info.inn}`);
      if (info.directorName) lines.push(`Директор: ${info.directorName}`);
      else if (fullName) lines.push(`Представитель: ${fullName}`);
    } else if (info?.userType === 'entrepreneur') {
      lines.push(`ИП ${fullName}`);
      if (info.ogrnip) lines.push(`ОГРНИП: ${info.ogrnip}`);
      if (info.inn) lines.push(`ИНН: ${info.inn}`);
    } else {
      lines.push(fullName || '___________');
      if (info?.inn) lines.push(`ИНН: ${info.inn}`);
    }
    if (info?.legalAddress) lines.push(`Адрес: ${info.legalAddress}`);
    if (info?.phone) lines.push(`Тел.: ${info.phone}`);
    if (info?.email) lines.push(`Email: ${info.email}`);
    lines.push('<br>Подпись: _______________________');
    const signName = (info?.userType === 'legal-entity' && info?.directorName) ? info.directorName : fullName || '___________';
    lines.push(`/${signName}/`);
    lines.push('<br>М.П.');
    return lines.join('<br>');
  }

  const sellerName = partyDisplayName(status.sellerInfo, status.sellerFirstName, status.sellerLastName);
  const buyerName = partyDisplayName(status.respondentInfo, status.respondentFirstName, status.respondentLastName);

  const today_num = new Date();
  const dateSuffix = `${today_num.getFullYear()}${String(today_num.getMonth()+1).padStart(2,'0')}${String(today_num.getDate()).padStart(2,'0')}`;
  const contractNum = isBarter ? `БД-${dateSuffix}` : isForwardRequest ? `ЗК-${dateSuffix}` : `ФК-${dateSuffix}`;

  const title = isBarter
    ? `ДОГОВОР МЕНЫ (БАРТЕР) № ${contractNum}`
    : isForwardRequest
      ? `ФОРВАРДНЫЙ КОНТРАКТ НА ЗАКУПКУ № ${contractNum}`
      : `ФОРВАРДНЫЙ КОНТРАКТ № ${contractNum}`;
  const subtitle = isBarter ? 'на обмен товарами' : isForwardRequest ? 'на поставку товара / оказание услуги по запросу Покупателя' : 'на поставку товара';
  const lawRef = isBarter ? 'ст. 567–571 Гражданского кодекса РФ' : 'ст. 454–524 Гражданского кодекса РФ';
  const party1role = isBarter ? '«Сторона 1»' : isForwardRequest ? '«Покупатель»' : '«Поставщик»';
  const party2role = isBarter ? '«Сторона 2»' : isForwardRequest ? '«Поставщик»' : '«Покупатель»';
  const role1label = isBarter ? 'СТОРОНА 1' : isForwardRequest ? 'ПОКУПАТЕЛЬ' : 'ПОСТАВЩИК';
  const role2label = isBarter ? 'СТОРОНА 2' : isForwardRequest ? 'ПОСТАВЩИК' : 'ПОКУПАТЕЛЬ';

  const price = c.pricePerUnit || 0;
  const total = c.totalAmount || (price * (c.quantity || 0));
  const qty = c.quantity || 0;
  const unit = c.unit || 'ед.';
  const product = c.productName || '___________';
  const delivMethod = c.deliveryConditions || 'автомобильный транспорт';
  const delivAddr = c.deliveryAddress || 'по месту нахождения Покупателя';
  const deliveryDate = fmtDateFull(c.deliveryDate);
  const contractEnd = fmtDateFull(c.contractEndDate || c.deliveryDate);
  const contractStart = fmtDateFull(c.contractStartDate || c.deliveryDate);

  const CATEGORY_QUALITY: Record<string, string> = {
    dairy: 'Товар должен соответствовать ГОСТ Р 52090-2003 (молоко), ГОСТ 31453-2013 (творог) или иным применимым ГОСТам. Срок годности на момент передачи — не менее 2/3 от полного срока.',
    food: 'Товар должен соответствовать действующим ГОСТ и санитарным нормам. Срок годности на момент передачи — не менее 50% от полного срока годности.',
    agriculture: 'Качество товара соответствует ГОСТ и отраслевым нормам для с/х продукции. Влажность, засорённость — согласно ГОСТ.',
    construction: 'Товар соответствует ГОСТ и строительным нормам РФ. Поставщик предоставляет сертификаты соответствия и паспорта качества.',
  };
  const quality = CATEGORY_QUALITY['food'] || 'Качество товара соответствует действующим нормативным документам (ГОСТ, ТУ, ТР ТС) или согласованным Сторонами ТУ.';
  const storage = 'Хранение и транспортировка в условиях, соответствующих требованиям производителя и нормам СанПиН.';

  const stamp = confirmed
    ? `<div style="border:3px solid #16a34a;border-radius:8px;padding:12px 16px;color:#15803d;margin:24px 0;display:flex;align-items:flex-start;gap:10px;">
        <div style="font-size:28px;line-height:1;">✅</div>
        <div>
          <div style="font-weight:700;font-size:14px;">КОНТРАКТ СОГЛАСОВАН ОБЕИМИ СТОРОНАМИ</div>
          ${status.confirmedAt ? `<div style="font-size:12px;margin-top:4px;">Дата согласования: ${new Date(status.confirmedAt).toLocaleDateString('ru-RU')}</div>` : ''}
          <div style="font-size:11px;margin-top:4px;opacity:0.8;">Не подлежит изменению без взаимного согласия сторон</div>
        </div>
      </div>`
    : '';

  const body = `
<p class="section">1. ПРЕДМЕТ КОНТРАКТА</p>
<p>1.1. Поставщик обязуется передать в собственность Покупателю, а Покупатель — принять и оплатить: <b>${product}</b>.</p>
<p>1.2. Количество: <b>${qty} ${unit}</b>.</p>
<p>1.3. Качество: ${quality}</p>
<p>1.4. Условия хранения и транспортировки: ${storage}</p>

<p class="section">2. ЦЕНА И ПОРЯДОК РАСЧЁТОВ</p>
<p>2.1. Цена Товара: <b>${fmtMoney(price)} руб.</b> за единицу (${unit}), НДС в соответствии с законодательством РФ.</p>
<p>2.2. Общая стоимость контракта: <b>${fmtMoney(total)} руб.</b></p>
<p>2.3. Расчёты — в безналичном порядке на расчётный счёт Поставщика.</p>

<p class="section">3. СРОКИ И УСЛОВИЯ ПОСТАВКИ</p>
<p>3.1. Поставка Товара осуществляется в период с <b>${contractStart}</b> по <b>${contractEnd}</b>. Поставка должна быть осуществлена до истечения даты окончания контракта.</p>
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
<p>6.1. За просрочку поставки Поставщик уплачивает Покупателю пеню в размере 0,1% от стоимости непоставленного Товара за каждый день просрочки, но не более 10% от суммы Контракта (ст. 330 ГК РФ).</p>
<p>6.2. За просрочку оплаты Покупатель уплачивает Поставщику пеню в размере 0,1% от суммы задолженности за каждый день просрочки, но не более 10% от суммы Контракта (ст. 330 ГК РФ).</p>
<p>6.3. Неустойка выплачивается в течение 10 банковских дней с момента получения письменного требования.</p>

<p class="section">7. ФОРС-МАЖОР</p>
<p>7.1. Стороны освобождаются от ответственности за неисполнение при наступлении обстоятельств непреодолимой силы (ст. 401 ГК РФ).</p>
<p>7.2. Сторона обязана уведомить другую Сторону не позднее 5 рабочих дней с момента наступления форс-мажора.</p>
<p>7.3. При длительности форс-мажора более 60 дней каждая Сторона вправе расторгнуть Контракт с уведомлением за 10 рабочих дней.</p>

<p class="section">8. КОНФИДЕНЦИАЛЬНОСТЬ</p>
<p>8.1. Стороны не разглашают условия настоящего Контракта третьим лицам без письменного согласия.</p>

<p class="section">9. РАЗРЕШЕНИЕ СПОРОВ</p>
<p>9.1. Споры урегулируются переговорами. При недостижении согласия в течение 30 дней — в Арбитражном суде по месту нахождения Покупателя согласно законодательству РФ.</p>

<p class="section">10. СРОК ДЕЙСТВИЯ И РАСТОРЖЕНИЕ</p>
<p>10.1. Контракт вступает в силу с момента подписания и действует до ${contractEnd}, а в части расчётов — до полного исполнения обязательств.</p>
<p>10.2. Расторжение — по соглашению Сторон или в одностороннем порядке при существенном нарушении с уведомлением за 10 рабочих дней.</p>

<p class="section">11. ЗАКЛЮЧИТЕЛЬНЫЕ ПОЛОЖЕНИЯ</p>
<p>11.1. Контракт составлен в 2 экземплярах, по одному для каждой Стороны.</p>
<p>11.2. Изменения — только в письменной форме, подписанной обеими Сторонами.</p>
<p>11.3. Контракт регулируется законодательством РФ (${lawRef}).</p>
${c.specialTerms ? `\n<p class="section">12. ОСОБЫЕ УСЛОВИЯ</p>\n<p style="text-indent:1.5cm;white-space:pre-wrap">${c.specialTerms}</p>` : ''}
${c.termsConditions ? `\n<p class="section">БАЗОВЫЕ УСЛОВИЯ КОНТРАКТА</p>\n<p style="text-indent:1.5cm">${c.termsConditions}</p>` : ''}
`;

  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<title>${title}</title>
<style>
  @page { margin: 20mm 15mm 20mm 25mm; }
  body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.5; color: #000; max-width: 800px; margin: 40px auto; padding: 0 20px; }
  h1 { text-align: center; font-size: 14pt; font-weight: bold; margin: 0 0 4px; }
  h2 { text-align: center; font-size: 12pt; font-weight: normal; margin: 0 0 16px; }
  .city-date { display: flex; justify-content: space-between; margin-bottom: 16px; }
  p { margin: 4px 0; text-indent: 1.5cm; }
  p.section { font-weight: bold; text-indent: 0; margin: 16px 0 4px; }
  .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 32px; }
  .party { border-top: 1px solid #000; padding-top: 8px; }
  .party-label { font-size: 10pt; text-transform: uppercase; color: #555; letter-spacing: 0.05em; font-weight: bold; margin-bottom: 4px; }
  .toolbar { position: fixed; top: 12px; right: 12px; display: flex; gap: 8px; z-index: 999; }
  .toolbar button { padding: 8px 14px; border: none; border-radius: 8px; font-size: 13px; cursor: pointer; font-family: sans-serif; display: flex; align-items: center; gap: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.2); }
  .btn-print { background: #2563eb; color: #fff; }
  .btn-close { background: #fff; color: #111; border: 1px solid #e5e7eb !important; }
  @media print { body { margin: 0 20px; } .toolbar { display: none; } }
</style>
</head>
<body>
<div class="toolbar">
  <button class="btn-print" onclick="window.print()">🖨 Печать / PDF</button>
  <button class="btn-close" onclick="window.close()">✕ Закрыть</button>
</div>
${stamp}
<h1>${title}</h1>
<h2>${subtitle}</h2>
<div class="city-date">
  <span>г. __________</span>
  <span>${today}</span>
</div>
<p style="text-indent:1.5cm">${sellerName}, именуем(-ая) в дальнейшем ${party1role}, с одной стороны, и ${buyerName}, именуем(-ая) в дальнейшем ${party2role}, с другой стороны, совместно именуемые «Стороны», заключили настоящий ${isBarter ? 'Договор мены (бартера)' : 'Форвардный контракт'} (далее — «Контракт») в соответствии с ${lawRef} о нижеследующем:</p>

${body}

<p class="section">${c.specialTerms ? '13' : '12'}. РЕКВИЗИТЫ И ПОДПИСИ СТОРОН</p>
<div class="parties">
  <div class="party">
    ${partyRequisites(status.sellerInfo, status.sellerFirstName, status.sellerLastName, role1label)}
  </div>
  <div class="party">
    ${partyRequisites(status.respondentInfo, status.respondentFirstName, status.respondentLastName, role2label)}
  </div>
</div>
</body>
</html>`;
}