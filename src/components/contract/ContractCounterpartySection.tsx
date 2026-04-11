import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import type { ContractFormData } from '@/hooks/useContractData';

interface ContractCounterpartySectionProps {
  formData: ContractFormData;
  set: (field: string, value: string) => void;
  isGenerating: boolean;
  onGenerate: () => void;
}

export default function ContractCounterpartySection({
  formData,
  set,
  isGenerating,
  onGenerate,
}: ContractCounterpartySectionProps) {
  const navigate = useNavigate();
  const isBarter = formData.contractType === 'barter';
  const isForwardRequest = formData.contractType === 'forward-request';

  return (
    <>
      {/* Контрагент */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Icon name="Users" size={18} />
            Контрагент ({isBarter ? 'Сторона 2' : isForwardRequest ? 'Поставщик' : 'Покупатель'})
          </CardTitle>
          <CardDescription>Заполните, если контрагент уже известен. Можно оставить пустым — поля будут для ручного заполнения.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>ФИО / Наименование</Label>
              <Input value={formData.counterpartyName} onChange={e => set('counterpartyName', e.target.value)} placeholder="Иванов Иван Иванович / ООО «Ромашка»" />
            </div>
            <div className="space-y-1">
              <Label>ИНН</Label>
              <Input value={formData.counterpartyInn} onChange={e => set('counterpartyInn', e.target.value)} placeholder="123456789012" maxLength={12} />
            </div>
            <div className="space-y-1">
              <Label>Организация</Label>
              <Input value={formData.counterpartyCompany} onChange={e => set('counterpartyCompany', e.target.value)} placeholder="ООО «Компания»" />
            </div>
            <div className="space-y-1">
              <Label>Город</Label>
              <Input value={formData.counterpartyCity} onChange={e => set('counterpartyCity', e.target.value)} placeholder="Москва" />
            </div>
            <div className="space-y-1">
              <Label>Телефон</Label>
              <Input value={formData.counterpartyPhone} onChange={e => set('counterpartyPhone', e.target.value)} placeholder="+7 (900) 123-45-67" />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" value={formData.counterpartyEmail} onChange={e => set('counterpartyEmail', e.target.value)} placeholder="partner@example.com" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Доп. условия */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Icon name="ClipboardList" size={18} />
            Название и дополнительные условия
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>Название контракта (для «Моих контрактов»)</Label>
            <Input value={formData.title} onChange={e => set('title', e.target.value)} placeholder="Например: Поставка молока, октябрь 2026" />
          </div>
          <div className="space-y-1">
            <Label>Дополнительные условия (будут добавлены в контракт)</Label>
            <Textarea value={formData.termsConditions} onChange={e => set('termsConditions', e.target.value)} rows={3} placeholder="Особые требования к качеству, упаковке, документации..." />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 pb-4">
        <Button onClick={onGenerate} disabled={isGenerating} className="flex-1">
          {isGenerating ? (
            <><Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />Формирую документ...</>
          ) : (
            <><Icon name="FileDown" className="mr-2 h-4 w-4" />Сформировать контракт</>
          )}
        </Button>
        <Button type="button" variant="outline" onClick={() => navigate('/trading')}>Отмена</Button>
      </div>
    </>
  );
}
