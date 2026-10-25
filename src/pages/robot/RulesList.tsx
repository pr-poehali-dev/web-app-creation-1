import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import RuleForm from './RuleForm';
import BacktestPanel from './BacktestPanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { ruleAction, type Rule } from './robotApi';

export default function RulesList({ rules, onChanged }: { rules: Rule[]; onChanged: () => void }) {
  const [editing, setEditing] = useState<Rule | null>(null);
  const [testing, setTesting] = useState<Rule | null>(null);
  if (rules.length === 0) {
    return <p className="text-sm text-muted-foreground">Своих правил пока нет. Робот работает по стандартной стратегии для АЛРОСА, ВТБ и Brent.</p>;
  }

  const act = async (a: 'robot_rule_toggle' | 'robot_rule_delete', id: number) => {
    await ruleAction(a, id);
    onChanged();
  };

  return (
    <div className="space-y-3">
      {rules.map((r) => (
        <Card key={r.id} className={r.enabled ? '' : 'opacity-60'}>
          <CardContent className="space-y-2 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">{r.name}</span>
              <Badge variant="outline">{r.asset_name} ({r.ticker})</Badge>
              <Badge className={r.direction === 'ЛОНГ' ? 'bg-green-600 text-white' : r.direction === 'ШОРТ' ? 'bg-red-600 text-white' : 'bg-slate-700 text-white'}>
                {r.direction === 'ОБА' ? 'ЛОНГ + ШОРТ' : r.direction}
              </Badge>
              <Badge variant="outline">{r.timeframe === 60 ? '1 час' : `${r.timeframe} мин`}</Badge>
              <div className="ml-auto flex gap-1">
                <Button size="sm" variant="outline" onClick={() => act('robot_rule_toggle', r.id)}>
                  <Icon name={r.enabled ? 'Pause' : 'Play'} className="mr-1 h-4 w-4" />
                  {r.enabled ? 'Выключить' : 'Включить'}
                </Button>
                <Button size="sm" variant="ghost" title="Проверить на истории" onClick={() => setTesting(r)}>
                  <Icon name="History" className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(r)}>
                  <Icon name="Pencil" className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => act('robot_rule_delete', r.id)}>
                  <Icon name="Trash2" className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Вход: </span>
              {r.entry_text.join(' и ')}
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Выход: </span>
              {r.exit_text.length ? r.exit_text.join(' или ') : 'только стоп и цели'}
            </div>
            <div className="text-xs text-muted-foreground">
              Стоп {Number(r.stop_atr)} · цель 1 {Number(r.target1_atr)} · цель 2 {Number(r.target2_atr)}
            </div>
          </CardContent>
        </Card>
      ))}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto p-0">
          <DialogTitle className="sr-only">Изменить правило</DialogTitle>
          {editing && <RuleForm key={editing.id} rule={editing} onSaved={onChanged} onCancel={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>
      <Dialog open={!!testing} onOpenChange={(o) => !o && setTesting(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogTitle>Проверка на истории: {testing?.name}</DialogTitle>
          {testing && <BacktestPanel key={testing.id} target={{ ruleId: testing.id }} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
