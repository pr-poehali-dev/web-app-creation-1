import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import type { ContractFormData } from '@/hooks/useContractData';
import AIAssistButton from '@/components/offer/AIAssistButton';

interface ContractCounterpartySectionProps {
  formData: ContractFormData;
  set: (field: string, value: string) => void;
  isGenerating: boolean;
  isSubmitting: boolean;
  isPublishing: boolean;
  onSave: () => void;
  onPublish: () => void;
}

export default function ContractCounterpartySection({
  formData,
  set,
  isGenerating,
  isSubmitting,
  isPublishing,
  onSave,
  onPublish,
}: ContractCounterpartySectionProps) {
  const navigate = useNavigate();

  return (
    <>
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
            <div className="flex items-center justify-between">
              <Label>Название контракта (для «Моих контрактов»)</Label>
              {formData.title.length >= 3 && (
                <AIAssistButton
                  action="improve_title"
                  title={formData.title}
                  onResult={text => set('title', text.slice(0, 150))}
                  label="Улучшить"
                />
              )}
            </div>
            <Input value={formData.title} onChange={e => set('title', e.target.value)} placeholder="Например: Поставка молока, октябрь 2026" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label>Дополнительные условия (будут добавлены в контракт)</Label>
              {formData.termsConditions.length >= 3 ? (
                <AIAssistButton
                  action="improve_description"
                  title={formData.title}
                  description={formData.termsConditions}
                  onResult={text => set('termsConditions', text.slice(0, 2000))}
                  label="Улучшить"
                />
              ) : formData.title.length >= 3 && formData.termsConditions.length === 0 ? (
                <AIAssistButton
                  action="suggest_description"
                  title={formData.title}
                  onResult={text => set('termsConditions', text.slice(0, 2000))}
                  label="Сгенерировать"
                />
              ) : null}
            </div>
            <Textarea value={formData.termsConditions} onChange={e => set('termsConditions', e.target.value)} rows={3} placeholder="Особые требования к качеству, упаковке, документации..." />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 pb-4">
        <div className="flex gap-3">
          <Button onClick={() => onSave()} disabled={isGenerating || isSubmitting || isPublishing} variant="outline" className="flex-1">
            {isSubmitting ? (
              <><Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />Сохраняю...</>
            ) : (
              <><Icon name="Save" className="mr-2 h-4 w-4" />Сохранить черновик</>
            )}
          </Button>
          <Button onClick={() => onPublish()} disabled={isGenerating || isSubmitting || isPublishing} className="flex-1">
            {isPublishing ? (
              <><Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />Публикую...</>
            ) : (
              <><Icon name="Globe" className="mr-2 h-4 w-4" />Опубликовать</>
            )}
          </Button>
        </div>
        <Button type="button" variant="ghost" onClick={() => navigate('/trading')} className="text-muted-foreground">
          Отмена
        </Button>
      </div>
    </>
  );
}