#property copyright "ERTTP"
#property version   "1.00"
#property strict

#include <Trade/Trade.mqh>

enum ENUM_LOT_MODE { LOT_FIXED = 0, LOT_RISK_PERCENT = 1 };

input group "Волны"
input int    InpPivotBars   = 5;
input double InpMinBRetrace = 0.30;
input double InpMaxBRetrace = 0.95;
input double InpMinCExt     = 0.90;
input double InpMaxCExt     = 1.90;
input double InpMaxEntryPos = 0.50;

input group "Выход"
input int    InpATRPeriod   = 14;
input double InpSLAtrBuffer = 0.5;
input double InpTPRetrace   = 0.618;
input double InpMinRR       = 1.0;

input group "Риск"
input ENUM_LOT_MODE InpLotMode = LOT_RISK_PERCENT;
input double InpFixedLot    = 0.10;
input double InpRiskPercent = 1.0;
input double InpDailyLossPct = 3.0;
input bool   InpCloseOnDailyLimit = true;
input int    InpMaxSpreadPts = 0;

input group "Прочее"
input long   InpMagic       = 20261027;
input int    InpSlippage    = 20;
input bool   InpAllowBuy    = true;
input bool   InpAllowSell   = true;

struct Pivot
{
   datetime time;
   double   price;
   bool     isHigh;
};

CTrade g_trade;
Pivot  g_piv[];
int    g_atr = INVALID_HANDLE;
datetime g_lastBar = 0;

int OnInit()
{
   g_atr = iATR(_Symbol, _Period, InpATRPeriod);
   if(g_atr == INVALID_HANDLE) return INIT_FAILED;
   g_trade.SetExpertMagicNumber(InpMagic);
   g_trade.SetDeviationInPoints(InpSlippage);
   g_trade.SetTypeFillingBySymbol(_Symbol);
   ArrayResize(g_piv, 0);
   return INIT_SUCCEEDED;
}

void OnDeinit(const int reason)
{
   if(g_atr != INVALID_HANDLE) IndicatorRelease(g_atr);
}

bool HasPosition()
{
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      ulong t = PositionGetTicket(i);
      if(t == 0) continue;
      if(PositionGetString(POSITION_SYMBOL) == _Symbol && PositionGetInteger(POSITION_MAGIC) == InpMagic)
         return true;
   }
   return false;
}

void CloseAll()
{
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      ulong t = PositionGetTicket(i);
      if(t == 0) continue;
      if(PositionGetString(POSITION_SYMBOL) == _Symbol && PositionGetInteger(POSITION_MAGIC) == InpMagic)
         g_trade.PositionClose(t);
   }
}

double DayResult(double &startBalance)
{
   datetime dayStart = iTime(_Symbol, PERIOD_D1, 0);
   double realized = 0;
   if(HistorySelect(dayStart, TimeCurrent()))
   {
      for(int i = HistoryDealsTotal() - 1; i >= 0; i--)
      {
         ulong d = HistoryDealGetTicket(i);
         if(d == 0) continue;
         if(HistoryDealGetInteger(d, DEAL_MAGIC) != InpMagic) continue;
         if(HistoryDealGetInteger(d, DEAL_ENTRY) != DEAL_ENTRY_OUT) continue;
         realized += HistoryDealGetDouble(d, DEAL_PROFIT) + HistoryDealGetDouble(d, DEAL_SWAP) + HistoryDealGetDouble(d, DEAL_COMMISSION);
      }
   }
   double floating = 0;
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      ulong t = PositionGetTicket(i);
      if(t == 0) continue;
      if(PositionGetInteger(POSITION_MAGIC) == InpMagic)
         floating += PositionGetDouble(POSITION_PROFIT) + PositionGetDouble(POSITION_SWAP);
   }
   startBalance = AccountInfoDouble(ACCOUNT_BALANCE) - realized;
   return realized + floating;
}

bool DailyLimitReached()
{
   if(InpDailyLossPct <= 0) return false;
   double startBal;
   double res = DayResult(startBal);
   return res <= -(startBal * InpDailyLossPct / 100.0);
}

double NormalizeLot(double lot)
{
   double mn = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
   double mx = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MAX);
   double st = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_STEP);
   if(st <= 0) st = mn;
   lot = MathFloor(lot / st) * st;
   if(lot < mn) lot = mn;
   if(lot > mx) lot = mx;
   return NormalizeDouble(lot, 2);
}

double CalcLot(bool isBuy, double entry, double sl)
{
   if(InpLotMode == LOT_FIXED) return NormalizeLot(InpFixedLot);
   double profit = 0;
   ENUM_ORDER_TYPE type = isBuy ? ORDER_TYPE_BUY : ORDER_TYPE_SELL;
   if(!OrderCalcProfit(type, _Symbol, 1.0, entry, sl, profit) || profit >= 0) return NormalizeLot(InpFixedLot);
   double riskMoney = AccountInfoDouble(ACCOUNT_BALANCE) * InpRiskPercent / 100.0;
   return NormalizeLot(riskMoney / MathAbs(profit));
}

bool IsPivotHigh(int shift)
{
   double h = iHigh(_Symbol, _Period, shift);
   for(int k = 1; k <= InpPivotBars; k++)
      if(iHigh(_Symbol, _Period, shift - k) >= h || iHigh(_Symbol, _Period, shift + k) > h) return false;
   return true;
}

bool IsPivotLow(int shift)
{
   double l = iLow(_Symbol, _Period, shift);
   for(int k = 1; k <= InpPivotBars; k++)
      if(iLow(_Symbol, _Period, shift - k) <= l || iLow(_Symbol, _Period, shift + k) < l) return false;
   return true;
}

void AddPivot(datetime t, double price, bool isHigh)
{
   int n = ArraySize(g_piv);
   if(n > 0 && g_piv[n - 1].isHigh == isHigh)
   {
      bool better = isHigh ? (price > g_piv[n - 1].price) : (price < g_piv[n - 1].price);
      if(better)
      {
         g_piv[n - 1].time = t;
         g_piv[n - 1].price = price;
      }
      return;
   }
   ArrayResize(g_piv, n + 1);
   g_piv[n].time = t;
   g_piv[n].price = price;
   g_piv[n].isHigh = isHigh;
   if(n + 1 > 12)
   {
      for(int i = 1; i < n + 1; i++) g_piv[i - 1] = g_piv[i];
      ArrayResize(g_piv, n);
   }
}

bool SpreadOk()
{
   if(InpMaxSpreadPts <= 0) return true;
   return SymbolInfoInteger(_Symbol, SYMBOL_SPREAD) <= InpMaxSpreadPts;
}

void TryEntry()
{
   int n = ArraySize(g_piv);
   if(n < 4 || HasPosition() || !SpreadOk() || DailyLimitReached()) return;

   double atr[1];
   if(CopyBuffer(g_atr, 0, 1, 1, atr) != 1) return;

   Pivot c = g_piv[n - 1];
   Pivot b = g_piv[n - 2];
   Pivot a1 = g_piv[n - 3];
   Pivot a0 = g_piv[n - 4];

   double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
   double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
   int digits = (int)SymbolInfoInteger(_Symbol, SYMBOL_DIGITS);

   if(!c.isHigh && InpAllowBuy)
   {
      double waveA = a0.price - a1.price;
      if(waveA <= 0 || b.price >= a0.price) return;
      double bRet = (b.price - a1.price) / waveA;
      double cExt = (b.price - c.price) / waveA;
      if(bRet < InpMinBRetrace || bRet > InpMaxBRetrace) return;
      if(cExt < InpMinCExt || cExt > InpMaxCExt) return;
      double waveC = b.price - c.price;
      if(ask <= c.price || (ask - c.price) > waveC * InpMaxEntryPos) return;
      double sl = NormalizeDouble(c.price - atr[0] * InpSLAtrBuffer, digits);
      double tp = NormalizeDouble(c.price + waveC * InpTPRetrace, digits);
      double risk = ask - sl;
      if(risk <= 0 || (tp - ask) / risk < InpMinRR) return;
      g_trade.Buy(CalcLot(true, ask, sl), _Symbol, ask, sl, tp, "WaveC buy");
   }
   else if(c.isHigh && InpAllowSell)
   {
      double waveA = a1.price - a0.price;
      if(waveA <= 0 || b.price <= a0.price) return;
      double bRet = (a1.price - b.price) / waveA;
      double cExt = (c.price - b.price) / waveA;
      if(bRet < InpMinBRetrace || bRet > InpMaxBRetrace) return;
      if(cExt < InpMinCExt || cExt > InpMaxCExt) return;
      double waveC = c.price - b.price;
      if(bid >= c.price || (c.price - bid) > waveC * InpMaxEntryPos) return;
      double sl = NormalizeDouble(c.price + atr[0] * InpSLAtrBuffer, digits);
      double tp = NormalizeDouble(c.price - waveC * InpTPRetrace, digits);
      double risk = sl - bid;
      if(risk <= 0 || (bid - tp) / risk < InpMinRR) return;
      g_trade.Sell(CalcLot(false, bid, sl), _Symbol, bid, sl, tp, "WaveC sell");
   }
}

void OnTick()
{
   if(InpCloseOnDailyLimit && HasPosition() && DailyLimitReached())
   {
      CloseAll();
      return;
   }

   datetime bar = iTime(_Symbol, _Period, 0);
   if(bar == g_lastBar) return;
   g_lastBar = bar;

   if(Bars(_Symbol, _Period) < InpPivotBars * 2 + InpATRPeriod + 5) return;

   int shift = InpPivotBars + 1;
   bool newPivot = false;
   if(IsPivotHigh(shift))
   {
      AddPivot(iTime(_Symbol, _Period, shift), iHigh(_Symbol, _Period, shift), true);
      newPivot = true;
   }
   if(IsPivotLow(shift))
   {
      AddPivot(iTime(_Symbol, _Period, shift), iLow(_Symbol, _Period, shift), false);
      newPivot = true;
   }
   if(newPivot) TryEntry();
}
