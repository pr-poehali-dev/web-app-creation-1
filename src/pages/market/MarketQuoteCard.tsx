import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Quote } from './useMarketData';

interface MarketQuoteCardProps {
  quote: Quote | null;
  isLoading: boolean;
}

function formatPrice(n: number | null) {
  if (n === null || n === undefined) return '—';
  return n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function MarketQuoteCard({ quote, isLoading }: MarketQuoteCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center h-64">
          <Icon name="Loader2" size={28} className="animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!quote || quote.error) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <Icon name="AlertCircle" size={28} className="mx-auto mb-2 opacity-40" />
          {quote?.error || 'Выберите актив для просмотра'}
        </CardContent>
      </Card>
    );
  }

  const isPositive = (quote.changePercent ?? 0) >= 0;
  const chartColor = isPositive ? '#16a34a' : '#dc2626';

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="text-xs text-muted-foreground font-mono">{quote.ticker}</div>
            <h2 className="text-lg font-bold">{quote.name}</h2>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{formatPrice(quote.last)} ₽</div>
            {quote.changePercent !== null && (
              <div className={`flex items-center justify-end gap-1 text-sm font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                <Icon name={isPositive ? 'TrendingUp' : 'TrendingDown'} size={14} />
                {isPositive ? '+' : ''}{quote.changePercent?.toFixed(2)}%
                {quote.change !== null && <span>({isPositive ? '+' : ''}{formatPrice(quote.change)})</span>}
              </div>
            )}
          </div>
        </div>

        {quote.candles.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={quote.candles}>
              <defs>
                <linearGradient id="quoteGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} minTickGap={30} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} width={50} />
              <Tooltip
                formatter={(value: number) => [`${formatPrice(value)} ₽`, 'Цена закрытия']}
                labelFormatter={(d) => `Дата: ${d}`}
              />
              <Area type="monotone" dataKey="close" stroke={chartColor} strokeWidth={2} fill="url(#quoteGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
            Исторические данные недоступны
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 text-center text-xs pt-2 border-t">
          <div>
            <div className="text-muted-foreground">Открытие</div>
            <div className="font-semibold">{formatPrice(quote.open)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Максимум</div>
            <div className="font-semibold">{formatPrice(quote.high)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Минимум</div>
            <div className="font-semibold">{formatPrice(quote.low)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
