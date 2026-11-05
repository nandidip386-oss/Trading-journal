import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  TrendingUp,
  TrendingDown,
  X,
  ExternalLink,
  Plus
} from 'lucide-react';
import { Trade, DayStats, CurrencyCode } from '../types/trade';
import { aggregateDailyStats, formatCurrency } from '../utils/tradeMetrics';

interface CalendarViewProps {
  trades: Trade[];
  onOpenTradeDetail: (trade: Trade) => void;
  onAddTrade: () => void;
  displayCurrency?: CurrencyCode;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  trades,
  onOpenTradeDetail,
  onAddTrade,
  displayCurrency = 'USD'
}) => {
  // Calendar month state
  const [currentDate, setCurrentDate] = useState(() => new Date(2026, 9, 1)); // October 2026 by default matching demo data
  const [selectedDayStats, setSelectedDayStats] = useState<DayStats | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Aggregate daily stats across all trades
  const dailyStatsMap = aggregateDailyStats(trades);

  // Month navigation
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDayStats(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDayStats(null);
  };

  const handleCurrentMonth = () => {
    const today = new Date();
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDayStats(null);
  };

  // Build grid of days
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Monthly totals
  let monthNetPnl = 0;
  let monthTradeCount = 0;
  let monthWinningDays = 0;
  let monthLosingDays = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const stats = dailyStatsMap[dayStr];
    if (stats && stats.tradeCount > 0) {
      monthNetPnl += stats.netPnl;
      monthTradeCount += stats.tradeCount;
      if (stats.netPnl > 0) monthWinningDays++;
      else if (stats.netPnl < 0) monthLosingDays++;
    }
  }

  // Weeks grouping for week totals
  const calendarCells = [];
  // Empty padding cells for start of month
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarCells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(d);
  }

  // Split into weeks of 7 days
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < calendarCells.length; i += 7) {
    weeks.push(calendarCells.slice(i, i + 7));
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Calendar Header */}
      <div className="bg-[#101522] rounded-2xl p-5 border border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-emerald-400" />
              <h1 className="text-xl font-bold tracking-tight text-white">
                {monthNames[month]} {year}
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              MyFX Journal daily performance heatmap • Click any day for detailed execution review
            </p>
          </div>

          {/* Month Navigator & Summary Stats */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <span className="text-slate-400">Month P&L:</span>
              <span className={`font-mono-numbers font-bold ${monthNetPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatCurrency(monthNetPnl, true, 2, displayCurrency)}
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-300 font-medium">
                {monthWinningDays}G / {monthLosingDays}R
              </span>
            </div>

            <div className="flex items-center gap-1 bg-[#0c1017] p-1 rounded-lg border border-slate-800">
              <button
                onClick={handlePrevMonth}
                title="Previous Month"
                className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleCurrentMonth}
                className="px-2.5 py-1 text-xs font-semibold text-slate-300 hover:text-white rounded hover:bg-slate-800 transition-colors"
              >
                Today
              </button>
              <button
                onClick={handleNextMonth}
                title="Next Month"
                className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Calendar Grid */}
      <div className="bg-[#101522] rounded-2xl border border-slate-800 shadow-sm p-4 sm:p-6 overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-8 gap-2 mb-2 text-center text-xs font-bold uppercase tracking-wider text-slate-400">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
            <div className="text-slate-400">Week P&L</div>
          </div>

          {/* Week rows */}
          <div className="space-y-2">
            {weeks.map((week, wIndex) => {
              // Calculate weekly totals
              let weekPnl = 0;
              let weekTrades = 0;
              let weekWins = 0;

              week.forEach(day => {
                if (day) {
                  const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const stats = dailyStatsMap[dayStr];
                  if (stats) {
                    weekPnl += stats.netPnl;
                    weekTrades += stats.tradeCount;
                    weekWins += stats.wins;
                  }
                }
              });

              return (
                <div key={wIndex} className="grid grid-cols-8 gap-2">
                  {week.map((day, dIndex) => {
                    if (!day) {
                      return (
                        <div
                          key={`empty-${dIndex}`}
                          className="h-24 rounded-xl bg-slate-900/20 border border-slate-800/40 p-2 opacity-30"
                        />
                      );
                    }

                    const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const stats = dailyStatsMap[dayStr];
                    const hasTrades = stats && stats.tradeCount > 0;
                    const isWin = hasTrades && stats.netPnl > 0;
                    const isLoss = hasTrades && stats.netPnl < 0;
                    const isSelected = selectedDayStats?.date === dayStr;

                    return (
                      <div
                        key={day}
                        onClick={() => {
                          if (hasTrades) setSelectedDayStats(stats);
                        }}
                        className={`h-24 rounded-xl p-2.5 flex flex-col justify-between border transition-all cursor-pointer relative group ${
                          isSelected
                            ? 'ring-2 ring-emerald-400 shadow-lg'
                            : ''
                        } ${
                          isWin
                            ? 'bg-emerald-950/20 border-emerald-500/40 hover:border-emerald-400 hover:bg-emerald-950/30'
                            : isLoss
                            ? 'bg-rose-950/20 border-rose-500/40 hover:border-rose-400 hover:bg-rose-950/30'
                            : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        {/* Day number & indicator */}
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-mono-numbers font-semibold ${hasTrades ? 'text-white' : 'text-slate-400'}`}>
                            {day}
                          </span>
                          {hasTrades && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                              isWin ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                            }`}>
                              {stats.tradeCount}T
                            </span>
                          )}
                        </div>

                        {/* Daily Net P&L display */}
                        {hasTrades ? (
                          <div className="text-center my-auto">
                            <div className={`text-sm lg:text-base font-extrabold font-mono-numbers tracking-tight ${
                              isWin ? 'text-emerald-400' : 'text-rose-400'
                            }`}>
                              {formatCurrency(Math.round(stats.netPnl), true, 0, displayCurrency)}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {stats.wins}W • {stats.losses}L
                            </div>
                          </div>
                        ) : (
                          <div className="text-center my-auto text-slate-700 text-xs">
                            —
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* 8th column: Weekly Total Cell */}
                  <div className="h-24 rounded-xl p-2.5 flex flex-col justify-between bg-[#0e131e] border border-slate-800/80 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      W{wIndex + 1}
                    </span>
                    {weekTrades > 0 ? (
                      <div>
                        <div className={`text-xs lg:text-sm font-extrabold font-mono-numbers ${
                          weekPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {formatCurrency(Math.round(weekPnl), true, 0, displayCurrency)}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {weekTrades} trades • {((weekWins / weekTrades) * 100).toFixed(0)}%
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-600 text-xs my-auto">—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Day Inspection Modal/Drawer */}
      {selectedDayStats && (
        <div className="bg-[#101522] rounded-2xl border border-slate-800 p-5 shadow-xl relative animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <span className={`w-3 h-3 rounded-full ${selectedDayStats.netPnl >= 0 ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              <div>
                <h3 className="text-base font-bold text-white font-mono-numbers">
                  {selectedDayStats.date} Executions
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedDayStats.tradeCount} Total Trades • Net P&L:{' '}
                  <strong className={selectedDayStats.netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {formatCurrency(selectedDayStats.netPnl, true, 2, displayCurrency)}
                  </strong>
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedDayStats(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* List of trades for this day */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {selectedDayStats.trades.map(trade => {
              const isWin = trade.status === 'WIN';
              const isLoss = trade.status === 'LOSS';

              return (
                <div
                  key={trade.id}
                  onClick={() => onOpenTradeDetail(trade)}
                  className="bg-[#0c1017] p-3.5 rounded-xl border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white group-hover:text-emerald-400 transition-colors text-sm">
                        {trade.symbol}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        trade.side === 'LONG'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {trade.side}
                      </span>
                      <span className="text-[10px] text-slate-400">{trade.assetClass}</span>
                    </div>

                    <span className={`font-mono-numbers font-bold text-sm ${
                      isWin ? 'text-emerald-400' : isLoss ? 'text-rose-400' : 'text-slate-400'
                    }`}>
                      {formatCurrency(trade.netPnl, true, 2, displayCurrency)}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                    <span>
                      In: <strong className="text-slate-300 font-mono-numbers">{formatCurrency(trade.entryPrice, false, 2, displayCurrency)}</strong> →{' '}
                      Out: <strong className="text-slate-300 font-mono-numbers">{trade.exitPrice ? formatCurrency(trade.exitPrice, false, 2, displayCurrency) : '—'}</strong>
                    </span>
                    <span className="text-slate-400">{trade.setup || 'Playbook'}</span>
                  </div>

                  {trade.notes && (
                    <p className="mt-2 text-xs text-slate-400 line-clamp-2 bg-slate-900/60 p-2 rounded border border-slate-800/80">
                      "{trade.notes}"
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
