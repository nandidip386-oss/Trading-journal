import React from 'react';
import {
  BarChart3,
  Award,
  AlertTriangle,
  Calendar,
  Layers,
  Zap,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Percent
} from 'lucide-react';
import { Trade, TradeMetrics, CurrencyCode } from '../types/trade';
import {
  calculateSetupAnalysis,
  calculateAssetAnalysis,
  calculateDayOfWeekAnalysis,
  calculateMistakeAnalysis,
  formatCurrency
} from '../utils/tradeMetrics';

interface AnalyticsViewProps {
  trades: Trade[];
  metrics: TradeMetrics;
  displayCurrency?: CurrencyCode;
  onCurrencyChange?: (currency: CurrencyCode) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  trades,
  metrics,
  displayCurrency = 'USD',
  onCurrencyChange
}) => {
  const setupAnalysis = calculateSetupAnalysis(trades);
  const assetAnalysis = calculateAssetAnalysis(trades);
  const dayOfWeekAnalysis = calculateDayOfWeekAnalysis(trades);
  const mistakeAnalysis = calculateMistakeAnalysis(trades);

  // Highest P&L setup for scaling
  const maxSetupPnl = Math.max(1, ...setupAnalysis.map(s => Math.abs(s.netPnl)));

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-[#101522] rounded-2xl p-5 border border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            <h1 className="text-xl font-bold tracking-tight text-white">Performance Trends & Analytics</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Deep diagnostic breakdown of your edge by playbook setup, asset class, trading day, and psychology
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Currency Switcher Mode Toggle */}
          <div className="flex items-center gap-1.5 bg-[#131824] p-1 rounded-xl border border-slate-700/80 shadow-sm">
            <button
              type="button"
              onClick={() => onCurrencyChange?.('USD')}
              title="Display analytics in US Dollars ($)"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
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
              title="Display analytics in Indian Rupees (₹) with auto-conversion"
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                displayCurrency === 'INR'
                  ? 'bg-purple-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>₹ INR</span>
            </button>
          </div>

          <span className="hidden sm:inline-flex text-[11px] text-slate-400 font-mono-numbers px-2.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800">
            1 USD = ₹86.50
          </span>
        </div>
      </div>

      {/* Row 1: Playbook / Setup Edge & Asset Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Playbook / Strategy Analysis */}
        <div className="bg-[#101522] rounded-2xl p-5 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              <h2 className="text-base font-bold text-white tracking-tight">Playbook / Setup Profitability</h2>
            </div>
            <span className="text-xs text-slate-400">{setupAnalysis.length} Strategies Tracked</span>
          </div>

          {setupAnalysis.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">No setup data tagged in trades yet.</p>
          ) : (
            <div className="space-y-3">
              {setupAnalysis.map(item => {
                const isGreen = item.netPnl >= 0;
                const widthPercent = Math.min(100, (Math.abs(item.netPnl) / maxSetupPnl) * 100);

                return (
                  <div key={item.setup} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100">{item.setup}</span>
                        <span className="text-[10px] text-slate-400">({item.tradeCount} trades)</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400">Win Rate: <strong className="text-slate-200 font-mono-numbers">{item.winRate}%</strong></span>
                        <span className={`font-mono-numbers font-bold ${isGreen ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {formatCurrency(item.netPnl, true, 2, displayCurrency)}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${isGreen ? 'bg-emerald-400' : 'bg-rose-500'}`}
                        style={{ width: `${Math.max(5, widthPercent)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5">
                      <span>Profit Factor: <strong className="text-slate-300 font-mono-numbers">{item.profitFactor > 50 ? '50+' : item.profitFactor.toFixed(2)}</strong></span>
                      <span>Avg / Trade: <strong className="text-slate-300 font-mono-numbers">{formatCurrency(item.avgPnl, true, 2, displayCurrency)}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Asset Class Breakdown */}
        <div className="bg-[#101522] rounded-2xl p-5 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-400" />
              <h2 className="text-base font-bold text-white tracking-tight">Performance by Asset Class</h2>
            </div>
            <span className="text-xs text-slate-400">Multi-Market Comparison</span>
          </div>

          {assetAnalysis.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">No trades categorized by asset class.</p>
          ) : (
            <div className="space-y-3">
              {assetAnalysis.map(item => {
                const isGreen = item.netPnl >= 0;
                return (
                  <div key={item.assetClass} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{item.assetClass}</span>
                        <span className="text-[10px] text-slate-400 font-mono-numbers">
                          {item.tradeCount} trades
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Win Rate: <strong className="text-slate-200 font-mono-numbers">{item.winRate}%</strong>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`text-sm font-extrabold font-mono-numbers ${isGreen ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {formatCurrency(item.netPnl, true, 2, displayCurrency)}
                      </div>
                      <span className="text-[10px] text-slate-400">Total Net Gain/Loss</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Day of Week Performance & Psychological Mistake Costs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Day of Week Edge */}
        <div className="bg-[#101522] rounded-2xl p-5 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-400" />
              <h2 className="text-base font-bold text-white tracking-tight">Day of Week Performance</h2>
            </div>
            <span className="text-xs text-slate-400">Which day is most profitable?</span>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {dayOfWeekAnalysis.map(day => {
              const isGreen = day.netPnl >= 0;
              const hasTrades = day.tradeCount > 0;

              return (
                <div
                  key={day.dayName}
                  className={`p-3 rounded-xl border flex flex-col justify-between text-center ${
                    hasTrades && isGreen
                      ? 'bg-emerald-950/20 border-emerald-500/30'
                      : hasTrades && !isGreen
                      ? 'bg-rose-950/20 border-rose-500/30'
                      : 'bg-slate-900/40 border-slate-800'
                  }`}
                >
                  <span className="text-xs font-bold text-slate-300 uppercase">{day.dayName.slice(0, 3)}</span>
                  
                  <div className="my-2">
                    {hasTrades ? (
                      <span className={`text-xs sm:text-sm font-extrabold font-mono-numbers ${isGreen ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {formatCurrency(Math.round(day.netPnl), true, 0, displayCurrency)}
                      </span>
                    ) : (
                      <span className="text-slate-600 text-xs">—</span>
                    )}
                  </div>

                  <div className="text-[10px] text-slate-400">
                    {hasTrades ? `${day.tradeCount}T • ${day.winRate}%` : '0 trades'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Psychological Mistake Tracker */}
        <div className="bg-[#101522] rounded-2xl p-5 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h2 className="text-base font-bold text-white tracking-tight">Cost of Psychological Mistakes</h2>
            </div>
            {metrics.totalMistakeCost > 0 && (
              <span className="text-xs text-rose-400 font-mono-numbers font-bold">
                {formatCurrency(-metrics.totalMistakeCost, false, 2, displayCurrency)} Lost
              </span>
            )}
          </div>

          {mistakeAnalysis.length === 0 ? (
            <div className="text-center py-8">
              <ShieldAlert className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
              <p className="text-xs font-semibold text-slate-300">Clean discipline recorded</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Tag your emotional mistakes (FOMO, Revenge Trading, Chasing) when editing trades to calculate leak costs.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {mistakeAnalysis.map(item => (
                <div
                  key={item.mistake}
                  className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/20">
                      {item.mistake}
                    </span>
                    <span className="text-slate-400">
                      {item.occurrences} violation{item.occurrences > 1 ? 's' : ''}
                    </span>
                  </div>

                  <span className="font-mono-numbers font-bold text-rose-400">
                    {formatCurrency(-item.totalLoss, false, 2, displayCurrency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
