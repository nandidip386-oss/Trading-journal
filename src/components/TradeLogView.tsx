import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  Trash2,
  Eye,
  Edit2,
  CheckSquare,
  Square,
  Sparkles,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { Trade, AssetClass, TradeSide, TradeStatus, TradingAccount, CurrencyCode } from '../types/trade';
import { formatCurrency } from '../utils/tradeMetrics';

interface TradeLogViewProps {
  trades: Trade[];
  onOpenTradeDetail: (trade: Trade) => void;
  onEditTrade: (trade: Trade) => void;
  onDeleteTrade: (tradeId: string) => void;
  onAddTrade: () => void;
  onLoadDemoTrades: () => void;
  accounts?: TradingAccount[];
  selectedAccountId?: string;
  onSelectAccountId?: (id: string) => void;
  displayCurrency?: CurrencyCode;
}

export const TradeLogView: React.FC<TradeLogViewProps> = ({
  trades,
  onOpenTradeDetail,
  onEditTrade,
  onDeleteTrade,
  onAddTrade,
  onLoadDemoTrades,
  accounts = [],
  selectedAccountId = 'ALL',
  onSelectAccountId,
  displayCurrency = 'USD'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<string>('ALL');
  const [selectedSide, setSelectedSide] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'date' | 'pnl' | 'roi' | 'symbol'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filter trades
  const filteredTrades = useMemo(() => {
    return trades.filter(trade => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesSymbol = trade.symbol.toLowerCase().includes(query);
        const matchesSetup = trade.setup?.toLowerCase().includes(query);
        const matchesNotes = trade.notes?.toLowerCase().includes(query);
        const matchesMistakes = trade.mistakes?.toLowerCase().includes(query);
        if (!matchesSymbol && !matchesSetup && !matchesNotes && !matchesMistakes) {
          return false;
        }
      }

      // Asset
      if (selectedAsset !== 'ALL' && trade.assetClass !== selectedAsset) return false;

      // Side
      if (selectedSide !== 'ALL' && trade.side !== selectedSide) return false;

      // Status
      if (selectedStatus !== 'ALL' && trade.status !== selectedStatus) return false;

      return true;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') {
        comparison = new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime();
      } else if (sortBy === 'pnl') {
        comparison = a.netPnl - b.netPnl;
      } else if (sortBy === 'roi') {
        comparison = (a.pnlPercent || 0) - (b.pnlPercent || 0);
      } else if (sortBy === 'symbol') {
        comparison = a.symbol.localeCompare(b.symbol);
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }, [trades, searchQuery, selectedAsset, selectedSide, selectedStatus, sortBy, sortOrder]);

  // Aggregate stats for current filtered set
  const filteredNetPnl = filteredTrades.reduce((acc, t) => acc + t.netPnl, 0);
  const filteredWins = filteredTrades.filter(t => t.status === 'WIN').length;
  const filteredWinRate = filteredTrades.length > 0 ? (filteredWins / filteredTrades.length) * 100 : 0;

  // Toggle selection
  const handleToggleSelectAll = () => {
    if (selectedIds.size === filteredTrades.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTrades.map(t => t.id)));
    }
  };

  const handleToggleSelectOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = new Set(selectedIds);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setSelectedIds(updated);
  };

  // Delete selected
  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedIds.size} selected trade(s)?`)) {
      selectedIds.forEach(id => onDeleteTrade(id));
      setSelectedIds(new Set());
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Header and Filter Controls */}
      <div className="bg-[#101522] rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">Trade Log & Journal</h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono-numbers">
                {filteredTrades.length} of {trades.length}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Comprehensive list of all executions, risk management, and journal reviews
            </p>
          </div>

          <div className="flex items-center gap-2">
            {trades.length === 0 && (
              <button
                onClick={onLoadDemoTrades}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold hover:bg-emerald-500/20 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Load Demo Trades</span>
              </button>
            )}
            <button
              onClick={onAddTrade}
              className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Trade</span>
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 pt-2 border-t border-slate-800/80">
          {/* Search Input */}
          <div className="sm:col-span-2 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search symbol, setup, notes, mistake..."
              className="w-full bg-[#0c1017] border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/80"
            />
          </div>

          {/* Asset filter */}
          <div>
            <select
              value={selectedAsset}
              onChange={e => setSelectedAsset(e.target.value)}
              className="w-full bg-[#0c1017] border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/80"
            >
              <option value="ALL">All Assets</option>
              <option value="STOCKS">Stocks</option>
              <option value="OPTIONS">Options</option>
              <option value="CRYPTO">Crypto</option>
              <option value="FOREX">Forex</option>
              <option value="FUTURES">Futures</option>
            </select>
          </div>

          {/* Side filter */}
          <div>
            <select
              value={selectedSide}
              onChange={e => setSelectedSide(e.target.value)}
              className="w-full bg-[#0c1017] border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/80"
            >
              <option value="ALL">All Sides</option>
              <option value="LONG">Long Only</option>
              <option value="SHORT">Short Only</option>
            </select>
          </div>

          {/* Status filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full bg-[#0c1017] border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/80"
            >
              <option value="ALL">All Outcomes</option>
              <option value="WIN">Winning Trades</option>
              <option value="LOSS">Losing Trades</option>
              <option value="BREAKEVEN">Breakeven</option>
              <option value="OPEN">Open Positions</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="w-full bg-[#0c1017] border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/80"
            >
              <option value="date">Date</option>
              <option value="pnl">Net P&L</option>
              <option value="roi">ROI %</option>
              <option value="symbol">Symbol</option>
            </select>
            <button
              onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
              title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Filtered Subset Quick Summary & Batch Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span>
              Net P&L:{' '}
              <strong className={`font-mono-numbers font-bold ${filteredNetPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatCurrency(filteredNetPnl, true, 2, displayCurrency)}
              </strong>
            </span>
            <span>
              Win Rate:{' '}
              <strong className="text-white font-mono-numbers font-semibold">
                {filteredWinRate.toFixed(1)}%
              </strong>
            </span>
          </div>

          {/* Batch operations toolbar */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1 rounded-lg border border-slate-700 text-xs">
              <span className="text-slate-200 font-semibold font-mono-numbers">
                {selectedIds.size} selected
              </span>
              <button
                onClick={handleDeleteSelected}
                className="flex items-center gap-1 text-rose-400 hover:text-rose-300 px-2 py-0.5 rounded hover:bg-rose-500/10 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete Selected</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Trade Log Table */}
      <div className="bg-[#101522] rounded-2xl border border-slate-800 shadow-sm overflow-hidden">
        {filteredTrades.length === 0 ? (
          <div className="text-center py-12 px-4">
            <p className="text-sm font-semibold text-slate-300">No trades match your search or filter</p>
            <p className="text-xs text-slate-400 mt-1">Try resetting the filters or add a new trade entry.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#0e131d] border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3 w-8">
                    <button
                      onClick={handleToggleSelectAll}
                      className="cursor-pointer text-slate-400 hover:text-white"
                    >
                      {selectedIds.size === filteredTrades.length && filteredTrades.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Symbol</th>
                  <th className="py-3 px-3">Side</th>
                  <th className="py-3 px-3">Asset</th>
                  <th className="py-3 px-3">Entry</th>
                  <th className="py-3 px-3">Exit</th>
                  <th className="py-3 px-3">Qty</th>
                  <th className="py-3 px-3">Net P&L</th>
                  <th className="py-3 px-3">ROI %</th>
                  <th className="py-3 px-3">Playbook / Setup</th>
                  <th className="py-3 px-3">Mistakes / Tags</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredTrades.map(trade => {
                  const isSelected = selectedIds.has(trade.id);
                  const isWin = trade.status === 'WIN';
                  const isLoss = trade.status === 'LOSS';

                  return (
                    <tr
                      key={trade.id}
                      onClick={() => onOpenTradeDetail(trade)}
                      className={`hover:bg-slate-800/40 transition-colors cursor-pointer group ${
                        isSelected ? 'bg-slate-800/30' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3" onClick={e => handleToggleSelectOne(trade.id, e)}>
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3 px-3 font-mono-numbers text-slate-300 whitespace-nowrap">
                        {trade.entryDate.split('T')[0]}
                      </td>

                      {/* Symbol & Account */}
                      <td className="py-3 px-3">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-white group-hover:text-emerald-400 transition-colors text-xs">
                              {trade.symbol}
                            </span>
                            {trade.currency === 'INR' ? (
                              <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                ₹ INR
                              </span>
                            ) : (
                              <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                                $ USD
                              </span>
                            )}
                          </div>
                          {trade.accountName && (
                            <span className="text-[10px] text-slate-400 font-medium truncate max-w-[120px]">
                              {trade.accountName}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Side */}
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          trade.side === 'LONG'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {trade.side}
                        </span>
                      </td>

                      {/* Asset */}
                      <td className="py-3 px-3 text-slate-400 text-[11px]">
                        {trade.assetClass}
                      </td>

                      {/* Entry Price */}
                      <td className="py-3 px-3 font-mono-numbers text-slate-300">
                        {formatCurrency(trade.entryPrice, false, 2, displayCurrency)}
                      </td>

                      {/* Exit Price */}
                      <td className="py-3 px-3 font-mono-numbers text-slate-300">
                        {trade.exitPrice !== undefined ? formatCurrency(trade.exitPrice, false, 2, displayCurrency) : '—'}
                      </td>

                      {/* Quantity */}
                      <td className="py-3 px-3 font-mono-numbers text-slate-400">
                        {trade.quantity}
                      </td>

                      {/* Net P&L */}
                      <td className="py-3 px-3 font-bold font-mono-numbers whitespace-nowrap">
                        <span className={isWin ? 'text-emerald-400' : isLoss ? 'text-rose-400' : 'text-slate-400'}>
                          {formatCurrency(trade.netPnl, true, 2, displayCurrency)}
                        </span>
                      </td>

                      {/* ROI % */}
                      <td className="py-3 px-3 font-mono-numbers font-medium whitespace-nowrap">
                        {trade.pnlPercent !== undefined ? (
                          <span className={trade.pnlPercent > 0 ? 'text-emerald-400' : trade.pnlPercent < 0 ? 'text-rose-400' : 'text-slate-400'}>
                            {trade.pnlPercent > 0 ? '+' : ''}{trade.pnlPercent.toFixed(2)}%
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* Setup */}
                      <td className="py-3 px-3 text-slate-300 whitespace-nowrap">
                        {trade.setup || '—'}
                      </td>

                      {/* Mistakes / Psychology Tags */}
                      <td className="py-3 px-3">
                        {trade.mistakes ? (
                          <div className="flex flex-wrap gap-1 max-w-[150px]">
                            {trade.mistakes.split(',').map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-rose-500/10 text-rose-300 border border-rose-500/20"
                              >
                                {tag.trim()}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isWin
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : isLoss
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-slate-700 text-slate-300'
                        }`}>
                          {trade.status}
                        </span>
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-3 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onOpenTradeDetail(trade)}
                            title="View Journal Review"
                            className="p-1 rounded text-slate-400 hover:text-emerald-400 hover:bg-slate-700/60 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onEditTrade(trade)}
                            title="Edit Trade"
                            className="p-1 rounded text-slate-400 hover:text-sky-400 hover:bg-slate-700/60 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteTrade(trade.id)}
                            title="Delete Trade"
                            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
