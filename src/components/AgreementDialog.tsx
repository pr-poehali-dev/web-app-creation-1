import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useState, useRef, useEffect } from 'react';

interface AgreementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => void;
  verificationType: 'individual' | 'self_employed' | 'legal_entity';
}

export default function AgreementDialog({ open, onOpenChange, onAccept, verificationType }: AgreementDialogProps) {
  const [agreed, setAgreed] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (!viewport) return;

    const handleScroll = () => {
      const scrollTop = viewport.scrollTop;
      const scrollHeight = viewport.scrollHeight - viewport.clientHeight;
      const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      setScrollProgress(Math.min(100, Math.max(0, progress)));
      
      if (progress >= 95 && !agreed) {
        setAgreed(true);
      }
    };

    viewport.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => viewport.removeEventListener('scroll', handleScroll);
  }, [open, agreed]);

  const getAgreementContent = () => {
    const commonTerms = `
## СОГЛАШЕНИЕ ОБ ИСПОЛЬЗОВАНИИ ПЛАТФОРМЫ

**Дата последнего обновления:** ${new Date().toLocaleDateString('ru-RU')}

### 1. ОБЩИЕ ПОЛОЖЕНИЯ

1.1. Настоящее Соглашение регулирует порядок использования торговой онлайн-платформы (далее — «Платформа») для размещения и обработки запросов и предложений на поставку товаров, выполнение работ и оказание услуг.

1.2. Используя Платформу, вы подтверждаете, что:
- Ознакомлены с условиями настоящего Соглашения
- Принимаете все условия в полном объёме
- Обладаете необходимыми полномочиями для заключения данного соглашения

### 2. ТЕРМИНЫ И ОПРЕДЕЛЕНИЯ

- **Платформа** — онлайн-сервис для организации торговли и взаимодействия между участниками
- **Участник** — физическое или юридическое лицо, прошедшее верификацию
- **Запрос** — предложение о покупке товаров/услуг
- **Предложение** — предложение о продаже товаров/услуг
- **Верификация** — процедура проверки данных и документов участника

### 3. РЕГИСТРАЦИЯ И ВЕРИФИКАЦИЯ

3.1. Для получения доступа к функционалу Платформы необходимо:
- Пройти процедуру регистрации
- Предоставить достоверные данные
- Пройти верификацию в соответствии с выбранным типом участника
- Подтвердить номер телефона

3.2. Администрация платформы оставляет за собой право:
- Запросить дополнительные документы
- Отклонить заявку при несоответствии требованиям
- Приостановить доступ при нарушении условий

### 4. ПРАВА И ОБЯЗАННОСТИ УЧАСТНИКОВ

4.1. Участник имеет право:
- Размещать запросы на покупку товаров/услуг
- Размещать предложения на продажу товаров/услуг
- Просматривать размещенные запросы и предложения
- Взаимодействовать с другими участниками через Платформу

4.2. Участник обязуется:
- Предоставлять достоверную информацию
- Своевременно обновлять контактные и платёжные данные
- Не размещать запрещённые товары и услуги
- Соблюдать законодательство Российской Федерации
- Не использовать Платформу для мошеннических действий
- Уважать права других участников

### 5. ОТВЕТСТВЕННОСТЬ СТОРОН

5.1. Администрация Платформы:
- Обеспечивает техническую работоспособность сервиса
- Проверяет документы участников при верификации
- Не несёт ответственности за действия участников
- Не является стороной сделок между участниками

5.2. Участник несёт полную ответственность за:
- Достоверность предоставленных данных
- Содержание размещаемых запросов и предложений
- Исполнение заключённых договоров
- Соблюдение налогового законодательства

### 6. ЗАЩИТА ПЕРСОНАЛЬНЫХ ДАННЫХ

6.1. Администрация обязуется:
- Обрабатывать персональные данные в соответствии с ФЗ-152 «О персональных данных»
- Обеспечивать конфиденциальность информации
- Не передавать данные третьим лицам без согласия

6.2. Предоставляя документы, вы даёте согласие на:
- Обработку персональных данных
- Хранение документов в электронном виде
- Использование данных для верификации и работы Платформы

### 7. ПОРЯДОК РАЗРЕШЕНИЯ СПОРОВ

7.1. Споры между участниками разрешаются:
- Путём переговоров
- Через службу поддержки Платформы (медиация)
- В судебном порядке согласно законодательству РФ

7.2. Претензии к работе Платформы направляются через форму обратной связи.

### 8. ИЗМЕНЕНИЕ УСЛОВИЙ

8.1. Администрация вправе изменять условия Соглашения с уведомлением участников за 7 дней.

8.2. Продолжение использования Платформы после изменений означает принятие новых условий.

### 9. ЗАКЛЮЧИТЕЛЬНЫЕ ПОЛОЖЕНИЯ

9.1. Настоящее Соглашение вступает в силу с момента акцепта участником.

9.2. Соглашение действует до момента прекращения использования Платформы участником.

9.3. Все отношения, не урегулированные настоящим Соглашением, регулируются законодательством Российской Федерации.
`;

    const individualTerms = `
### 10. СПЕЦИАЛЬНЫЕ УСЛОВИЯ ДЛЯ ФИЗИЧЕСКИХ ЛИЦ

10.1. Физическое лицо вправе совершать сделки в пределах, установленных законодательством РФ.

10.2. Физическое лицо обязано:
- Самостоятельно уплачивать налоги с полученных доходов
- Уведомлять налоговые органы о доходах в соответствии с НК РФ

10.3. Администрация рекомендует при систематической деятельности оформить статус самозанятого или ИП.
`;

    const selfEmployedTerms = `
### 10. СПЕЦИАЛЬНЫЕ УСЛОВИЯ ДЛЯ САМОЗАНЯТЫХ

10.1. Самозанятый подтверждает наличие статуса плательщика налога на профессиональный доход (НПД).

10.2. Самозанятый обязуется:
- Формировать чеки через приложение «Мой налог»
- Своевременно уплачивать налоги (4% или 6%)
- Соблюдать ограничения НПД (доход до 2.4 млн руб/год, без наёмных работников)

10.3. При превышении лимитов самозанятый обязан зарегистрироваться как ИП.
`;

    const legalEntityTerms = `
### 10. СПЕЦИАЛЬНЫЕ УСЛОВИЯ ДЛЯ ЮРИДИЧЕСКИХ ЛИЦ

10.1. Юридическое лицо подтверждает:
- Наличие государственной регистрации (ОГРН)
- Постановку на налоговый учёт (ИНН)
- Полномочия представителя на заключение сделок

10.2. Юридическое лицо обязуется:
- Действовать в рамках уставных документов
- Соблюдать налоговое и бухгалтерское законодательство
- Оформлять сделки в соответствии с требованиями закона
- Заключать договоры на основании размещённых запросов/предложений

10.3. Администрация может запросить:
- Уставные документы
- Выписку из ЕГРЮЛ
- Приказ о назначении директора или доверенность

10.4. Все расчёты производятся на расчётный счёт организации с обязательным оформлением первичных документов.
`;

    return commonTerms + (
      verificationType === 'individual' ? individualTerms :
      verificationType === 'self_employed' ? selfEmployedTerms :
      legalEntityTerms
    );
  };

  const handleAccept = () => {
    if (agreed) {
      onAccept();
      onOpenChange(false);
      setAgreed(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Соглашение об использовании платформы</DialogTitle>
          <DialogDescription>
            Пожалуйста, внимательно ознакомьтесь с условиями соглашения
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          <div className="mb-2">
            <Progress value={scrollProgress} className="h-1" />
            <p className="text-xs text-muted-foreground mt-1 text-center">
              {scrollProgress < 95 ? 'Прокрутите до конца' : 'Вы прочитали всё соглашение'}
            </p>
          </div>
          <ScrollArea ref={scrollAreaRef} className="flex-1 pr-4">
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {getAgreementContent()}
              </div>
            </div>
          </ScrollArea>
        </div>

        <div className="flex-shrink-0 space-y-3 pt-3 border-t">
          <div className="flex items-start space-x-2">
            <Checkbox
              id="agree"
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked as boolean)}
              className="mt-0.5"
            />
            <Label htmlFor="agree" className="text-sm font-normal cursor-pointer leading-snug">
              Я прочитал(а) и принимаю условия соглашения об использовании платформы. 
              Подтверждаю достоверность предоставленных данных и согласие на обработку персональных данных.
            </Label>
          </div>

          <DialogFooter className="flex-row gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 sm:flex-none">
              Отмена
            </Button>
            <Button onClick={handleAccept} disabled={!agreed} className="flex-1 sm:flex-none">
              Принять и продолжить
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}