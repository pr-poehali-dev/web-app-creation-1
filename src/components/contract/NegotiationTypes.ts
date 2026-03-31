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

export function buildContractHtml(status: ResponseStatus, c: ContractInfo): string {
  const confirmed = status.status === 'confirmed';
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

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Договор</title>
<style>body{font-family:Arial,sans-serif;max-width:800px;margin:40px auto;padding:0 20px;color:#111;font-size:13px;line-height:1.6}
h1{text-align:center;font-size:18px}h2{font-size:14px;margin-top:20px}
table{width:100%;border-collapse:collapse;margin:12px 0}td,th{border:1px solid #ccc;padding:6px 10px}th{background:#f5f5f5}
.parties{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:16px 0}
.party{border:1px solid #e5e7eb;border-radius:6px;padding:12px}.party-label{font-size:11px;text-transform:uppercase;color:#666;letter-spacing:.05em}
@media print{body{margin:0 20px}}</style></head><body>
${stamp}
<h1>ДОГОВОР КУПЛИ-ПРОДАЖИ (ФОРВАРДНЫЙ)</h1>
<p style="text-align:center;color:#555">${c.title}</p>
<div class="parties">
  <div class="party"><div class="party-label">Продавец</div><strong>${status.sellerFirstName} ${status.sellerLastName}</strong></div>
  <div class="party"><div class="party-label">Покупатель</div><strong>${status.respondentFirstName} ${status.respondentLastName}</strong></div>
</div>
<h2>1. Предмет договора</h2>
<table><tr><th>Товар</th><td>${c.productName}</td></tr>
<tr><th>Количество</th><td>${c.quantity} ${c.unit}</td></tr>
<tr><th>Цена за ед.</th><td>${formatAmount(c.pricePerUnit, c.currency)}</td></tr>
<tr><th>Общая сумма</th><td><strong>${formatAmount(c.totalAmount, c.currency)}</strong></td></tr>
<tr><th>Дата поставки</th><td>${formatDate(c.deliveryDate)}</td></tr>
<tr><th>Срок действия</th><td>${formatDate(c.contractStartDate)} — ${formatDate(c.contractEndDate)}</td></tr>
${c.deliveryAddress ? `<tr><th>Адрес поставки</th><td>${c.deliveryAddress}</td></tr>` : ''}
${c.deliveryConditions ? `<tr><th>Условия доставки</th><td>${c.deliveryConditions}</td></tr>` : ''}
</table>
${c.termsConditions ? `<h2>2. Базовые условия</h2><p>${c.termsConditions}</p>` : ''}
${c.specialTerms ? `<h2>${c.termsConditions ? '3' : '2'}. Дополнительные оговорки</h2><p style="white-space:pre-wrap">${c.specialTerms}</p>` : ''}
<h2>Подписи сторон</h2>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-top:16px">
<div><p><strong>Продавец:</strong></p><p style="border-top:1px solid #000;padding-top:4px;margin-top:32px">${status.sellerFirstName} ${status.sellerLastName}</p></div>
<div><p><strong>Покупатель:</strong></p><p style="border-top:1px solid #000;padding-top:4px;margin-top:32px">${status.respondentFirstName} ${status.respondentLastName}</p></div>
</div>
</body></html>`;
}