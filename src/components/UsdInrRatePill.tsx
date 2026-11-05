import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, Check, RotateCcw, X } from 'lucide-react';
import { DEFAULT_USD_INR_RATE } from '../utils/tradeMetrics';

interface UsdInrRatePillProps {
  rate?: number;
  onRateChange?: (newRate: number) => void;
  className?: string;
}

export const UsdInrRatePill: React.FC<UsdInrRatePillProps> = ({
  rate = DEFAULT_USD_INR_RATE,
  onRateChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(rate.toString());
  const [error, setError] = useState<string | null>(null);

  // Sync input value when external rate changes
  useEffect(() => {
    setInputValue(rate.toString());
  }, [rate]);

  const handleApply = () => {
    const num = parseFloat(inputValue);
    if (isNaN(num) || num <= 0 || num > 1000) {
      setError('Enter a valid exchange rate between 1 and 1000 (e.g. 86.50)');
      return;
    }
    setError(null);
    onRateChange?.(Number(num.toFixed(2)));
    setIsOpen(false);
  };

  const handleReset = () => {
    setInputValue(DEFAULT_USD_INR_RATE.toString());
    onRateChange?.(DEFAULT_USD_INR_RATE);
    setError(null);
    setIsOpen(false);
  };

  const currentPreviewVal = parseFloat(inputValue) || rate;
  const isCustom = Math.abs(rate - DEFAULT_USD_INR_RATE) > 0.001;

  return (
    <span className={`inline-flex items-center ${className}`}>
      {/* Interactive conversion rate pill button */}
      <button
        type="button"
        onClick={() => {
          setInputValue(rate.toString());
          setError(null);
          setIsOpen(true);
        }}
        title="Click to customize USD to INR exchange rate"
        className={`inline-flex items-center gap-1.5 text-[11px] font-mono-numbers px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer group shadow-sm select-none ${
          isCustom
            ? 'bg-purple-950/50 border-purple-500/50 text-purple-200 hover:border-purple-400 hover:bg-purple-900/50 ring-1 ring-purple-500/30'
            : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white hover:bg-slate-800/90'
        }`}
      >
        <span className="flex items-center gap-1">
          <span className="text-slate-400 font-medium font-sans">1 USD =</span>
          <span className="font-bold text-white">₹{rate.toFixed(2)}</span>
        </span>
        <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-slate-800/90 text-slate-400 group-hover:text-emerald-400 group-hover:bg-slate-700/80 transition-colors">
          <SlidersHorizontal className="w-2.5 h-2.5 text-slate-400 group-hover:text-emerald-400" />
          <span>Edit</span>
        </span>
      </button>

      {/* Centered Modal Pop-up (Glitch-free on both mobile and desktop) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div
            className="w-full max-w-sm rounded-2xl bg-[#0f1420] border border-slate-700/90 shadow-2xl p-6 relative overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Customize USD/INR Rate</h3>
                  <p className="text-[11px] text-slate-400">Recalculates all portfolio analytics & P&L</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Rate Input Field */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Exchange Rate (1 USD in ₹ INR):
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-slate-400 text-sm font-bold font-mono">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  max="1000"
                  value={inputValue}
                  onChange={e => {
                    setInputValue(e.target.value);
                    setError(null);
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleApply();
                    }
                  }}
                  className="w-full bg-[#161c2c] border border-slate-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 text-white pl-9 pr-16 py-2.5 rounded-xl text-base font-bold font-mono-numbers outline-none transition-all"
                  placeholder="86.50"
                  autoFocus
                />
                <span className="absolute right-3 text-xs text-slate-400 font-semibold uppercase">INR</span>
              </div>
              {error && <p className="text-xs text-rose-400 mt-1.5 font-medium">{error}</p>}
            </div>

            {/* Quick Presets */}
            <div className="mb-4">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Quick Presets
              </span>
              <div className="grid grid-cols-4 gap-2">
                {[83.5, 85.0, 86.5, 88.0].map(pRate => (
                  <button
                    key={pRate}
                    type="button"
                    onClick={() => {
                      setInputValue(pRate.toString());
                      setError(null);
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer text-center ${
                      Math.abs(currentPreviewVal - pRate) < 0.01
                        ? 'bg-purple-600 text-white shadow-md ring-2 ring-purple-500/40'
                        : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/50'
                    }`}
                  >
                    ₹{pRate.toFixed(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Conversion Preview */}
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 mb-5 space-y-1.5 text-xs font-mono-numbers">
              <div className="flex items-center justify-between text-slate-400">
                <span>$100.00 USD</span>
                <span className="text-emerald-400 font-bold">≈ ₹{(100 * currentPreviewVal).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>₹1,00,000 INR</span>
                <span className="text-purple-300 font-bold">≈ ${(100000 / (currentPreviewVal || 1)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Actions / Apply / Confirm Buttons */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleApply}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-bold shadow-lg shadow-purple-900/30 cursor-pointer transition-all"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Confirm & Apply</span>
              </button>
              <button
                type="button"
                onClick={handleReset}
                title="Reset to default rate (86.50)"
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 border border-slate-700"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </span>
  );
};
