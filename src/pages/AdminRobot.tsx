import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Icon from '@/components/ui/icon';
import RuleForm from './robot/RuleForm';
import RulesList from './robot/RulesList';
import RuleEfficiency from './robot/RuleEfficiency';
import BacktestPanel from './robot/BacktestPanel';
import SignalsList from './robot/SignalsList';
import { loadRules, loadSignals, loadDataSource, runRobotNow, type Rule, type Signal, type Stats, type RuleStats } from './robot/robotApi';

interface Props {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function AdminRobot({ isAuthenticated, onLogout }: Props) {
  useScrollToTop();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [rules, setRules] = useState<Rule[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [ruleStats, setRuleStats] = useState<RuleStats[]>([]);
  const [denied, setDenied] = useState(false);
  const [running, setRunning] = useState(false);
  const [source, setSource] = useState<string>('');

  const refresh = useCallback(async () => {
    try {
      setRules(await loadRules());
    } catch {
      setDenied(true);
    }
    const s = await loadSignals();
    setSignals(s.items || []);
    setStats(s.stats || null);
    setRuleStats(s.rule_stats || []);
  }, []);

  useEffect(() => {
    refresh();
    loadDataSource().then(d => setSource(d.source)).catch(() => setSource('error'));
  }, [refresh]);

  const runNow = async () => {
    setRunning(true);
    try {
      await runRobotNow();
      toast({ title: 'Проверка выполнена' });
      await refresh();
    } catch {
      toast({ title: 'Не удалось запустить проверку', variant: 'destructive' });
    }
    setRunning(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
      <main className="container mx-auto max-w-4xl flex-1 px-4 py-6">
        <div className="mb-4 flex items-center gap-3">
          <Button variant="ghost" size="sm" className="p-2" onClick={() => navigate(-1)}>
            <Icon name="ArrowLeft" className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold">Торговый робот</h1>
          {!denied && (
            <Button variant="outline" size="sm" className="ml-auto" onClick={runNow} disabled={running}>
              <Icon name="Play" className="mr-1 h-4 w-4" />
              {running ? 'Проверяю...' : 'Проверить сейчас'}
            </Button>
          )}
        </div>

        {!denied && source && (
          <div className={`mb-4 inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm ${source === 'bcs' ? 'border-green-300 bg-green-50 text-green-800' : 'border-amber-300 bg-amber-50 text-amber-900'}`}>
            <Icon name={source === 'bcs' ? 'CircleCheck' : 'TriangleAlert'} className="h-4 w-4" />
            {source === 'bcs' ? 'Источник котировок: БКС' : source === 'moex' ? 'Источник котировок: MOEX (БКС недоступен)' : 'Источник котировок не определён'}
          </div>
        )}

        {denied ? (
          <p className="text-sm text-muted-foreground">Раздел доступен только ООО «Дойдум-Инвест».</p>
        ) : (
          <Tabs defaultValue="signals">
            <TabsList className="mb-4">
              <TabsTrigger value="signals">Сигналы</TabsTrigger>
              <TabsTrigger value="rules">Мои правила</TabsTrigger>
              <TabsTrigger value="eff">Эффективность</TabsTrigger>
              <TabsTrigger value="test">Тест на истории</TabsTrigger>
              <TabsTrigger value="new">Новое правило</TabsTrigger>
            </TabsList>
            <TabsContent value="signals">
              <SignalsList items={signals} stats={stats} onChanged={refresh} />
            </TabsContent>
            <TabsContent value="eff">
              <RuleEfficiency items={ruleStats} />
            </TabsContent>
            <TabsContent value="rules">
              <RulesList rules={rules} onChanged={refresh} />
            </TabsContent>
            <TabsContent value="test">
              <BacktestPanel rules={rules} />
            </TabsContent>
            <TabsContent value="new">
              <RuleForm onSaved={refresh} />
            </TabsContent>
          </Tabs>
        )}
      </main>
      <Footer />
    </div>
  );
}
