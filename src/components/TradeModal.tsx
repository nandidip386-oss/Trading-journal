import React, { useState, useEffect } from 'react';
import {
  X,
  TrendingUp,
  TrendingDown,
  Save,
  Star,
  Sparkles,
  Link as LinkIcon,
  HelpCircle,
  Plus
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
  const [manualPnl, setManualPnl] = useState<string>('0.00');
  const [tradeStatus, setTradeStatus] = useState<TradeStatus>('WIN');
  const [stopLoss, setStopLoss] = useState<string>('');
  const [takeProfit, setTakeProfit] = useState<string>('');
  const [setup, setSetup] = useState('');
  const [mistakes, setMistakes] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [chartUrl, setChartUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Custom Strategy Shortcuts state (persisted in localStorage)
  const [customStrategies, setCustomStrategies] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('myfx_custom_strategies');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [newStrategyInput, setNewStrategyInput] = useState('');
  const [isAddingStrategy, setIsAddingStrategy] = useState(false);

  const saveStrategies = (list: string[]) => {
    setCustomStrategies(list);
    try {
      localStorage.setItem('myfx_custom_strategies', JSON.stringify(list));
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddStrategy = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newStrategyInput.trim();
    if (!trimmed) return;
    if (!customStrategies.includes(trimmed)) {
      const updated = [...customStrategies, trimmed];
      saveStrategies(updated);
    }
    setSetup(trimmed);
    setNewStrategyInput('');
    setIsAddingStrategy(false);
  };

  const handleRemoveStrategy = (strategyToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customStrategies.filter(s => s !== strategyToRemove);
    saveStrategies(updated);
  };

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
      setManualPnl(tradeToEdit.netPnl !== undefined ? String(tradeToEdit.netPnl) : '0.00');
      setTradeStatus(tradeToEdit.status || 'WIN');
      setStopLoss(tradeToEdit.stopLoss !== undefined ? String(tradeToEdit.stopLoss) : '');
      setTakeProfit(tradeToEdit.takeProfit !== undefined ? String(tradeToEdit.takeProfit) : '');
      setSetup(tradeToEdit.setup || '');
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
      setManualPnl('150.00');
      setTradeStatus('WIN');
      setStopLoss('');
      setTakeProfit('');
      setSetup(customStrategies[0] || '');
      setMistakes('');
      setRating(5);
      setChartUrl('');
      setNotes('');
    }
    setErrorMsg('');
  }, [tradeToEdit, isOpen, defaultAccountId, accounts]);

  if (!isOpen) return null;

  const currSymbol = currency === 'INR' ? '₹' : '$';

  // Real-time calculation helper
  const parsedExitPrice = exitPrice !== '' ? parseFloat(exitPrice) : undefined;
  const parsedManualPnl = manualPnl !== '' ? parseFloat(manualPnl) : 0;
  const finalNetPnl = isNaN(parsedManualPnl) ? 0 : parsedManualPnl;
  const invested = entryPrice * quantity;
  const calculatedRoi = invested > 0 ? (finalNetPnl / invested) * 100 : 0;

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
      const parsedNetPnlNum = parseFloat(manualPnl);
      const finalPnlVal = isNaN(parsedNetPnlNum) ? 0 : parsedNetPnlNum;
      const parsedFees = Number(fees) || 0;
      const totalInvested = Number(entryPrice) * Number(quantity);
      const roiVal = totalInvested > 0 ? Number(((finalPnlVal / totalInvested) * 100).toFixed(2)) : 0;

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
        netPnl: Number(finalPnlVal.toFixed(2)),
        grossPnl: Number((finalPnlVal + parsedFees).toFixed(2)),
        fees: parsedFees,
        pnlPercent: roiVal,
        stopLoss: stopLoss !== '' ? parseFloat(stopLoss) : undefined,
        takeProfit: takeProfit !== '' ? parseFloat(takeProfit) : undefined,
        setup,
        status: tradeStatus,
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

          {/* Manual Net P&L & Trade Outcome Section */}
          <div className="p-3.5 rounded-xl bg-[#0c1017] border border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Manual Net Profit / Loss ({currSymbol}) *</span>
                </label>
                <p className="text-[11px] text-slate-400">
                  Type your exact trade P&L directly from your broker statement.
                </p>
              </div>

              {/* Optional Auto-estimate helper button */}
              {parsedExitPrice !== undefined && (
                <button
                  type="button"
                  onClick={() => {
                    const ep = parsedExitPrice || 0;
                    const estGross = side === 'LONG' ? (ep - entryPrice) * quantity : (entryPrice - ep) * quantity;
                    const estNet = estGross - (fees || 0);
                    setManualPnl(estNet.toFixed(2));
                    if (estNet > 0) setTradeStatus('WIN');
                    else if (estNet < 0) setTradeStatus('LOSS');
                    else setTradeStatus('BREAKEVEN');
                  }}
                  className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 rounded-lg border border-emerald-500/20 transition-all cursor-pointer"
                >
                  ⚡ Auto-Fill from Prices
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              {/* Direct P&L Input */}
              <div className="relative flex items-center">
                <span className={`absolute left-3 text-sm font-extrabold font-mono ${
                  finalNetPnl > 0 ? 'text-emerald-400' : finalNetPnl < 0 ? 'text-rose-400' : 'text-slate-400'
                }`}>
                  {currSymbol}
                </span>
                <input
                  type="number"
                  step="any"
                  required
                  value={manualPnl}
                  onChange={e => {
                    const valStr = e.target.value;
                    setManualPnl(valStr);
                    const num = parseFloat(valStr);
                    if (!isNaN(num)) {
                      if (num > 0) setTradeStatus('WIN');
                      else if (num < 0) setTradeStatus('LOSS');
                      else setTradeStatus('BREAKEVEN');
                    }
                  }}
                  placeholder="e.g. 250.00 or -120.00"
                  className="w-full bg-[#131824] border border-slate-700/80 focus:border-emerald-500 rounded-xl pl-8 pr-3 py-2 text-sm font-bold font-mono-numbers text-white outline-none"
                />
              </div>

              {/* Trade Outcome Status Selector */}
              <div className="flex items-center gap-1 bg-[#131824] p-1 rounded-xl border border-slate-700/80">
                {(['WIN', 'LOSS', 'BREAKEVEN', 'OPEN'] as TradeStatus[]).map(st => {
                  const isActive = tradeStatus === st;
                  let colorCls = 'text-slate-400 hover:text-slate-200';
                  if (isActive) {
                    if (st === 'WIN') colorCls = 'bg-emerald-500 text-slate-950 font-extrabold shadow-sm';
                    if (st === 'LOSS') colorCls = 'bg-rose-500 text-white font-extrabold shadow-sm';
                    if (st === 'BREAKEVEN') colorCls = 'bg-slate-700 text-slate-100 font-extrabold shadow-sm';
                    if (st === 'OPEN') colorCls = 'bg-amber-500 text-slate-950 font-extrabold shadow-sm';
                  }
                  return (
                    <button
                      type="button"
                      key={st}
                      onClick={() => {
                        setTradeStatus(st);
                        const num = parseFloat(manualPnl) || 0;
                        if (st === 'WIN' && num <= 0) setManualPnl(Math.abs(num || 100).toFixed(2));
                        if (st === 'LOSS' && num >= 0) setManualPnl((-Math.abs(num || 100)).toFixed(2));
                        if (st === 'BREAKEVEN') setManualPnl('0.00');
                        if (st === 'OPEN') setManualPnl('0.00');
                      }}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer text-center ${colorCls}`}
                    >
                      {st}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Real-Time Preview Banner */}
            {manualPnl !== '' && (
              <div className="flex items-center justify-between text-xs font-mono-numbers text-slate-300 pt-1 border-t border-slate-800/80 flex-wrap gap-1">
                <span>
                  Net P&L: <strong className={finalNetPnl >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {formatCurrency(finalNetPnl, true, 2, currency)}
                  </strong>
                  {invested > 0 && (
                    <span className="text-slate-400 text-[11px] font-normal ml-1">
                      ({calculatedRoi >= 0 ? '+' : ''}{calculatedRoi.toFixed(2)}%)
                    </span>
                  )}
                </span>
                <span className="text-[11px] text-slate-400 font-sans">
                  (≈ {currency === 'INR'
                      ? formatCurrency(convertCurrency(finalNetPnl, 'INR', 'USD', usdToInrRate), true, 2, 'USD')
                      : formatCurrency(convertCurrency(finalNetPnl, 'USD', 'INR', usdToInrRate), true, 2, 'INR')
                    } at 1 USD = ₹{usdToInrRate.toFixed(2)})
                </span>
              </div>
            )}
          </div>

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

          {/* Row 5: Playbook Setup / Custom Strategy Shortcuts */}
          <div>
            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
              <label className="block text-xs font-semibold text-slate-300">
                Playbook Strategy / Setup
              </label>
              {!isAddingStrategy && (
                <button
                  type="button"
                  onClick={() => setIsAddingStrategy(true)}
                  className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-0.5 rounded-lg border border-emerald-500/20 transition-all cursor-pointer"
                >
                  <Plus className="w-3 h-3 stroke-[3]" />
                  <span>+ Add Custom Strategy Shortcut</span>
                </button>
              )}
            </div>

            {/* Inline Add Custom Strategy Input */}
            {isAddingStrategy && (
              <div className="mb-2.5 p-2.5 bg-[#0c1017] border border-emerald-500/30 rounded-xl flex items-center gap-2">
                <input
                  type="text"
                  autoFocus
                  value={newStrategyInput}
                  onChange={e => setNewStrategyInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddStrategy();
                    } else if (e.key === 'Escape') {
                      setIsAddingStrategy(false);
                    }
                  }}
                  placeholder="e.g. ICT Silver Bullet, ORB 5M, 9EMA Scalp..."
                  className="flex-1 bg-[#131824] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleAddStrategy}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer shrink-0"
                >
                  Save Shortcut
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingStrategy(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 transition-colors shrink-0 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Custom Strategy Shortcut Chips */}
            {customStrategies.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {customStrategies.map(s => {
                  const isSelected = setup === s;
                  return (
                    <div
                      key={s}
                      onClick={() => setSetup(s)}
                      className={`group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <span>{s}</span>
                      <button
                        type="button"
                        onClick={e => handleRemoveStrategy(s, e)}
                        title="Delete shortcut"
                        className="opacity-60 group-hover:opacity-100 hover:text-rose-400 p-0.5 rounded transition-all cursor-pointer"
                      >
                        <X className="w-3 h-3 stroke-[2.5]" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 mb-2 italic">
                No custom strategy shortcuts saved yet. Click "+ Add Custom Strategy Shortcut" above to add your setups.
              </p>
            )}

            <input
              type="text"
              value={setup}
              onChange={e => setSetup(e.target.value)}
              placeholder="Or type custom strategy name..."
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
