import func2url from '../../../backend/func2url.json';
import { getSession } from '@/utils/auth';

const API = func2url['ai-assist'];

export interface Condition {
  type: string;
  op?: string;
  value?: number;
  fast?: number;
  slow?: number;
  period?: number;
  dir?: string;
  tf?: number;
}

export interface Rule {
  id: number;
  name: string;
  ticker: string;
  asset_name: string;
  kind: string;
  direction: string;
  timeframe: number;
  asset_code?: string | null;
  entry_conditions: Condition[];
  exit_conditions: Condition[];
  entry_text: string[];
  exit_text: string[];
  stop_atr: string;
  target1_atr: string;
  target2_atr: string;
  enabled: boolean;
}

export interface Signal {
  id: number;
  ticker: string;
  asset_name: string;
  direction: string;
  timeframe: string;
  entry: string;
  stop_loss: string;
  target1: string;
  target2: string;
  reason: string;
  status: string;
  exit_price: string | null;
  exit_reason: string | null;
  result_pct: string | null;
  created_at: string;
}

export interface Stats {
  closed: number;
  wins: number;
  avg_pct: string;
  total_pct: string;
}

export interface RuleStats {
  rule_id: number | null;
  name: string;
  closed: number;
  open_count: number;
  wins: number;
  avg_pct: string;
  total_pct: string;
  avg_win: string;
  avg_loss: string;
  gross_win: string;
  gross_loss: string;
}

export interface RuleDraft {
  id?: number;
  name: string;
  ticker: string;
  asset_name: string;
  kind: string;
  direction: string;
  timeframe: number;
  entry_conditions: Condition[];
  exit_conditions: Condition[];
  stop_atr: number;
  target1_atr: number;
  target2_atr: number;
}

const headers = () => ({
  'Content-Type': 'application/json',
  'X-User-Id': String(getSession()?.id ?? ''),
});

export async function loadSignals(): Promise<{ items: Signal[]; stats: Stats; rule_stats: RuleStats[] }> {
  const r = await fetch(`${API}?action=robot_signals`);
  return r.json();
}

export async function loadRules(): Promise<Rule[]> {
  const r = await fetch(`${API}?action=robot_rules`, { headers: headers() });
  if (!r.ok) throw new Error('forbidden');
  const d = await r.json();
  return d.items || [];
}

export async function saveRule(draft: RuleDraft): Promise<{ ok: boolean; error?: string }> {
  const r = await fetch(`${API}?action=robot_rule_save`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(draft),
  });
  const d = await r.json();
  return r.ok ? { ok: true } : { ok: false, error: d.error };
}

export async function ruleAction(action: 'robot_rule_toggle' | 'robot_rule_delete', id: number): Promise<void> {
  await fetch(`${API}?action=${action}`, { method: 'POST', headers: headers(), body: JSON.stringify({ id }) });
}

export async function runRobotNow(): Promise<unknown> {
  const r = await fetch(`${API}?action=robot_run&force=1`);
  return r.json();
}

export async function loadDataSource(): Promise<{ source: string; candles: number }> {
  const r = await fetch(`${API}?action=robot_source`);
  return r.json();
}

export interface SignalEdit {
  id: number;
  entry: number;
  stop_loss: number;
  target1: number;
  target2: number;
  reason: string;
  close_price?: number | null;
}

export async function updateSignal(data: SignalEdit): Promise<{ ok: boolean; error?: string }> {
  const r = await fetch(`${API}?action=robot_signal_update`, { method: 'POST', headers: headers(), body: JSON.stringify(data) });
  const d = await r.json();
  return r.ok ? { ok: true } : { ok: false, error: d.error };
}

export async function deleteSignal(id: number): Promise<void> {
  await fetch(`${API}?action=robot_signal_delete`, { method: 'POST', headers: headers(), body: JSON.stringify({ id }) });
}

export interface BacktestTrade {
  date: string;
  direction: string;
  entry: number;
  stop: number;
  target1: number;
  target2: number;
  exit_date: string | null;
  exit_price: number;
  reason: string;
  t1_hit: boolean;
  result_pct: number;
  closed: boolean;
}

export interface BacktestResult {
  title: string;
  from: string | null;
  to: string | null;
  summary: {
    signals: number;
    closed: number;
    open: number;
    wins: number;
    win_rate: number;
    total_pct: number;
    avg_pct: number;
    profit_factor: number | null;
    max_drawdown_pct: number;
  };
  trades: BacktestTrade[];
  error?: string;
}

export async function runBacktest(params: Record<string, string>): Promise<BacktestResult> {
  const qs = new URLSearchParams({ action: 'robot_backtest', ...params });
  const r = await fetch(`${API}?${qs}`, { headers: headers() });
  return r.json();
}
