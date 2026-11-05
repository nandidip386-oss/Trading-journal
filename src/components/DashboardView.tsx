import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Percent,
  DollarSign,
  ShieldAlert,
  Award,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { Trade, TradeMetrics, EquityPoint, CurrencyCode } from '../types/trade';
import { calculateEquityCurve, aggregateDailyStats, formatCurrency } from '../utils/tradeMetrics';
import { UsdInrRatePill } from './UsdInrRatePill';

interface DashboardViewProps {
  trades: Trade[];
  metrics: TradeMetrics;
  onOpenTrade: (trade: Trade) => void;
  onNavigateToTrades: () => void;
  onNavigateToCalendar: () => void;
  onLoadDemoTrades?: () => void;
  onAddTrade: () => void;
  displayCurrency?: CurrencyCode;
  onCurrencyChange?: (currency: CurrencyCode) => void;
  usdToInrRate?: number;
  onUsdToInrRateChange?: (rate: number) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  trades,
  metrics,
  onOpenTrade,
  onNavigateToTrades,
  onNavigateToCalendar,
  onLoadDemoTrades,
  onAddTrade,
  displayCurrency = 'USD',
  onCurrencyChange,
  usdToInrRate,
  onUsdToInrRateChange
}) => {
  const [timeframe, setTimeframe] = useState<'ALL' | '30D' | '90D' | '7D'>('ALL');
  const [hoveredPoint, setHoveredPoint] = useState<EquityPoint | null>(null);

  // Filter trades for equity curve based on timeframe
  const now = new Date().getTime();
  const filteredTrades = trades.filter(t => {
    if (timeframe === 'ALL') return true;
    const tTime = new Date(t.entryDate).getTime();
    const days = timeframe === '7D' ? 7 : timeframe === '30D' ? 30 : 90;
    return now - tTime <= days * 24 * 60 * 60 * 1000;
  });

  const equityCurve = calculateEquityCurve(filteredTrades);
  const dailyStats = Object.values(aggregateDailyStats(filteredTrades)).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const isProfitable = metrics.netPnl >= 0;

  // Chart coordinate calculations
  const chartHeight = 220;
  const chartWidth = 720;
  let minEquity = 0;
  let maxEquity = 100;

  if (equityCurve.length > 0) {
    const vals = equityCurve.map(p => p.cumulativePnl);
    minEquity = Math.min(0, ...vals);
    maxEquity = Math.max(100, ...vals);
  }
  const equityRange = maxEquity - minEquity || 1;

  const pointsString = equityCurve
    .map((point, index) => {
      const x = (index / Math.max(1, equityCurve.length - 1)) * (chartWidth - 40) + 20;
      const y = chartHeight - 30 - ((point.cumulativePnl - minEquity) / equityRange) * (chartHeight - 60);
      return `${x},${y}`;
    })
    .join(' ');

  const zeroY = chartHeight - 30 - ((0 - minEquity) / equityRange) * (chartHeight - 60);

  // SVG Area path
  const areaPath = equityCurve.length > 0
    ? `M 20,${zeroY} L ${pointsString} L ${chartWidth - 20},${zeroY} Z`
    : '';

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Banner / Overview Status */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-[#101726] to-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-emerald-500/5 blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">Performance Overview</h1>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-400">
            Real-time sync across devices • Tracking {metrics.totalTrades} journaled executions
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2 relative z-10 w-full xl:w-auto justify-start xl:justify-end">
          {/* Currency Switcher Mode Toggle */}
          <div className="flex items-center gap-1 bg-[#131824] p-1 rounded-xl border border-slate-700/80 shadow-sm">
            <button
              type="button"
              onClick={() => onCurrencyChange?.('USD')}
              title="Display dashboard in US Dollars ($)"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                displayCurrency === 'USD'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>$ USD</span>
            </button>
            <button
              type="button"
              onClick={() => onCurrencyChange?.('INR')}
              title="Display dashboard in Indian Rupees (₹) with auto-conversion"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                displayCurrency === 'INR'
                  ? 'bg-purple-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>₹ INR</span>
            </button>
          </div>

          <UsdInrRatePill
            rate={usdToInrRate}
            onRateChange={onUsdToInrRateChange}
            className="inline-flex"
          />

          {trades.length === 0 ? (
            onLoadDemoTrades && (
              <button
                onClick={onLoadDemoTrades}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold hover:bg-emerald-500/20 transition-all cursor-pointer shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Load Demo</span>
              </button>
            )
          ) : (
            <button
              onClick={onNavigateToCalendar}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold hover:bg-slate-700 hover:text-white transition-all cursor-pointer shadow-sm"
            >
              <span>Calendar</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          )}
        </div>
      </div>

      {/* Primary Key Performance Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Net P&L */}
        <div className="col-span-2 sm:col-span-1 lg:col-span-2 bg-[#101522] rounded-xl p-4 border border-slate-800/90 relative overflow-hidden group hover:border-slate-700 transition-colors shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Net P&L</span>
            <div className={`p-1.5 rounded-lg ${isProfitable ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
              {isProfitable ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl lg:text-3xl font-extrabold tracking-tight font-mono-numbers ${isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatCurrency(metrics.netPnl, true, 2, displayCurrency)}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
            <span>Gross: <strong className="text-slate-300 font-mono-numbers">{formatCurrency(metrics.grossWins, false, 0, displayCurrency)}</strong></span>
            <span>•</span>
            <span>Fees: <strong className="text-slate-300 font-mono-numbers">{formatCurrency(metrics.totalFees, false, 2, displayCurrency)}</strong></span>
          </div>
        </div>

        {/* Win Rate */}
        <div className="bg-[#101522] rounded-xl p-4 border border-slate-800/90 relative overflow-hidden group hover:border-slate-700 transition-colors shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Win Rate</span>
            <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white font-mono-numbers">
            {metrics.winRate}%
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span className="text-emerald-400 font-semibold">{metrics.winCount}W</span>
            <span className="text-rose-400 font-semibold">{metrics.lossCount}L</span>
            <span className="text-slate-400">{metrics.breakevenCount}BE</span>
          </div>
        </div>

        {/* Profit Factor */}
        <div className="bg-[#101522] rounded-xl p-4 border border-slate-800/90 relative overflow-hidden group hover:border-slate-700 transition-colors shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Profit Factor</span>
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white font-mono-numbers">
            {metrics.profitFactor > 50 ? '50.0+' : metrics.profitFactor.toFixed(2)}
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            {metrics.profitFactor >= 2 ? (
              <span className="text-emerald-400 font-medium">Exceptional Edge</span>
            ) : metrics.profitFactor >= 1.3 ? (
              <span className="text-teal-400 font-medium">Profitable Edge</span>
            ) : (
              <span className="text-amber-400 font-medium">Needs Tuning</span>
            )}
          </div>
        </div>

        {/* Average Win / Loss */}
        <div className="bg-[#101522] rounded-xl p-3.5 sm:p-4 border border-slate-800/90 relative overflow-hidden group hover:border-slate-700 transition-colors shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-1.5 sm:mb-2">
              <span className="text-[11px] sm:text-xs font-medium uppercase tracking-wider truncate">Avg Win / Loss</span>
              <div className="p-1 sm:p-1.5 rounded-lg bg-sky-500/10 text-sky-400 shrink-0">
                <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-1.5 font-mono-numbers">
              <div className="flex items-baseline gap-1 min-w-0">
                <span className="text-[9px] uppercase font-bold text-emerald-500/70 sm:hidden">W:</span>
                <span className="text-base sm:text-lg font-bold text-emerald-400 truncate">
                  {formatCurrency(metrics.avgWin, true, 0, displayCurrency)}
                </span>
              </div>
              <span className="hidden sm:inline text-slate-600 font-normal shrink-0">/</span>
              <div className="flex items-baseline gap-1 min-w-0">
                <span className="text-[9px] uppercase font-bold text-rose-500/70 sm:hidden">L:</span>
                <span className="text-base sm:text-lg font-bold text-rose-400 truncate">
                  {formatCurrency(-metrics.avgLoss, true, 0, displayCurrency)}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-2 pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
            <span className="text-[10px] sm:text-[11px] text-slate-400">Ratio:</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 font-semibold text-slate-200 text-[10px] sm:text-[11px] font-mono-numbers">
              {metrics.winLossRatio.toFixed(2)} : 1
            </span>
          </div>
        </div>

        {/* Max Drawdown */}
        <div className="bg-[#101522] rounded-xl p-4 border border-slate-800/90 relative overflow-hidden group hover:border-slate-700 transition-colors shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Max Drawdown</span>
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-400 font-mono-numbers">
            {formatCurrency(-metrics.maxDrawdown, false, 0, displayCurrency)}
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Peak to Trough drop
          </div>
        </div>
      </div>

      {/* Main Charts Row: Cumulative Equity Curve & Daily P&L */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cumulative Equity Curve (2 Cols) */}
        <div className="lg:col-span-2 bg-[#101522] rounded-2xl p-5 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">Cumulative P&L Curve</h2>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono-numbers">
                  {equityCurve.length} Executions
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Continuous growth of net profits over trading history</p>
            </div>

            {/* Timeframe selector tabs */}
            <div className="flex items-center bg-[#151c2e] p-1 rounded-lg border border-slate-800 text-xs font-medium">
              {(['ALL', '90D', '30D', '7D'] as const).map(tf => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    timeframe === tf
                      ? 'bg-slate-700 text-emerald-400 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Chart Area */}
          <div className="relative w-full h-[220px] bg-[#0c1017]/60 rounded-xl border border-slate-800/80 p-2 overflow-hidden flex items-center justify-center">
            {equityCurve.length === 0 ? (
              <div className="text-center p-6">
                <p className="text-sm text-slate-400">No closed trades in selected timeframe.</p>
                <button
                  onClick={onAddTrade}
                  className="mt-2 text-xs text-emerald-400 hover:underline font-semibold"
                >
                  + Add your first trade
                </button>
              </div>
            ) : (
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-full overflow-visible"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Zero line */}
                <line
                  x1="10"
                  y1={zeroY}
                  x2={chartWidth - 10}
                  y2={zeroY}
                  stroke="#334155"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />

                {/* Shaded Area */}
                {areaPath && (
                  <path d={areaPath} fill="url(#equityGrad)" />
                )}

                {/* Line Path */}
                {pointsString && (
                  <polyline
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={pointsString}
                  />
                )}

                {/* Interactive Points */}
                {equityCurve.map((point, index) => {
                  const x = (index / Math.max(1, equityCurve.length - 1)) * (chartWidth - 40) + 20;
                  const y = chartHeight - 30 - ((point.cumulativePnl - minEquity) / equityRange) * (chartHeight - 60);
                  const isHovered = hoveredPoint?.tradeId === point.tradeId;

                  return (
                    <g key={point.tradeId} className="cursor-pointer">
                      <circle
                        cx={x}
                        cy={y}
                        r={isHovered ? 6 : 3.5}
                        fill={point.tradePnl >= 0 ? '#10b981' : '#f43f5e'}
                        stroke="#0c1017"
                        strokeWidth="2"
                        className="transition-all hover:scale-125"
                        onMouseEnter={() => setHoveredPoint(point)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                    </g>
                  );
                })}
              </svg>
            )}

            {/* Hover Tooltip Overlay */}
            {hoveredPoint && (
              <div className="absolute top-3 left-4 bg-slate-900/95 border border-slate-700/90 rounded-lg p-2.5 shadow-xl backdrop-blur-md pointer-events-none text-xs z-20">
                <div className="flex items-center justify-between gap-3 font-semibold text-slate-200">
                  <span>{hoveredPoint.symbol}</span>
                  <span className="text-[10px] text-slate-400 font-mono-numbers">{hoveredPoint.date}</span>
                </div>
                <div className="mt-1 flex items-center gap-3">
                  <span className="text-slate-400">Trade:</span>
                  <span className={`font-bold font-mono-numbers ${hoveredPoint.tradePnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatCurrency(hoveredPoint.tradePnl, true, 2, displayCurrency)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400">Equity:</span>
                  <span className="font-bold text-white font-mono-numbers">
                    {formatCurrency(hoveredPoint.cumulativePnl, false, 2, displayCurrency)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Bottom legend */}
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono-numbers">
              Start: {formatCurrency(equityCurve[0]?.cumulativePnl || 0, false, 0, displayCurrency)}
            </span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Winning trade
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Losing trade
              </span>
            </div>
            <span className="font-mono-numbers font-bold text-slate-200">
              Current: {formatCurrency(metrics.netPnl, true, 2, displayCurrency)}
            </span>
          </div>
        </div>

        {/* Daily P&L Bars & Quick Highlights (1 Col) */}
        <div className="bg-[#101522] rounded-2xl p-5 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white tracking-tight">Daily P&L Distribution</h2>
              <button
                onClick={onNavigateToCalendar}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
              >
                <span>Calendar</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* Daily Bars preview (last 10 active days) */}
            <div className="space-y-2">
              {dailyStats.slice(-7).map(day => {
                const isDayGreen = day.netPnl >= 0;
                return (
                  <div
                    key={day.date}
                    onClick={onNavigateToCalendar}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800/60 border border-slate-800/80 cursor-pointer transition-colors text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${isDayGreen ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                      <span className="text-slate-300 font-medium font-mono-numbers">{day.date}</span>
                      <span className="text-[10px] text-slate-400">({day.tradeCount} trades)</span>
                    </div>
                    <span className={`font-bold font-mono-numbers ${isDayGreen ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {formatCurrency(day.netPnl, true, 2, displayCurrency)}
                    </span>
                  </div>
                );
              })}
              {dailyStats.length === 0 && (
                <div className="text-xs text-slate-400 text-center py-6">
                  No daily trading activity to display.
                </div>
              )}
            </div>
          </div>

          {/* Quick Psychology & Execution Highlights */}
          <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-400" /> Best Playbook:
              </span>
              <span className="text-slate-200 font-semibold">{metrics.bestSetup}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-rose-400" /> Most Costly Mistake:
              </span>
              <span className="text-rose-400 font-semibold">{metrics.mostFrequentMistake}</span>
            </div>
            {metrics.totalMistakeCost > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Discipline Cost:</span>
                <span className="text-rose-400 font-mono-numbers font-bold">
                  {formatCurrency(-metrics.totalMistakeCost, false, 2, displayCurrency)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Trades Journal Feed */}
      <div className="bg-[#101522] rounded-2xl p-5 border border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Recent Trade Executions</h2>
            <p className="text-xs text-slate-400">Quick view of your latest journal entries</p>
          </div>
          <button
            onClick={onNavigateToTrades}
            className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
          >
            <span>View All Trades ({trades.length})</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {trades.length === 0 ? (
          <div className="text-center py-10 bg-slate-900/40 rounded-xl border border-dashed border-slate-800">
            <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-300">Your trading journal is empty</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Start by recording your first trade or load sample trades to explore performance dashboards.
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                onClick={onAddTrade}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-colors cursor-pointer"
              >
                + Add Trade
              </button>
              {onLoadDemoTrades && (
                <button
                  onClick={onLoadDemoTrades}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 font-medium text-xs transition-colors cursor-pointer"
                >
                  Load Demo Trades
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Symbol</th>
                  <th className="py-2.5 px-3">Side</th>
                  <th className="py-2.5 px-3">Asset</th>
                  <th className="py-2.5 px-3">Price</th>
                  <th className="py-2.5 px-3">Qty</th>
                  <th className="py-2.5 px-3">Net P&L</th>
                  <th className="py-2.5 px-3">Playbook / Setup</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {trades.slice(0, 6).map(trade => {
                  const isWin = trade.status === 'WIN';
                  const isLoss = trade.status === 'LOSS';
                  return (
                    <tr
                      key={trade.id}
                      onClick={() => onOpenTrade(trade)}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-3 text-slate-400 font-mono-numbers">
                        {trade.entryDate.split('T')[0]}
                      </td>
                      <td className="py-3 px-3 font-bold text-white group-hover:text-emerald-400 transition-colors">
                        <div className="flex items-center gap-1.5">
                          <span>{trade.symbol}</span>
                          {trade.currency === 'INR' && (
                            <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                              ₹
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          trade.side === 'LONG'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {trade.side}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400">
                        {trade.assetClass}
                      </td>
                      <td className="py-3 px-3 font-mono-numbers text-slate-300">
                        {formatCurrency(trade.entryPrice, false, 2, displayCurrency)}
                      </td>
                      <td className="py-3 px-3 font-mono-numbers text-slate-400">
                        {trade.quantity}
                      </td>
                      <td className="py-3 px-3 font-bold font-mono-numbers">
                        <span className={isWin ? 'text-emerald-400' : isLoss ? 'text-rose-400' : 'text-slate-400'}>
                          {formatCurrency(trade.netPnl, true, 2, displayCurrency)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        {trade.setup || '—'}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isWin
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : isLoss
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-slate-700 text-slate-300'
                        }`}>
                          {trade.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="text-slate-400 group-hover:text-white text-xs inline-flex items-center gap-1 font-medium">
                          Review <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
