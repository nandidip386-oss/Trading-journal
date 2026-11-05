/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
  testConnection
} from './services/firebase';
import { tradeService } from './services/tradeService';
import { Trade, TradeMetrics, TradingAccount, CurrencyCode } from './types/trade';
import { calculateTradeMetrics, normalizeTrades } from './utils/tradeMetrics';
import { Navbar, NavTab } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { TradeLogView } from './components/TradeLogView';
import { CalendarView } from './components/CalendarView';
import { AnalyticsView } from './components/AnalyticsView';
import { AccountsView } from './components/AccountsView';
import { TradeModal } from './components/TradeModal';
import { TradeDetailModal } from './components/TradeDetailModal';
import { generateDemoTrades } from './utils/demoTrades';
import { CloudCheck, LogIn, Sparkles, ShieldCheck } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [accounts, setAccounts] = useState<TradingAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('ALL');
  const [displayCurrency, setDisplayCurrency] = useState<CurrencyCode>(() => {
    try {
      const saved = localStorage.getItem('myfx_currency') || localStorage.getItem('tradezella_currency');
      return (saved === 'INR' || saved === 'USD') ? (saved as CurrencyCode) : 'USD';
    } catch {
      return 'USD';
    }
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('myfx_currency', displayCurrency);
    } catch {}
  }, [displayCurrency]);

  // Modals
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [tradeToEdit, setTradeToEdit] = useState<Trade | null>(null);
  const [detailTrade, setDetailTrade] = useState<Trade | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Initial connection test
  useEffect(() => {
    testConnection();
  }, []);

  // Listen to Auth State & initialize local data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async currentUser => {
      setUser(currentUser);
      setAuthLoading(false);

      if (currentUser) {
        // Persist profile
        await tradeService.saveUserProfile({
          userId: currentUser.uid,
          email: currentUser.email || '',
          displayName: currentUser.displayName || undefined
        });

        // Sync local accounts if any
        const localAccs = tradeService.getLocalAccounts();
        if (localAccs.length > 0) {
          for (const acc of localAccs) {
            await tradeService.saveAccount(acc, currentUser.uid);
          }
        }

        // If user already had local trades created before signing in, sync them to cloud
        const local = tradeService.getLocalTrades();
        if (local.length > 0) {
          setIsSyncing(true);
          try {
            await tradeService.batchSaveTrades(local, currentUser.uid);
          } catch (err: any) {
            console.error('Initial local migration sync error:', err);
          } finally {
            setIsSyncing(false);
          }
        }
      } else {
        // Load local accounts when guest
        const localAccs = tradeService.getLocalAccounts();
        setAccounts(localAccs);

        // Load local trades when guest
        const local = tradeService.getLocalTrades();
        if (local.length === 0) {
          // If totally empty, pre-populate demo trades so the app is instantly rich & interactive
          const demo = generateDemoTrades('local_user');
          tradeService.saveLocalTrades(demo);
          setTrades(demo);
        } else {
          setTrades(local);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Real-time Firestore subscription for Trades and Accounts when signed in
  useEffect(() => {
    if (!user) return;

    setIsSyncing(true);
    setSyncError(null);

    // Subscribe to Trades
    const unsubTrades = tradeService.subscribeToTrades(
      user.uid,
      cloudTrades => {
        setTrades(cloudTrades);
        setIsSyncing(false);
      },
      error => {
        console.error('Trades subscription error:', error);
        setSyncError('Could not sync with Firestore. Using offline cache.');
        setIsSyncing(false);
      }
    );

    // Subscribe to Accounts
    const unsubAccounts = tradeService.subscribeToAccounts(
      user.uid,
      cloudAccounts => {
        setAccounts(cloudAccounts);
      },
      error => {
        console.error('Accounts subscription error:', error);
      }
    );

    return () => {
      unsubTrades();
      unsubAccounts();
    };
  }, [user]);

  // Active trades based on selected account filter (ALL or specific account)
  const activeTrades = useMemo(() => {
    if (selectedAccountId === 'ALL') return trades;
    return trades.filter(t => t.accountId === selectedAccountId);
  }, [trades, selectedAccountId]);

  // Normalized to displayCurrency (USD or INR) for unified metrics, curves, and charts
  const normalizedActiveTrades = useMemo(() => {
    return normalizeTrades(activeTrades, displayCurrency);
  }, [activeTrades, displayCurrency]);

  // Performance metrics computed in real-time on normalized active trades
  const metrics: TradeMetrics = useMemo(() => {
    return calculateTradeMetrics(normalizedActiveTrades);
  }, [normalizedActiveTrades]);

  // Auth actions
  const handleGoogleSignIn = async () => {
    try {
      setIsSyncing(true);
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Sign-in error:', err);
      // Benign if popup was closed by user
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // Trade CRUD
  const handleSaveTrade = async (trade: Trade) => {
    setIsSyncing(true);
    try {
      const saved = await tradeService.saveTrade(trade, user ? user.uid : null);
      if (!user) {
        // Update local state directly for guest
        setTrades(prev => {
          const index = prev.findIndex(t => t.id === saved.id);
          if (index >= 0) {
            const next = [...prev];
            next[index] = saved;
            return next;
          }
          return [saved, ...prev];
        });
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteTrade = async (tradeId: string) => {
    setIsSyncing(true);
    try {
      await tradeService.deleteTrade(tradeId, user ? user.uid : null);
      if (!user) {
        setTrades(prev => prev.filter(t => t.id !== tradeId));
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleImportTrades = async (importedTrades: Trade[]) => {
    setIsSyncing(true);
    try {
      const savedList = await tradeService.batchSaveTrades(importedTrades, user ? user.uid : null);
      if (!user) {
        setTrades(prev => {
          const ids = new Set(savedList.map(t => t.id));
          return [...savedList, ...prev.filter(t => !ids.has(t.id))];
        });
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearAllTrades = async () => {
    setIsSyncing(true);
    try {
      await tradeService.clearAllTrades(user ? user.uid : null);
      setTrades([]);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLoadDemoTrades = useCallback(async () => {
    const demo = generateDemoTrades(user ? user.uid : 'local_user');
    await handleImportTrades(demo);
  }, [user]);

  // Account CRUD
  const handleSaveAccount = async (account: TradingAccount) => {
    setIsSyncing(true);
    try {
      const saved = await tradeService.saveAccount(account, user ? user.uid : null);
      if (!user) {
        setAccounts(prev => {
          const index = prev.findIndex(a => a.id === saved.id);
          if (index >= 0) {
            const next = [...prev];
            next[index] = saved;
            return next;
          }
          return [...prev, saved];
        });
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    setIsSyncing(true);
    try {
      await tradeService.deleteAccount(accountId, user ? user.uid : null);
      if (!user) {
        setAccounts(prev => prev.filter(a => a.id !== accountId));
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Modal helpers
  const handleOpenNewTrade = () => {
    setTradeToEdit(null);
    setIsTradeModalOpen(true);
  };

  const handleEditTrade = (trade: Trade) => {
    setTradeToEdit(trade);
    setIsTradeModalOpen(true);
  };

  const handleOpenDetail = (trade: Trade) => {
    setDetailTrade(trade);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        user={user}
        isSyncing={isSyncing}
        onSignIn={handleGoogleSignIn}
        onSignOut={handleSignOut}
        onOpenNewTrade={handleOpenNewTrade}
        tradeCount={trades.length}
        accounts={accounts}
        selectedAccountId={selectedAccountId}
        onSelectAccountId={setSelectedAccountId}
      />

      {/* Cross-Device Cloud Sync Reminder Banner if not signed in */}
      {!user && !authLoading && (
        <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-teal-950/40 border-b border-emerald-500/20 px-4 py-2.5">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Cloud Storage & Cross-Device Sync:</strong> Sign in with Google so your trading logs,
                accounts, and P&L dashboards are seamlessly accessible on your desktop, phone, or tablet.
              </span>
            </div>
            <button
              onClick={handleGoogleSignIn}
              className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Sign In with Google</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {currentTab === 'dashboard' && (
          <DashboardView
            trades={normalizedActiveTrades}
            metrics={metrics}
            onOpenTrade={handleOpenDetail}
            onNavigateToTrades={() => setCurrentTab('trades')}
            onNavigateToCalendar={() => setCurrentTab('calendar')}
            onLoadDemoTrades={handleLoadDemoTrades}
            onAddTrade={handleOpenNewTrade}
            displayCurrency={displayCurrency}
            onCurrencyChange={setDisplayCurrency}
          />
        )}

        {currentTab === 'trades' && (
          <TradeLogView
            trades={normalizedActiveTrades}
            onOpenTradeDetail={handleOpenDetail}
            onEditTrade={handleEditTrade}
            onDeleteTrade={handleDeleteTrade}
            onAddTrade={handleOpenNewTrade}
            onLoadDemoTrades={handleLoadDemoTrades}
            accounts={accounts}
            selectedAccountId={selectedAccountId}
            onSelectAccountId={setSelectedAccountId}
            displayCurrency={displayCurrency}
          />
        )}

        {currentTab === 'calendar' && (
          <CalendarView
            trades={normalizedActiveTrades}
            onOpenTradeDetail={handleOpenDetail}
            onAddTrade={handleOpenNewTrade}
            displayCurrency={displayCurrency}
          />
        )}

        {currentTab === 'analytics' && (
          <AnalyticsView
            trades={normalizedActiveTrades}
            metrics={metrics}
            displayCurrency={displayCurrency}
            onCurrencyChange={setDisplayCurrency}
          />
        )}

        {currentTab === 'accounts' && (
          <AccountsView
            accounts={accounts}
            trades={trades}
            selectedAccountId={selectedAccountId}
            onSelectAccount={setSelectedAccountId}
            onSaveAccount={handleSaveAccount}
            onDeleteAccount={handleDeleteAccount}
            onNavigateToDashboard={() => setCurrentTab('dashboard')}
          />
        )}
      </main>

      {/* Trade Add/Edit Modal */}
      <TradeModal
        isOpen={isTradeModalOpen}
        tradeToEdit={tradeToEdit}
        onClose={() => setIsTradeModalOpen(false)}
        onSave={handleSaveTrade}
        userId={user ? user.uid : null}
        accounts={accounts}
        defaultAccountId={selectedAccountId !== 'ALL' ? selectedAccountId : accounts[0]?.id}
      />

      {/* Trade Detailed Review Modal */}
      <TradeDetailModal
        trade={detailTrade}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onEdit={handleEditTrade}
        onDelete={handleDeleteTrade}
      />
    </div>
  );
}
