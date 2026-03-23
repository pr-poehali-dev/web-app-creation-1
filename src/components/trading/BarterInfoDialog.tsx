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

interface BarterInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function BarterInfoDialog({ open, onOpenChange }: BarterInfoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Icon name="ArrowLeftRight" size={20} className="text-primary" />
            Бартерные контракты на ЕРТТП
          </DialogTitle>
          <DialogDescription>
            Обмен товарами, работами или услугами без денег
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2 text-sm leading-relaxed">

          <p>
            <strong>Бартер</strong> — это обмен товарами, работами или услугами без денег.
          </p>

          <div>
            <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
              <Icon name="Calculator" size={16} className="text-primary" />
              Как учитывать бартер на упрощёнке
            </h3>
            <div className="space-y-3">
              <div className="rounded-lg border bg-muted/40 p-3">
                <p className="font-medium mb-1">УСН «Доходы»</p>
                <p className="text-muted-foreground">Налог считают с рыночной стоимости полученных товаров, работ или услуг. Например, предприниматель получил товары на 100 000 ₽ и оказал услуги на ту же сумму — он платит 6%, то есть 6 000 ₽.</p>
              </div>
              <div className="rounded-lg border bg-muted/40 p-3">
                <p className="font-medium mb-1">УСН «Доходы минус расходы»</p>
                <p className="text-muted-foreground">Налог платят с разницы между выручкой и затратами. При равноценном обмене (100 000 ₽ ↔ 100 000 ₽) налог не возникает. Без первичных документов налоговая не примет расходы, доначислит налоги и оштрафует.</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
              <Icon name="BookOpen" size={16} className="text-primary" />
              Нужно ли делать записи в КУДиР
            </h3>
            <p className="text-muted-foreground mb-2">Бартерные операции — хозяйственные, поэтому в КУДиР делают соответствующие записи.</p>
            <div className="rounded-lg border bg-muted/40 p-3 text-xs space-y-1">
              <p className="font-medium">Пример записей за 10 июня:</p>
              <p>📥 10.06.2025: получение товара от ООО «Партнёр» по договору бартера №7 от 08.06.2025. Сумма дохода: 50 000 ₽.</p>
              <p>📤 10.06.2025: оказание услуг по договору бартера №7 от 08.06.2025. Сумма расхода: 50 000 ₽.</p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
              <Icon name="FileText" size={16} className="text-primary" />
              Как оформлять документы для бартера
            </h3>
            <p className="text-muted-foreground mb-2">Если обмениваетесь товарами — договор мены. Если в сделку включены работы или услуги — бартерное соглашение или договор поставки с указанием натуральной формы расчётов.</p>
            <ul className="space-y-1 text-xs">
              {['Наименование обмениваемых товаров, работ или услуг', 'Количество и объём; цены за единицу и общую стоимость', 'Порядок обмена и сроки исполнения', 'Условие о равноценности или порядок денежной доплаты'].map((item, i) => (
                <li key={i} className="flex gap-2">
                  <Icon name="Check" size={13} className="text-primary shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
              <Icon name="TrendingUp" size={16} className="text-primary" />
              Как оценивать стоимость при бартере
            </h3>
            <p className="text-muted-foreground mb-2">Товары, работы и услуги оцениваются по рыночной стоимости (п. 3 ст. 105.3 НК РФ). Для подтверждения стоимости используйте прайс-листы, коммерческие предложения, данные Росстата.</p>
            <div className="rounded-lg border bg-muted/40 p-3 text-xs">
              <p className="font-medium mb-1">Пример неравноценного бартера:</p>
              <p className="text-muted-foreground">Фермер поставляет мясо говядины в ноябре на 110 000 ₽ в обмен на строительные материалы на 100 000 ₽. Разницу магазин обосновывает доставкой за свой счёт (10 000 ₽).</p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
              <Icon name="Settings" size={16} className="text-primary" />
              Как учитывать бартер на общем режиме (ОСНО)
            </h3>
            <p className="text-muted-foreground mb-3">Доходом признаётся стоимость полученного, расходом — стоимость отданного. Разница — налоговая база для налога на прибыль или НДФЛ.</p>
            <div className="space-y-2">
              {[
                ['Компания по кондиционерам', 'Ремонт (150 000 ₽) меняет на мебель (140 000 ₽). Налог с разницы 10 000 ₽.'],
                ['СПХ и дорожная компания', 'Мясо в ноябре (300 000 ₽) в обмен на ремонт дороги (300 000 ₽). Доход = расход, налог не возникает.'],
                ['ИП «Столяр»', '10 стульев (35 000 ₽) в обмен на 2 куба пиломатериалов (40 000 ₽). НДФЛ с разницы 5 000 ₽.'],
              ].map(([title, text], i) => (
                <div key={i} className="rounded-lg border bg-muted/40 p-3 text-xs">
                  <p className="font-medium mb-0.5">{title}</p>
                  <p className="text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
              <Icon name="Receipt" size={16} className="text-primary" />
              Как исчислять НДС при бартере
            </h3>
            <p className="text-muted-foreground mb-2">Бартерные сделки облагаются НДС в общем порядке с рыночной стоимости без НДС и акцизов.</p>
            <div className="rounded-lg border bg-muted/40 p-3 text-xs">
              <p className="font-medium mb-1">Пример:</p>
              <p className="text-muted-foreground">Ремонт (120 000 ₽) меняют на мебель (120 000 ₽). Исходящий НДС 22% = 26 400 ₽. Входящий НДС = 26 400 ₽. Обязательств перед бюджетом нет.</p>
            </div>
          </div>

          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
            <h3 className="font-semibold text-orange-800 mb-2 flex items-center gap-2">
              <Icon name="AlertTriangle" size={15} className="text-orange-600" />
              Нюансы и риски
            </h3>
            <ul className="space-y-1.5 text-orange-900 text-xs">
              {[
                'Налоговая внимательно контролирует бартер. Если оформить неправильно — доначислит налоги и оштрафует.',
                'Бартер на крупные суммы с недавно зарегистрированной фирмой без сотрудников и офиса вызовет подозрения.',
                'Если стоимость отличается от рыночной на 20–30% и более, обмен могут признать фиктивным.',
                'Сделки между взаимозависимыми лицами — под особым контролем. Заранее готовьте прайс-листы и обоснования.',
                'Если у контрагента нет офиса, сайта, сотрудников и отзывов — откажитесь от сделки.',
              ].map((text, i) => (
                <li key={i} className="flex gap-2">
                  <Icon name="AlertCircle" size={13} className="shrink-0 mt-0.5 text-orange-500" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Понятно</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
