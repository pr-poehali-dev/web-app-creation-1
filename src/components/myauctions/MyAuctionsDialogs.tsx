import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface MyAuctionsDialogsProps {
  auctionToDelete: string | null;
  auctionToStop: string | null;
  priceReduceAuction: { id: string; currentPrice: number } | null;
  newPrice: string;
  onDeleteConfirm: (id: string) => void;
  onDeleteCancel: () => void;
  onStopConfirm: (id: string) => void;
  onStopCancel: () => void;
  onReducePriceConfirm: () => void;
  onReducePriceCancel: () => void;
  onNewPriceChange: (value: string) => void;
}

export default function MyAuctionsDialogs({
  auctionToDelete,
  auctionToStop,
  priceReduceAuction,
  newPrice,
  onDeleteConfirm,
  onDeleteCancel,
  onStopConfirm,
  onStopCancel,
  onReducePriceConfirm,
  onReducePriceCancel,
  onNewPriceChange,
}: MyAuctionsDialogsProps) {
  return (
    <>
      <AlertDialog open={!!auctionToDelete} onOpenChange={onDeleteCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить аукцион?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Аукцион будет удален безвозвратно.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => auctionToDelete && onDeleteConfirm(auctionToDelete)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!auctionToStop} onOpenChange={onStopCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Остановить аукцион?</AlertDialogTitle>
            <AlertDialogDescription>
              Аукцион будет завершен досрочно. Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => auctionToStop && onStopConfirm(auctionToStop)}
              className="bg-orange-600 text-white hover:bg-orange-700"
            >
              Остановить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!priceReduceAuction} onOpenChange={onReducePriceCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Снизить цену</AlertDialogTitle>
            <AlertDialogDescription>
              Текущая цена: {priceReduceAuction?.currentPrice.toLocaleString('ru-RU')} ₽
              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">Новая цена (ниже текущей):</label>
                <input
                  type="number"
                  value={newPrice}
                  onChange={(e) => onNewPriceChange(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Введите новую цену"
                  min="0"
                  step="1"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={onReducePriceCancel}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={onReducePriceConfirm}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Снизить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
