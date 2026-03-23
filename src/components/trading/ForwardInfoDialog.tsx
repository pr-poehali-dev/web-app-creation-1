import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface ForwardInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ForwardInfoDialog({ open, onOpenChange }: ForwardInfoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Icon name="BookOpen" size={20} className="text-primary" />
            Форвардные контракты на ЕРТТП
          </DialogTitle>
          <DialogDescription>
            Инструмент для верифицированных участников — ИП и юридических лиц. Верифицированные физ. лица могут принять предложения по контракту, но не могут создавать контракт
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2 text-sm leading-relaxed">

          <p>
            <strong>Форвардный контракт</strong> — это соглашение, по которому продавец обязуется поставить определённый актив (товар, сырьё, продукцию) в будущем, а покупатель — оплатить его заранее или частично до момента поставки. Цена, объём, дата поставки и другие условия фиксируются в момент заключения контракта. Такой инструмент позволяет обеим сторонам снизить риски, связанные с колебаниями рынка, и планировать свою деятельность, защититься от неопределённости, снизить финансовую нагрузку от использования кредитных средств и издержки на маркетинг.
          </p>

          <div>
            <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
              <Icon name="Settings" size={16} className="text-primary" />
              Как работает механизм
            </h3>
            <ol className="space-y-2 list-none">
              {[
                ['Заключение контракта', 'Стороны договариваются о конкретных условиях: каком активе, в каком объёме, по какой цене и срок поставки. В договоре также прописываются условия предоплаты (размер, сроки внесения и т. д.).'],
                ['Внесение предоплаты', 'Покупатель перечисляет полную сумму или часть суммы продавцу до момента поставки. Это может быть фиксированная сумма с дисконтом (со скидкой) от общей стоимости контракта или иной согласованный вариант.'],
                ['Исполнение обязательств', 'В оговорённую дату продавец поставляет товар, а покупатель оплачивает оставшуюся часть суммы (если предоплата была частичной).'],
              ].map(([title, text], i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-semibold mt-0.5">{i + 1}</span>
                  <div><span className="font-medium">{title}.</span> {text}</div>
                </li>
              ))}
            </ol>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <h3 className="font-semibold text-emerald-800 mb-2 flex items-center gap-2">
                <Icon name="TrendingUp" size={15} className="text-emerald-600" />
                Преимущества для поставщика
              </h3>
              <ul className="space-y-1.5 text-emerald-900">
                {[
                  ['Гарантированный доход', 'Предоплата обеспечивает денежный поток до момента поставки.'],
                  ['Гарантированный сбыт', 'Продукт будет реализован по заранее оговорённой цене и объёме.'],
                  ['Планирование', 'Точный расчёт затрат и объёмов производства заранее.'],
                  ['Снижение риска неплатежа', 'Предоплата снижает вероятность отказа покупателя от сделки.'],
                ].map(([title, text], i) => (
                  <li key={i} className="flex gap-2 text-xs">
                    <Icon name="Check" size={13} className="text-emerald-500 mt-0.5 shrink-0" />
                    <span><span className="font-medium">{title}.</span> {text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <Icon name="ShoppingCart" size={15} className="text-blue-600" />
                Преимущества для покупателя
              </h3>
              <ul className="space-y-1.5 text-blue-900">
                {[
                  ['Фиксация цены', 'Защита от роста стоимости товара к моменту поставки.'],
                  ['Гарантированная поставка', 'Уверенность в получении товара в оговорённый срок.'],
                  ['Планирование бюджета', 'Заранее известные условия позволяют точнее прогнозировать расходы.'],
                  ['Стабильность поставок', 'Особенно важно для дефицитных или сезонных товаров.'],
                ].map(([title, text], i) => (
                  <li key={i} className="flex gap-2 text-xs">
                    <Icon name="Check" size={13} className="text-blue-500 mt-0.5 shrink-0" />
                    <span><span className="font-medium">{title}.</span> {text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
              <Icon name="Lightbulb" size={16} className="text-amber-500" />
              Примеры
            </h3>
            <div className="space-y-3">
              <div className="rounded-lg border bg-muted/40 p-4">
                <p className="font-medium mb-1">Пример 1. Картофель</p>
                <p className="text-muted-foreground mb-2">Фермер заключает с перерабатывающим предприятием форвардный контракт на поставку 10 тонн картофеля через три месяца по цене 50 руб./кг. Покупатель вносит предоплату 30% (150 000 ₽), остальное — после поставки.</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="font-medium text-emerald-700">Выгода фермера:</span> получает 150 000 ₽ сразу для финансирования выращивания; защищён от падения цен; гарантирован сбыт.</div>
                  <div><span className="font-medium text-blue-700">Выгода покупателя:</span> фиксирует цену; гарантирует поставку необходимого сырья в нужное время.</div>
                </div>
              </div>
              <div className="rounded-lg border bg-muted/40 p-4">
                <p className="font-medium mb-1">Пример 2. Говядина</p>
                <p className="text-muted-foreground mb-2">Фермер заключает контракт с 70% предоплатой в мае на поставку говядины в ноябре по дисконтной цене 800 руб./кг на 300 кг (240 000 ₽). В мае получает 70% — 168 000 ₽.</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="font-medium text-emerald-700">Выгода фермера:</span> решает финансовые затруднения без кредита; точно знает объём производства.</div>
                  <div><span className="font-medium text-blue-700">Выгода покупателя:</span> фиксирует цену со скидкой; гарантия получения товара в срок.</div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
            <h3 className="font-semibold text-orange-800 mb-2 flex items-center gap-2">
              <Icon name="AlertTriangle" size={15} className="text-orange-600" />
              Риски
            </h3>
            <ul className="space-y-1.5 text-orange-900 text-xs">
              <li className="flex gap-2"><Icon name="AlertCircle" size={13} className="shrink-0 mt-0.5 text-orange-500" /><span><span className="font-medium">Для поставщика:</span> если рыночная цена товара резко вырастет, он потеряет потенциальную прибыль.</span></li>
              <li className="flex gap-2"><Icon name="AlertCircle" size={13} className="shrink-0 mt-0.5 text-orange-500" /><span><span className="font-medium">Для покупателя:</span> если рыночная цена упадёт, он заплатит больше, чем мог бы на открытом рынке.</span></li>
              <li className="flex gap-2"><Icon name="AlertCircle" size={13} className="shrink-0 mt-0.5 text-orange-500" /><span><span className="font-medium">Для обеих сторон:</span> риск неисполнения обязательств контрагентом. Важно обращать внимание на срок деятельности на рынке и надёжность контрагента, прописывать условия ответственности и учитывать возможные изменения рыночных условий.</span></li>
            </ul>
          </div>

          <p className="text-muted-foreground italic border-t pt-4">
            Таким образом, поставочные форвардные контракты с предоплатой на локальном рынке — это инструмент, который помогает сторонам снизить финансовые нагрузки и риски, а также запланировать деятельность и объём производства, но требует внимательного подхода к выбору условий сделки и анализу контрагентов.
          </p>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Понятно</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}