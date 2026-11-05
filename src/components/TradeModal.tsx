import React, { useState, useEffect } from 'react';
import {
  X,
  TrendingUp,
  TrendingDown,
  Save,
  Star,
  Sparkles,
  Link as LinkIcon,
  HelpCircle
} from 'lucide-react';
import { Trade, AssetClass, TradeSide, TradeStatus, TradingAccount, CurrencyCode } from '../types/trade';
import { formatCurrency, convertCurrency, DEFAULT_USD_INR_RATE } from '../utils/tradeMetrics';

interface TradeModalProps {
  isOpen: boolean;
  tradeToEdit: Trade | null;
  onClose: () => void;
  onSave: (trade: Trade) => Promise<void>;
  userId: string | null;
  accounts: TradingAccount[];
  defaultAccountId?: string;
  usdToInrRate?: number;
}

export const TradeModal: React.FC<TradeModalProps> = ({
  isOpen,
  tradeToEdit,
  onClose,
  onSave,
  userId,
  accounts,
  defaultAccountId,
  usdToInrRate = DEFAULT_USD_INR_RATE
}) => {
  const [accountId, setAccountId] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [symbol, setSymbol] = useState('');
  const [side, setSide] = useState<TradeSide>('LONG');
  const [assetClass, setAssetClass] = useState<AssetClass>('STOCKS');
  const [entryDate, setEntryDate] = useState('');
  const [exitDate, setExitDate] = useState('');
  const [entryPrice, setEntryPrice] = useState<number>(0);
  const [exitPrice, setExitPrice] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [fees, setFees] = useState<number>(1.5);
  const [stopLoss, setStopLoss] = useState<string>('');
  const [takeProfit, setTakeProfit] = useState<string>('');
  const [setup, setSetup] = useState('Breakout');
  const [mistakes, setMistakes] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [chartUrl, setChartUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Setup options
  const setupPresets = [
    'VWAP Bounce',
    'Breakout',
    'Breakdown',
    'Flag Pattern',
    'Liquidity Sweep',
    'Opening Drive',
    'Reversal',
    'Mean Reversion',
    'Gap & Go',
    'Support / Resistance'
  ];

  const mistakePresets = [
    'FOMO',
    'Chased Entry',
    'Moved Stop Loss',
    'Sized Too Big',
    'Early Exit',
    'Overtrading',
    'Faded Strong Trend',
    'Weak Relative Volume'
  ];

  // Populate fields on edit or initial add
  useEffect(() => {
    if (tradeToEdit) {
      setAccountId(tradeToEdit.accountId || (accounts[0]?.id || ''));
      setCurrency(tradeToEdit.currency || 'USD');
      setSymbol(tradeToEdit.symbol);
      setSide(tradeToEdit.side);
      setAssetClass(tradeToEdit.assetClass);
      setEntryDate(tradeToEdit.entryDate ? tradeToEdit.entryDate.slice(0, 16) : '');
      setExitDate(tradeToEdit.exitDate ? tradeToEdit.exitDate.slice(0, 16) : '');
      setEntryPrice(tradeToEdit.entryPrice);
      setExitPrice(tradeToEdit.exitPrice !== undefined ? String(tradeToEdit.exitPrice) : '');
      setQuantity(tradeToEdit.quantity);
      setFees(tradeToEdit.fees || 0);
      setStopLoss(tradeToEdit.stopLoss !== undefined ? String(tradeToEdit.stopLoss) : '');
      setTakeProfit(tradeToEdit.takeProfit !== undefined ? String(tradeToEdit.takeProfit) : '');
      setSetup(tradeToEdit.setup || 'Breakout');
      setMistakes(tradeToEdit.mistakes || '');
      setRating(tradeToEdit.rating || 5);
      setChartUrl(tradeToEdit.chartUrl || '');
      setNotes(tradeToEdit.notes || '');
    } else {
      // Default new trade
      const now = new Date();
      const isoNow = now.toISOString().slice(0, 16);
      const initialAccId = (defaultAccountId && defaultAccountId !== 'ALL') ? defaultAccountId : (accounts[0]?.id || '');
      const initialAcc = accounts.find(a => a.id === initialAccId);
      setAccountId(initialAccId);
      setCurrency(initialAcc?.currency === 'INR' ? 'INR' : 'USD');
      setSymbol('NVDA');
      setSide('LONG');
      setAssetClass('STOCKS');
      setEntryDate(isoNow);
      setExitDate('');
      setEntryPrice(130.00);
      setExitPrice('');
      setQuantity(100);
      setFees(1.50);
      setStopLoss('');
      setTakeProfit('');
      setSetup('VWAP Bounce');
      setMistakes('');
      setRating(5);
      setChartUrl('');
      setNotes('');
    }
    setErrorMsg('');
  }, [tradeToEdit, isOpen, defaultAccountId, accounts]);

  if (!isOpen) return null;

  const currSymbol = currency === 'INR' ? '₹' : '$';

  // Real-time calculation of Net P&L and ROI
  const parsedExitPrice = exitPrice !== '' ? parseFloat(exitPrice) : undefined;
  let calculatedNetPnl = 0;
  let calculatedGrossPnl = 0;
  let calculatedRoi = 0;
  let calculatedStatus: TradeStatus = 'OPEN';

  if (parsedExitPrice !== undefined && !isNaN(parsedExitPrice)) {
    if (side === 'LONG') {
      calculatedGrossPnl = (parsedExitPrice - entryPrice) * quantity;
    } else {
      calculatedGrossPnl = (entryPrice - parsedExitPrice) * quantity;
    }
    calculatedNetPnl = calculatedGrossPnl - (fees || 0);
    const invested = entryPrice * quantity;
    if (invested > 0) {
      calculatedRoi = (calculatedNetPnl / invested) * 100;
    }
    if (calculatedNetPnl > 0.01) calculatedStatus = 'WIN';
    else if (calculatedNetPnl < -0.01) calculatedStatus = 'LOSS';
    else calculatedStatus = 'BREAKEVEN';
  }

  const handleToggleMistakeTag = (tag: string) => {
    const list = mistakes.split(',').map(s => s.trim()).filter(Boolean);
    if (list.includes(tag)) {
      setMistakes(list.filter(t => t !== tag).join(', '));
    } else {
      list.push(tag);
      setMistakes(list.join(', '));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol.trim()) {
      setErrorMsg('Symbol is required.');
      return;
    }
    if (entryPrice <= 0 || quantity <= 0) {
      setErrorMsg('Entry price and quantity must be greater than 0.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const nowIso = new Date().toISOString();
      const selectedAcc = accounts.find(a => a.id === accountId);
      const finalTrade: Trade = {
        id: tradeToEdit ? tradeToEdit.id : `trade_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId: tradeToEdit ? tradeToEdit.userId : (userId || 'local_user'),
        accountId: accountId || undefined,
        accountName: selectedAcc ? selectedAcc.name : (tradeToEdit?.accountName || 'Main Account'),
        currency,
        symbol: symbol.toUpperCase().trim(),
        side,
        assetClass,
        entryDate: entryDate ? new Date(entryDate).toISOString() : nowIso,
        exitDate: exitDate ? new Date(exitDate).toISOString() : undefined,
        entryPrice: Number(entryPrice),
        exitPrice: parsedExitPrice,
        quantity: Number(quantity),
        netPnl: Number(calculatedNetPnl.toFixed(2)),
        grossPnl: Number(calculatedGrossPnl.toFixed(2)),
        fees: Number(fees),
        pnlPercent: Number(calculatedRoi.toFixed(2)),
        stopLoss: stopLoss !== '' ? parseFloat(stopLoss) : undefined,
        takeProfit: takeProfit !== '' ? parseFloat(takeProfit) : undefined,
        setup,
        status: calculatedStatus,
        mistakes: mistakes.trim(),
        rating,
        chartUrl: chartUrl.trim(),
        notes: notes.trim(),
        createdAt: tradeToEdit?.createdAt || nowIso,
        updatedAt: nowIso
      };

      await onSave(finalTrade);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save trade.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#101522] border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-[#0e131d]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {tradeToEdit ? 'Edit Journal Entry' : 'Log New Trade'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Row 0: Trading Account & Currency Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Trading Account *</label>
              <select
                value={accountId}
                onChange={e => {
                  const val = e.target.value;
                  setAccountId(val);
                  const acc = accounts.find(a => a.id === val);
                  if (acc?.currency === 'INR') {
                    setCurrency('INR');
                  } else if (acc?.currency === 'USD') {
                    setCurrency('USD');
                  }
                }}
                className="w-full bg-[#0c1017] border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-semibold text-emerald-400 focus:outline-none focus:border-emerald-500"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id} className="text-slate-200">
                    {acc.name} ({acc.accountType}) — {acc.currency}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Journal Currency</label>
              <div className="grid grid-cols-2 gap-1 p-1 bg-[#0c1017] border border-slate-700/80 rounded-xl">
                <button
                  type="button"
                  onClick={() => setCurrency('USD')}
                  className={`py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    currency === 'USD'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  $ USD
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency('INR')}
                  className={`py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    currency === 'INR'
                      ? 'bg-purple-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ₹ INR
                </button>
              </div>
            </div>
          </div>

          {/* Row 1: Symbol, Direction, Asset */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Symbol / Ticker *</label>
              <input
                type="text"
                required
                value={symbol}
                onChange={e => setSymbol(e.target.value.toUpperCase())}
                placeholder={currency === 'INR' ? 'e.g. RELIANCE, NIFTY' : 'e.g. NVDA, AAPL'}
                className="w-full bg-[#0c1017] border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-bold text-white uppercase focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Direction: Long / Short Toggle */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Direction</label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#0c1017] border border-slate-700/80 rounded-xl">
                <button
                  type="button"
                  onClick={() => setSide('LONG')}
                  className={`py-1 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                    side === 'LONG'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>LONG</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSide('SHORT')}
                  className={`py-1 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                    side === 'SHORT'
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <TrendingDown className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>SHORT</span>
                </button>
              </div>
            </div>

            {/* Asset Class */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Asset Class</label>
              <select
                value={assetClass}
                onChange={e => setAssetClass(e.target.value as AssetClass)}
                className="w-full bg-[#0c1017] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="STOCKS">Stocks / Equities</option>
                <option value="OPTIONS">Options</option>
                <option value="CRYPTO">Crypto</option>
                <option value="FOREX">Forex</option>
                <option value="FUTURES">Futures</option>
              </select>
            </div>
          </div>

          {/* Row 2: Entry Price, Exit Price, Quantity, Fees */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Entry Price ({currSymbol}) *
              </label>
              <input
                type="number"
                step="any"
                required
                value={entryPrice || ''}
                onChange={e => setEntryPrice(parseFloat(e.target.value) || 0)}
                placeholder="100.00"
                className="w-full bg-[#0c1017] border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono-numbers text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Exit Price ({currSymbol})
              </label>
              <input
                type="number"
                step="any"
                value={exitPrice}
                onChange={e => setExitPrice(e.target.value)}
                placeholder="Leave blank if open"
                className="w-full bg-[#0c1017] border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono-numbers text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Quantity / Size *</label>
              <input
                type="number"
                step="any"
                required
                value={quantity || ''}
                onChange={e => setQuantity(parseFloat(e.target.value) || 1)}
                placeholder="100"
                className="w-full bg-[#0c1017] border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono-numbers text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Fees ({currSymbol})
              </label>
              <input
                type="number"
                step="any"
                value={fees}
                onChange={e => setFees(parseFloat(e.target.value) || 0)}
                placeholder={currency === 'INR' ? '50.00' : '1.50'}
                className="w-full bg-[#0c1017] border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono-numbers text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Real-time Calculated P&L Summary Ribbon with Auto Currency Conversion */}
          {parsedExitPrice !== undefined && (
            <div className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono-numbers ${
              calculatedNetPnl >= 0
                ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
            }`}>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-sans font-semibold">Live Calculated P&L:</span>
                <span className="text-base font-extrabold">
                  {formatCurrency(calculatedNetPnl, true, 2, currency)}
                </span>
                <span className="text-xs font-medium">({calculatedRoi >= 0 ? '+' : ''}{calculatedRoi.toFixed(2)}%)</span>
                <span className="text-[11px] text-slate-400 font-sans ml-1">
                  (≈ {currency === 'INR'
                      ? formatCurrency(convertCurrency(calculatedNetPnl, 'INR', 'USD', usdToInrRate), true, 2, 'USD')
                      : formatCurrency(convertCurrency(calculatedNetPnl, 'USD', 'INR', usdToInrRate), true, 2, 'INR')
                    } at 1 USD = ₹{usdToInrRate.toFixed(2)})
                </span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold self-start sm:self-auto ${
                calculatedStatus === 'WIN' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
              }`}>
                {calculatedStatus}
              </span>
            </div>
          )}

          {/* Row 3: Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Entry Date & Time *</label>
              <input
                type="datetime-local"
                required
                value={entryDate}
                onChange={e => setEntryDate(e.target.value)}
                className="w-full bg-[#0c1017] border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono-numbers text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Exit Date & Time</label>
              <input
                type="datetime-local"
                value={exitDate}
                onChange={e => setExitDate(e.target.value)}
                className="w-full bg-[#0c1017] border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono-numbers text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Row 4: Stop Loss & Take Profit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Stop Loss ({currSymbol})
              </label>
              <input
                type="number"
                step="any"
                value={stopLoss}
                onChange={e => setStopLoss(e.target.value)}
                placeholder="e.g. 128.50"
                className="w-full bg-[#0c1017] border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono-numbers text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Take Profit Target ({currSymbol})
              </label>
              <input
                type="number"
                step="any"
                value={takeProfit}
                onChange={e => setTakeProfit(e.target.value)}
                placeholder="e.g. 135.00"
                className="w-full bg-[#0c1017] border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono-numbers text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Row 5: Playbook Setup */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Playbook Strategy / Setup</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {setupPresets.map(s => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setSetup(s)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    setup === s
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={setup}
              onChange={e => setSetup(e.target.value)}
              placeholder="Or type custom setup name..."
              className="w-full bg-[#0c1017] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Row 6: Mistakes / Emotional Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Psychology & Rule Adherence Tags</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {mistakePresets.map(tag => {
                const isActive = mistakes.split(',').map(s => s.trim()).includes(tag);
                return (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => handleToggleMistakeTag(tag)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              value={mistakes}
              onChange={e => setMistakes(e.target.value)}
              placeholder="Comma separated tags e.g. FOMO, Sized Too Big"
              className="w-full bg-[#0c1017] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Row 7: Discipline Rating & Chart URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Discipline Score</label>
              <div className="flex items-center gap-1.5 pt-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-1 text-slate-500 hover:text-amber-400 transition-colors"
                  >
                    <Star
                      className={`w-5 h-5 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}`}
                    />
                  </button>
                ))}
                <span className="text-xs text-slate-400 ml-2 font-mono-numbers">{rating} / 5</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Chart Screenshot URL</label>
              <div className="relative">
                <LinkIcon className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={chartUrl}
                  onChange={e => setChartUrl(e.target.value)}
                  placeholder="https://tradingview.com/x/... or image link"
                  className="w-full bg-[#0c1017] border border-slate-700/80 rounded-xl pl-8 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Row 8: Journal Notes & Post-trade Analysis */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Detailed Journal Thesis & Execution Learnings
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="What was your thesis? Market conditions? What went right and what could you improve next time?"
              className="w-full bg-[#0c1017] border border-slate-700/80 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4 stroke-[2.5]" />
              <span>{isSubmitting ? 'Saving...' : 'Save Trade'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
