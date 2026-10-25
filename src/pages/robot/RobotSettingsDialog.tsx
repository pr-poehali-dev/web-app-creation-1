import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StrategyPanel from './StrategyPanel';
import BacktestPanel from './BacktestPanel';
import type { RobotItem } from './robotApi';

interface Props {
  robot: RobotItem | null;
  tab: 'settings' | 'history';
  onTab: (t: 'settings' | 'history') => void;
  onClose: () => void;
  onSaved: () => void;
}

export default function RobotSettingsDialog({ robot, tab, onTab, onClose, onSaved }: Props) {
  return (
    <Dialog open={!!robot} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{robot?.asset_name}</DialogTitle>
          <DialogDescription>Настройки и проверка на истории действуют только для этого робота.</DialogDescription>
        </DialogHeader>
        {robot && (
          <Tabs value={tab} onValueChange={(v) => onTab(v as 'settings' | 'history')}>
            <TabsList className="mb-3">
              <TabsTrigger value="settings">Настройки</TabsTrigger>
              <TabsTrigger value="history">Проверка на истории</TabsTrigger>
            </TabsList>
            <TabsContent value="settings">
              <StrategyPanel robot={robot.ticker} onSaved={onSaved} />
            </TabsContent>
            <TabsContent value="history">
              <BacktestPanel target={{ robot: robot.ticker }} />
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
