import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import StrategyPanel from './StrategyPanel';
import type { RobotItem } from './robotApi';

interface Props {
  robot: RobotItem | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function RobotSettingsDialog({ robot, onClose, onSaved }: Props) {
  return (
    <Dialog open={!!robot} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Настройки: {robot?.asset_name}</DialogTitle>
          <DialogDescription>Эти настройки действуют только на этого робота. Остальные роботы не меняются.</DialogDescription>
        </DialogHeader>
        {robot && <StrategyPanel robot={robot.ticker} onSaved={onSaved} />}
      </DialogContent>
    </Dialog>
  );
}
