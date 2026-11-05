import React from 'react';
import {
  X,
  TrendingUp,
  TrendingDown,
  Edit2,
  Trash2,
  ExternalLink,
  Star,
  Shield,
  Clock,
  Target,
  DollarSign,
  AlertTriangle,
  Award
} from 'lucide-react';
import { Trade, CurrencyCode } from '../types/trade';
import { formatCurrency, convertCurrency, DEFAULT_USD_INR_RATE } from '../utils/tradeMetrics';

interface TradeDetailModalProps {
  trade: Trade | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (trade: Trade) => void;
  onDelete: (tradeId: string) => void;
}

export const TradeDetailModal: React.FC<TradeDetailModalProps> = ({
  trade,
  isOpen,
  onClose,
  onEdit,
  onDelete
}) => {
  if (!isOpen || !trade) return null;

  const isWin = trade.status === 'WIN';
  const isLoss = trade.status === 'LOSS';
  const tradeCurr: CurrencyCode = trade.currency || 'USD';
  const altCurr: CurrencyCode = tradeCurr === 'INR' ? 'USD' : 'INR';
  const convertedPnl = convertCurrency(trade.netPnl, tradeCurr, altCurr);

  // Calculate R-Multiple if stop loss was defined
  let rMultiple: number | null = null;
  if (trade.stopLoss && trade.entryPrice) {
    const riskPerShare = Math.abs(trade.entryPrice - trade.stopLoss);
    if (riskPerShare > 0 && trade.exitPrice) {
      const rewardPerShare = trade.side === 'LONG'
        ? trade.exitPrice - trade.entryPrice
        : trade.entryPrice - trade.exitPrice;
      rMultiple = Number((rewardPerShare / riskPerShare).toFixed(2));
    }
  }

  // Calculate trade duration
  let durationStr = 'Intraday';
  if (trade.entryDate && trade.exitDate) {
    const start = new Date(trade.entryDate).getTime();
    const end = new Date(trade.exitDate).getTime();
    const diffMin = Math.round((end - start) / (1000 * 60));
    if (diffMin < 60) {
      durationStr = `${diffMin}m`;
    } else if (diffMin < 1440) {
      const hours = Math.floor(diffMin / 60);
      const mins = diffMin % 60;
      durationStr = `${hours}h ${mins}m`;
    } else {
      const days = Math.floor(diffMin / 1440);
      durationStr = `${days}d`;
    }
  }

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete this ${trade.symbol} trade?`)) {
      onDelete(trade.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#101522] border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-[#0e131d]">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${
              trade.side === 'LONG' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
            }`}>
              {trade.side === 'LONG' ? <TrendingUp className="w-5 h-5 stroke-[2.5]" /> : <TrendingDown className="w-5 h-5 stroke-[2.5]" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-white tracking-tight">{trade.symbol}</h2>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  trade.side === 'LONG'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  {trade.side}
                </span>
                <span className="text-xs text-slate-400">{trade.assetClass}</span>
                {trade.currency === 'INR' ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    ₹ INR
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                    $ USD
                  </span>
                )}
                {trade.accountName && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-sky-400 border border-sky-500/20">
                    {trade.accountName}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono-numbers mt-0.5">
                {trade.entryDate.replace('T', ' ')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                onEdit(trade);
                onClose();
              }}
              title="Edit Trade"
              className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              title="Delete Trade"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Main Profit / Outcome Hero Banner */}
          <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isWin
              ? 'bg-emerald-950/20 border-emerald-500/30'
              : isLoss
              ? 'bg-rose-950/20 border-rose-500/30'
              : 'bg-slate-900 border-slate-800'
          }`}>
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 block mb-1">
                Realized Net Return
              </span>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className={`text-2xl sm:text-3xl font-extrabold font-mono-numbers ${
                  isWin ? 'text-emerald-400' : isLoss ? 'text-rose-400' : 'text-slate-300'
                }`}>
                  {formatCurrency(trade.netPnl, true, 2, tradeCurr)}
                </span>
                <span className="text-xs text-slate-400 font-sans font-medium">
                  (≈ {formatCurrency(convertedPnl, true, 2, altCurr)} at ₹86.50)
                </span>
                {trade.pnlPercent !== undefined && (
                  <span className={`text-sm font-bold font-mono-numbers ${
                    trade.pnlPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    ({trade.pnlPercent >= 0 ? '+' : ''}{trade.pnlPercent.toFixed(2)}%)
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                isWin
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : isLoss
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'bg-slate-800 text-slate-300'
              }`}>
                {trade.status}
              </span>

              {rMultiple !== null && (
                <span className={`px-2.5 py-1 rounded-lg text-xs font-mono-numbers font-bold border ${
                  rMultiple >= 1
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}>
                  {rMultiple > 0 ? `+${rMultiple}R` : `${rMultiple}R`}
                </span>
              )}
            </div>
          </div>

          {/* Execution Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#0c1017] p-3 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">Entry Price</span>
              <span className="text-sm font-bold text-white font-mono-numbers">
                {formatCurrency(trade.entryPrice, false, 2, tradeCurr)}
              </span>
            </div>

            <div className="bg-[#0c1017] p-3 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">Exit Price</span>
              <span className="text-sm font-bold text-white font-mono-numbers">
                {trade.exitPrice !== undefined ? formatCurrency(trade.exitPrice, false, 2, tradeCurr) : 'Open Position'}
              </span>
            </div>

            <div className="bg-[#0c1017] p-3 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">Quantity / Size</span>
              <span className="text-sm font-bold text-slate-200 font-mono-numbers">
                {trade.quantity}
              </span>
            </div>

            <div className="bg-[#0c1017] p-3 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">Trade Duration</span>
              <span className="text-sm font-bold text-slate-200 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{durationStr}</span>
              </span>
            </div>
          </div>

          {/* Risk Management Details */}
          <div className="bg-[#0c1017] p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
              <Target className="w-4 h-4 text-emerald-400" />
              <span>Risk Management Targets</span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs pt-1">
              <div>
                <span className="text-slate-400 block text-[11px]">Stop Loss</span>
                <span className="font-mono-numbers font-semibold text-rose-400">
                  {trade.stopLoss ? formatCurrency(trade.stopLoss, false, 2, tradeCurr) : 'Not set'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Take Profit Target</span>
                <span className="font-mono-numbers font-semibold text-emerald-400">
                  {trade.takeProfit ? formatCurrency(trade.takeProfit, false, 2, tradeCurr) : 'Not set'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Fees & Comm</span>
                <span className="font-mono-numbers font-semibold text-slate-300">
                  {formatCurrency(trade.fees || 0, false, 2, tradeCurr)}
                </span>
              </div>
            </div>
          </div>

          {/* Strategy, Tags & Discipline Rating */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-[#0c1017] p-3.5 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">Playbook Strategy</span>
              <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-emerald-400" />
                <span>{trade.setup || 'Standard Execution'}</span>
              </span>
            </div>

            <div className="bg-[#0c1017] p-3.5 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">Discipline Score</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star
                    key={star}
                    className={`w-3.5 h-3.5 ${
                      star <= (trade.rating || 5)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-700'
                    }`}
                  />
                ))}
                <span className="text-xs font-mono-numbers text-slate-300 ml-1.5 font-bold">
                  {trade.rating || 5}/5
                </span>
              </div>
            </div>
          </div>

          {/* Psychological Mistakes / Tags */}
          {trade.mistakes && trade.mistakes.trim().length > 0 && (
            <div className="bg-[#0c1017] p-3.5 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Rule Violations & Emotional Triggers</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {trade.mistakes.split(',').map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded text-xs font-medium bg-rose-500/10 text-rose-300 border border-rose-500/20"
                  >
                    {tag.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Journal Notes & Thesis */}
          <div className="bg-[#0c1017] p-4 rounded-xl border border-slate-800 space-y-1.5">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider text-[11px]">
              Journal Notes & Thesis
            </span>
            <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
              {trade.notes || 'No detailed notes entered for this trade.'}
            </p>
          </div>

          {/* Chart Screenshot Preview */}
          {trade.chartUrl && (
            <div className="bg-[#0c1017] p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300">Execution Chart Screenshot</span>
                <a
                  href={trade.chartUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <span>Open Full Size</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="rounded-lg overflow-hidden border border-slate-800 bg-slate-900 max-h-72 flex items-center justify-center">
                <img
                  src={trade.chartUrl}
                  alt={`${trade.symbol} chart`}
                  className="w-full object-cover rounded-lg"
                  onError={e => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
