import { Button } from '@/components/ui/button';

interface OrderFormActionsProps {
  quantityError: string;
  addressError: string;
  onClose: () => void;
}

export default function OrderFormActions({ quantityError, addressError, onClose }: OrderFormActionsProps) {
  return (
    <div className="flex gap-3 pt-2">
      <Button
        type="submit"
        className="flex-1"
        disabled={!!quantityError || !!addressError}
      >
        Отправить заказ
      </Button>
      <Button type="button" variant="outline" onClick={onClose}>
        Отмена
      </Button>
    </div>
  );
}
