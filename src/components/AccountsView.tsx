import React, { useState } from 'react';
import {
  Wallet,
  Plus,
  TrendingUp,
  TrendingDown,
  Building2,
  Edit2,
  Trash2,
  Target,
  ShieldCheck,
  Check,
  X,
  Layers,
  ArrowRight
} from 'lucide-react';
import { TradingAccount, Trade, AccountType } from '../types/trade';
import { calculateAccountPerformance, formatCurrency } from '../utils/tradeMetrics';

interface AccountsViewProps {
  accounts: TradingAccount[];
  trades: Trade[];
  selectedAccountId: string; // 'ALL' or specific account id
  onSelectAccount: (accountId: string) => void;
  onSaveAccount: (account: TradingAccount) => Promise<void>;
  onDeleteAccount: (accountId: string) => Promise<void>;
  onNavigateToDashboard: () => void;
}

export const AccountsView: React.FC<AccountsViewProps> = ({
  accounts,
  trades,
  selectedAccountId,
  onSelectAccount,
  onSaveAccount,
  onDeleteAccount,
  onNavigateToDashboard
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<TradingAccount | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [broker, setBroker] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('PROP_FIRM');
  const [startingBalance, setStartingBalance] = useState<number>(50000);
  const [currency, setCurrency] = useState('USD');
  const [color, setColor] = useState('#10b981');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compute performance for each account
  const accountPerfs = calculateAccountPerformance(accounts, trades);

  // Aggregated totals across all accounts
  const totalStartingCapital = accounts.reduce((acc, a) => acc + a.startingBalance, 0);
  const totalNetPnl = trades.filter(t => t.status !== 'OPEN').reduce((acc, t) => acc + t.netPnl, 0);
  const totalCurrentCapital = totalStartingCapital + totalNetPnl;
  const overallReturn = totalStartingCapital > 0 ? (totalNetPnl / totalStartingCapital) * 100 : 0;

  const colorPresets = [
    { label: 'Emerald', hex: '#10b981' },
    { label: 'Sky', hex: '#0ea5e9' },
    { label: 'Amber', hex: '#f59e0b' },
    { label: 'Purple', hex: '#a855f7' },
    { label: 'Rose', hex: '#f43f5e' }
  ];

  const handleOpenAddModal = () => {
    setEditingAccount(null);
    setName('');
    setBroker('');
    setAccountType('PROP_FIRM');
    setStartingBalance(50000);
    setCurrency('USD');
    setColor('#10b981');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (acc: TradingAccount, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAccount(acc);
    setName(acc.name);
    setBroker(acc.broker || '');
    setAccountType(acc.accountType);
    setStartingBalance(acc.startingBalance);
    setCurrency(acc.currency || 'USD');
    setColor(acc.color || '#10b981');
    setNotes(acc.notes || '');
    setIsModalOpen(true);
  };

  const handleDelete = async (accId: string, accName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete account "${accName}"? Trades will remain in your journal.`)) {
      await onDeleteAccount(accId);
      if (selectedAccountId === accId) {
        onSelectAccount('ALL');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const nowIso = new Date().toISOString();
      const updated: TradingAccount = {
        id: editingAccount ? editingAccount.id : `acc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId: editingAccount?.userId || 'local_user',
        name: name.trim(),
        broker: broker.trim(),
        accountType,
        startingBalance: Number(startingBalance),
        currency: currency.trim() || 'USD',
        color,
        notes: notes.trim(),
        createdAt: editingAccount?.createdAt || nowIso,
        updatedAt: nowIso
      };

      await onSaveAccount(updated);
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-[#101522] rounded-2xl p-5 border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-400" />
            <h1 className="text-xl font-bold tracking-tight text-white">Trading Accounts & Portfolios</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Journal and track multiple prop firm and brokerage accounts separately or aggregated together
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer whitespace-nowrap self-start md:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add New Account</span>
        </button>
      </div>

      {/* Aggregated Portfolio Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-[#101522] rounded-xl p-4 border border-slate-800/90 shadow-sm">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400 block mb-1">
            Total Combined Capital
          </span>
          <div className="text-2xl font-extrabold text-white font-mono-numbers">
            {formatCurrency(totalCurrentCapital, false, 0)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Across {accounts.length} active account{accounts.length > 1 ? 's' : ''}
          </span>
        </div>

        <div className="bg-[#101522] rounded-xl p-4 border border-slate-800/90 shadow-sm">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400 block mb-1">
            Aggregated Net P&L
          </span>
          <div className={`text-2xl font-extrabold font-mono-numbers ${totalNetPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(totalNetPnl)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Return: <strong className={overallReturn >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
              {overallReturn >= 0 ? '+' : ''}{overallReturn.toFixed(2)}%
            </strong>
          </span>
        </div>

        <div className="bg-[#101522] rounded-xl p-4 border border-slate-800/90 shadow-sm">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400 block mb-1">
            Total Executed Trades
          </span>
          <div className="text-2xl font-extrabold text-slate-100 font-mono-numbers">
            {trades.length}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Multi-broker journal entries
          </span>
        </div>

        <div className="bg-[#101522] rounded-xl p-4 border border-slate-800/90 shadow-sm">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400 block mb-1">
            Active Scope
          </span>
          <div className="text-sm font-bold text-emerald-400 truncate mt-1">
            {selectedAccountId === 'ALL'
              ? 'All Accounts Combined'
              : accounts.find(a => a.id === selectedAccountId)?.name || 'Selected Account'}
          </div>
          <button
            onClick={() => {
              onSelectAccount('ALL');
              onNavigateToDashboard();
            }}
            className="text-[11px] text-slate-400 hover:text-white underline mt-1.5 block cursor-pointer"
          >
            {selectedAccountId === 'ALL' ? 'View Unified Dashboard →' : 'Switch to All Accounts →'}
          </button>
        </div>
      </div>

      {/* Accounts Comparative Grid (Side-by-side cards) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-white tracking-tight">Your Accounts & Prop Firms</h2>
          <span className="text-xs text-slate-400">{accounts.length} Accounts Configured</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accountPerfs.map(perf => {
            const acc = perf.account;
            const isSelected = selectedAccountId === acc.id;
            const isGreen = perf.netPnl >= 0;

            return (
              <div
                key={acc.id}
                onClick={() => {
                  onSelectAccount(acc.id);
                  onNavigateToDashboard();
                }}
                className={`bg-[#101522] rounded-2xl p-5 border transition-all cursor-pointer flex flex-col justify-between group hover:border-slate-700 relative overflow-hidden ${
                  isSelected ? 'border-emerald-500/80 ring-1 ring-emerald-500/50 shadow-lg shadow-emerald-500/10' : 'border-slate-800'
                }`}
              >
                {/* Visual Color Pill Accent */}
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: acc.color || '#10b981' }}
                />

                <div>
                  {/* Top Header Row */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: acc.color || '#10b981' }}
                        />
                        <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                          {acc.name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                        {acc.broker && <span>{acc.broker}</span>}
                        {acc.broker && <span>•</span>}
                        <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-semibold text-[10px]">
                          {acc.accountType}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={e => handleOpenEditModal(acc, e)}
                        title="Edit Account"
                        className="p-1 rounded text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={e => handleDelete(acc.id, acc.name, e)}
                        title="Delete Account"
                        className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Capital & P&L Hero */}
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 mb-3 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Balance:</span>
                      <span className="font-extrabold text-white font-mono-numbers">
                        {formatCurrency(perf.currentBalance, false, 2, acc.currency === 'INR' ? 'INR' : 'USD')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Realized P&L:</span>
                      <span className={`font-mono-numbers font-bold ${isGreen ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {formatCurrency(perf.netPnl, true, 2, acc.currency === 'INR' ? 'INR' : 'USD')} ({perf.returnPercent >= 0 ? '+' : ''}{perf.returnPercent}%)
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800">
                      <span>Starting Capital:</span>
                      <span className="font-mono-numbers">{formatCurrency(acc.startingBalance, false, 0, acc.currency === 'INR' ? 'INR' : 'USD')}</span>
                    </div>
                  </div>

                  {/* Account Metrics Grid */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
                    <div className="bg-[#0c1017] p-2 rounded-lg border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block">Win Rate</span>
                      <span className="font-bold text-slate-200 font-mono-numbers">{perf.winRate}%</span>
                    </div>
                    <div className="bg-[#0c1017] p-2 rounded-lg border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block">Profit Factor</span>
                      <span className="font-bold text-slate-200 font-mono-numbers">{perf.profitFactor > 50 ? '50+' : perf.profitFactor}</span>
                    </div>
                    <div className="bg-[#0c1017] p-2 rounded-lg border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block">Trades</span>
                      <span className="font-bold text-slate-200 font-mono-numbers">{perf.tradeCount}</span>
                    </div>
                  </div>

                  {acc.notes && (
                    <p className="text-[11px] text-slate-400 line-clamp-2 italic bg-slate-900/40 p-2 rounded border border-slate-800/60 mb-3">
                      "{acc.notes}"
                    </p>
                  )}
                </div>

                {/* Footer Action */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">
                    {isSelected ? 'Currently Selected' : 'Click to view dashboard'}
                  </span>
                  <span className={`font-semibold flex items-center gap-1 ${
                    isSelected ? 'text-emerald-400' : 'text-slate-300 group-hover:text-emerald-400'
                  }`}>
                    <span>Filter App</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Side-by-side Comparative Table */}
      <div className="bg-[#101522] rounded-2xl border border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Side-by-Side Account Analytics</h3>
          </div>
          <button
            onClick={() => onSelectAccount('ALL')}
            className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all ${
              selectedAccountId === 'ALL'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
            }`}
          >
            {selectedAccountId === 'ALL' ? '✓ Showing All Accounts Aggregated' : 'Aggregate All Accounts'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#0e131d] border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Account</th>
                <th className="py-3 px-4">Broker</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Starting</th>
                <th className="py-3 px-4">Current Balance</th>
                <th className="py-3 px-4">Net P&L</th>
                <th className="py-3 px-4">Return %</th>
                <th className="py-3 px-4">Win Rate</th>
                <th className="py-3 px-4">Profit Factor</th>
                <th className="py-3 px-4">Trades</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono-numbers">
              {accountPerfs.map(perf => {
                const acc = perf.account;
                const isSelected = selectedAccountId === acc.id;
                const isGreen = perf.netPnl >= 0;

                return (
                  <tr
                    key={acc.id}
                    onClick={() => {
                      onSelectAccount(acc.id);
                      onNavigateToDashboard();
                    }}
                    className={`hover:bg-slate-800/40 transition-colors cursor-pointer ${
                      isSelected ? 'bg-slate-800/30 font-semibold' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-sans font-bold text-white">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: acc.color || '#10b981' }}
                        />
                        <span>{acc.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-400">{acc.broker || '—'}</td>
                    <td className="py-3 px-4 font-sans">
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-bold">
                        {acc.accountType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {formatCurrency(acc.startingBalance, false, 0)}
                    </td>
                    <td className="py-3 px-4 font-bold text-white">
                      {formatCurrency(perf.currentBalance, false, 2)}
                    </td>
                    <td className={`py-3 px-4 font-bold ${isGreen ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {formatCurrency(perf.netPnl)}
                    </td>
                    <td className={`py-3 px-4 font-bold ${perf.returnPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {perf.returnPercent >= 0 ? '+' : ''}{perf.returnPercent}%
                    </td>
                    <td className="py-3 px-4 text-slate-200">{perf.winRate}%</td>
                    <td className="py-3 px-4 text-slate-200">{perf.profitFactor > 50 ? '50+' : perf.profitFactor}</td>
                    <td className="py-3 px-4 text-slate-400">{perf.tradeCount}</td>
                    <td className="py-3 px-4 text-right font-sans" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          onSelectAccount(acc.id);
                          onNavigateToDashboard();
                        }}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
                      >
                        {isSelected ? 'Active' : 'Select'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Account Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#101522] border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-[#0e131d]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <h3 className="text-base font-bold text-white">
                  {editingAccount ? 'Edit Trading Account' : 'Add New Trading Account'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Account Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. TopStep 150K Challenge, Schwab Equities"
                  className="w-full bg-[#0c1017] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Broker / Prop Firm
                  </label>
                  <input
                    type="text"
                    value={broker}
                    onChange={e => setBroker(e.target.value)}
                    placeholder="e.g. TopStep, IBKR, Apex"
                    className="w-full bg-[#0c1017] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Account Type
                  </label>
                  <select
                    value={accountType}
                    onChange={e => setAccountType(e.target.value as AccountType)}
                    className="w-full bg-[#0c1017] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="PROP_FIRM">Prop Firm / Evaluation</option>
                    <option value="MARGIN">Margin Account</option>
                    <option value="CASH">Cash Account</option>
                    <option value="FUTURES">Futures Account</option>
                    <option value="CRYPTO">Crypto Exchange</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Starting Capital / Balance *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={startingBalance}
                    onChange={e => setStartingBalance(parseFloat(e.target.value) || 0)}
                    placeholder="50000"
                    className="w-full bg-[#0c1017] border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono-numbers text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Currency
                  </label>
                  <input
                    type="text"
                    value={currency}
                    onChange={e => setCurrency(e.target.value.toUpperCase())}
                    placeholder="USD"
                    className="w-full bg-[#0c1017] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Color Preset */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Accent Color Tag
                </label>
                <div className="flex items-center gap-2">
                  {colorPresets.map(preset => (
                    <button
                      type="button"
                      key={preset.hex}
                      onClick={() => setColor(preset.hex)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                        color === preset.hex ? 'ring-2 ring-white scale-110' : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: preset.hex }}
                    >
                      {color === preset.hex && <Check className="w-3.5 h-3.5 text-slate-950 font-bold" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Account Rules & Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Max trailing drawdown $3,000. Profit target $9,000. Max 3 contracts."
                  className="w-full bg-[#0c1017] border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingAccount ? 'Save Changes' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
