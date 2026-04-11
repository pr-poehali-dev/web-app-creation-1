import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const AI_ASSIST_URL = 'https://functions.poehali.dev/3c3c03a1-545b-4d8f-916e-cfc3b8a7719a';

interface AIAssistButtonProps {
  action: 'improve_title' | 'improve_description' | 'suggest_description';
  title?: string;
  description?: string;
  category?: string;
  onResult: (text: string) => void;
  label?: string;
}

export default function AIAssistButton({
  action,
  title,
  description,
  category,
  onResult,
  label,
}: AIAssistButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch(AI_ASSIST_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, title, description, category }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка');
      onResult(data.result);
    } catch {
      toast({ title: 'ИИ недоступен', description: 'Попробуйте чуть позже', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={loading}
      className="gap-1.5 text-xs text-muted-foreground border-dashed hover:border-primary hover:text-primary"
    >
      {loading ? (
        <Icon name="Loader2" size={14} className="animate-spin" />
      ) : (
        <Icon name="Sparkles" size={14} />
      )}
      {loading ? 'Думаю...' : (label || 'Улучшить с ИИ')}
    </Button>
  );
}
