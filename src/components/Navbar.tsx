import React from 'react';
import {
  TrendingUp,
  LayoutDashboard,
  BookOpen,
  Calendar,
  BarChart3,
  Plus,
  LogIn,
  LogOut,
  User as UserIcon,
  CloudCheck,
  CloudOff,
  RefreshCw,
  Wallet,
  Layers,
  ChevronDown
} from 'lucide-react';
import { User } from '../services/firebase';
import { TradingAccount } from '../types/trade';

export type NavTab = 'dashboard' | 'trades' | 'calendar' | 'analytics' | 'accounts';

interface NavbarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  user: User | null;
  isSyncing: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
  onOpenNewTrade: () => void;
  tradeCount: number;
  accounts: TradingAccount[];
  selectedAccountId: string;
  onSelectAccountId: (accountId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  user,
  isSyncing,
  onSignIn,
  onSignOut,
  onOpenNewTrade,
  tradeCount,
  accounts,
  selectedAccountId,
  onSelectAccountId
}) => {
  const tabs = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'trades' as NavTab, label: 'Trade Log', icon: BookOpen, badge: tradeCount },
    { id: 'calendar' as NavTab, label: 'P&L Calendar', icon: Calendar },
    { id: 'analytics' as NavTab, label: 'Analytics', icon: BarChart3 },
    { id: 'accounts' as NavTab, label: 'Accounts', icon: Wallet, badge: accounts.length }
  ];

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);

  return (
    <header className="sticky top-0 z-40 bg-[#0c1017]/95 backdrop-blur-md border-b border-slate-800/80 px-3 lg:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand & Logo */}
        <div className="flex items-center gap-4 lg:gap-6">
          <div
            onClick={() => onTabChange('dashboard')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <TrendingUp className="w-4 h-4 text-slate-950 font-black stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  TradeZella
                </span>
                <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  PRO
                </span>
              </div>
            </div>
          </div>

          {/* Global Account Switcher Dropdown */}
          <div className="relative flex items-center">
            <div className="flex items-center gap-1.5 bg-[#131824] border border-slate-700/80 rounded-xl px-2.5 py-1 text-xs">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{
                  backgroundColor: selectedAccountId === 'ALL' ? '#10b981' : (selectedAccount?.color || '#0ea5e9')
                }}
              />
              <select
                value={selectedAccountId}
                onChange={e => onSelectAccountId(e.target.value)}
                className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer max-w-[140px] sm:max-w-[190px] truncate pr-1 text-xs"
              >
                <option value="ALL" className="bg-[#101522] text-emerald-300 font-bold">
                  All Accounts (Aggregated)
                </option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id} className="bg-[#101522] text-slate-200">
                    {acc.name} ({acc.accountType})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden xl:flex items-center gap-1 bg-[#131824] p-1 rounded-xl border border-slate-800">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-slate-800 text-white shadow-sm shadow-slate-950'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-700 text-slate-300 font-mono-numbers">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Actions: Sync status, Add Trade, Auth */}
        <div className="flex items-center gap-2.5">
          {/* Cloud Synchronization Status Pill */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border bg-slate-900/60 border-slate-800">
            {isSyncing ? (
              <>
                <RefreshCw className="w-3 h-3 text-sky-400 animate-spin" />
                <span className="text-sky-300 font-medium text-[11px]">Syncing...</span>
              </>
            ) : user ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 font-medium text-[11px] flex items-center gap-1">
                  Cloud Synced
                </span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-amber-300 font-medium text-[11px]">Local Mode</span>
              </>
            )}
          </div>

          {/* "+ Add Trade" Primary Action */}
          <button
            onClick={onOpenNewTrade}
            className="flex items-center gap-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Trade</span>
          </button>

          {/* User Sign In / Profile */}
          {user ? (
            <div className="flex items-center gap-1.5 pl-1 border-l border-slate-800">
              <div className="flex items-center gap-2">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-7 h-7 rounded-full border border-emerald-500/30 object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                    <UserIcon className="w-3.5 h-3.5" />
                  </div>
                )}
                <div className="hidden lg:block text-left text-xs">
                  <div className="font-semibold text-slate-200 truncate max-w-[110px]">
                    {user.displayName || user.email?.split('@')[0]}
                  </div>
                </div>
              </div>
              <button
                onClick={onSignOut}
                title="Sign Out"
                className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onSignIn}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all hover:border-slate-600 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Sign In with Google</span>
              <span className="sm:hidden">Sign In</span>
            </button>
          )}
        </div>
      </div>

      {/* Subnav for tablets & mobile, or medium screens */}
      <div className="flex xl:hidden overflow-x-auto gap-1 mt-2.5 pt-2 border-t border-slate-800/80 scrollbar-none">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="text-[9px] px-1 rounded-full bg-slate-700 text-slate-300">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
};
