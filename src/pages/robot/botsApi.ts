import func2url from '../../../backend/func2url.json';
import { getSession } from '@/utils/auth';
import type { BacktestResult } from './robotApi';

const API = func2url['ai-assist'];

const hdr = (): Record<string, string> => {
  const s = getSession();
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (s?.id) h['X-User-Id'] = String(s.id);
  return h;
};

export type FieldDef =
  | { t: 'num'; default: number; min: number; max: number; label: string; hint: string; int: boolean }
  | { t: 'flag'; default: boolean; label: string; hint: string }
  | { t: 'select'; default: string; options: [string, string][]; label: string; hint: string };

export interface BotGroup {
  title: string;
  note: string;
  fields: Record<string, FieldDef>;
}

export interface BotTypeMeta {
  title: string;
  desc: string;
  timeframe: string;
  groups: BotGroup[];
  defaults: Record<string, number | boolean | string>;
}

export interface BotMeta {
  types: Record<string, BotTypeMeta>;
  assets: [string, string][];
}

export type BotSettings = Record<string, number | boolean | string>;

export interface BotStat {
  open_count: number;
  closed: number;
  wins?: number;
  total_pct: number;
}

export interface Bot {
  id: number;
  bot_type: string;
  type_title: string;
  name: string;
  asset_code: string;
  mode: 'off' | 'paper' | 'live';
  settings: BotSettings;
  contract: string | null;
  days_left: number | null;
  last_run_at: string | null;
  last_status: string | null;
  paper_days: number;
  paper: BotStat;
  live: BotStat;
}

export interface BotLogItem {
  id: number;
  kind: string;
  text: string;
  created_at: string;
}

export interface BotEvent {
  id: number;
  event_time: string;
  title: string;
  importance: number;
  repeat_weekly: boolean;
  repeat_until?: string | null;
}

export interface BotBacktest extends BacktestResult {
  log?: { t: string; kind: string; text: string }[];
}

async function call<T>(action: string, opts: { body?: object; query?: Record<string, string> } = {}): Promise<T> {
  const qs = new URLSearchParams({ action, ...(opts.query || {}) });
  const r = await fetch(`${API}?${qs}`, {
    method: opts.body ? 'POST' : 'GET',
    headers: hdr(),
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || 'Ошибка');
  return j as T;
}

export const botsMeta = () => call<BotMeta>('bots_meta');
export const botsList = async () => (await call<{ items: Bot[] }>('bots_list')).items;
export const botsSave = (body: { id?: number; bot_type: string; name: string; asset_code: string; settings: BotSettings }) =>
  call<{ id: number; item: Bot }>('bots_save', { body });
export const botsDelete = (id: number) => call('bots_delete', { body: { id } });
export const botsMode = (id: number, mode: string, confirm = false) => call<{ item: Bot }>('bots_mode', { body: { id, mode, confirm } });
export const botsLog = async (id: number) => (await call<{ items: BotLogItem[] }>('bots_log', { query: { id: String(id) } })).items;
export const botsBacktest = (id: number, days: string, proven = false) =>
  call<BotBacktest>('bots_backtest', { query: { id: String(id), days, ...(proven ? { proven: '1' } : {}) } });
export const botsRun = (id: number) => call<{ status: string }>('bots_run', { body: { id } });
export const botsEvents = async () => (await call<{ items: BotEvent[] }>('bots_events')).items;
export const botsEventSave = (body: { title: string; event_time: string; importance: number; repeat_weekly: boolean; repeat_until?: string }) => call('bots_event_save', { body });
export const botsEventDelete = (id: number) => call('bots_event_delete', { body: { id } });
