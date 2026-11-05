import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { Trade, UserProfile, TradingAccount } from '../types/trade';

const LOCAL_STORAGE_KEY = 'tradezella_local_trades';
const LOCAL_PROFILE_KEY = 'tradezella_local_profile';
const LOCAL_ACCOUNTS_KEY = 'tradezella_local_accounts';

export const DEFAULT_ACCOUNTS_DATA: Omit<TradingAccount, 'userId'>[] = [
  {
    id: 'acc_topstep_150k',
    name: 'TopStep 150K Funded',
    broker: 'TopStep / Tradovate',
    accountType: 'PROP_FIRM',
    startingBalance: 150000,
    currency: 'USD',
    color: '#10b981', // emerald
    notes: 'Max trailing drawdown $4,500. Daily loss limit $3,000. ES & NQ execution.'
  },
  {
    id: 'acc_ibkr_pro',
    name: 'Interactive Brokers Pro',
    broker: 'Interactive Brokers',
    accountType: 'MARGIN',
    startingBalance: 25000,
    currency: 'USD',
    color: '#0ea5e9', // sky
    notes: 'Primary equities and options swing/day trading account with portfolio margin.'
  },
  {
    id: 'acc_binance_crypto',
    name: 'Binance USDT Futures',
    broker: 'Binance',
    accountType: 'CRYPTO',
    startingBalance: 10000,
    currency: 'USDT',
    color: '#f59e0b', // amber
    notes: 'BTC and SOL momentum breakout and liquidity sweep setups.'
  },
  {
    id: 'acc_zerodha_kite',
    name: 'Zerodha Kite Pro (INR)',
    broker: 'Zerodha',
    accountType: 'MARGIN',
    startingBalance: 500000,
    currency: 'INR',
    color: '#8b5cf6', // purple
    notes: 'Indian NSE/BSE Equities and Nifty/BankNifty options & intraday trades in INR.'
  }
];

/**
 * Sanitize trade object to remove undefined fields and ensure Firestore compatibility
 */
function sanitizeTradePayload(trade: Partial<Trade>, userId: string): Record<string, any> {
  const clean: Record<string, any> = {
    id: trade.id || `trade_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId,
    currency: trade.currency || 'USD',
    symbol: (trade.symbol || 'SPY').toUpperCase().slice(0, 32),
    side: trade.side || 'LONG',
    assetClass: trade.assetClass || 'STOCKS',
    entryDate: trade.entryDate || new Date().toISOString(),
    entryPrice: Number(trade.entryPrice || 0),
    quantity: Number(trade.quantity || 1),
    netPnl: Number(trade.netPnl || 0),
    status: trade.status || (Number(trade.netPnl || 0) > 0 ? 'WIN' : Number(trade.netPnl || 0) < 0 ? 'LOSS' : 'BREAKEVEN'),
    createdAt: trade.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (trade.accountId) clean.accountId = trade.accountId.slice(0, 128);
  if (trade.accountName) clean.accountName = trade.accountName.slice(0, 64);
  if (trade.exitDate) clean.exitDate = trade.exitDate;
  if (trade.exitPrice !== undefined && trade.exitPrice !== null) clean.exitPrice = Number(trade.exitPrice);
  if (trade.grossPnl !== undefined && trade.grossPnl !== null) clean.grossPnl = Number(trade.grossPnl);
  if (trade.fees !== undefined && trade.fees !== null) clean.fees = Number(trade.fees);
  if (trade.pnlPercent !== undefined && trade.pnlPercent !== null) clean.pnlPercent = Number(trade.pnlPercent);
  if (trade.stopLoss !== undefined && trade.stopLoss !== null) clean.stopLoss = Number(trade.stopLoss);
  if (trade.takeProfit !== undefined && trade.takeProfit !== null) clean.takeProfit = Number(trade.takeProfit);
  if (trade.setup) clean.setup = trade.setup.slice(0, 64);
  if (trade.notes) clean.notes = trade.notes.slice(0, 5000);
  if (trade.mistakes) clean.mistakes = trade.mistakes.slice(0, 256);
  if (trade.rating !== undefined && trade.rating !== null) clean.rating = Number(trade.rating);
  if (trade.chartUrl) clean.chartUrl = trade.chartUrl.slice(0, 1024);

  return clean;
}

/**
 * Sanitize account object for Firestore storage
 */
function sanitizeAccountPayload(acc: Partial<TradingAccount>, userId: string): TradingAccount {
  return {
    id: acc.id || `acc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId,
    name: (acc.name || 'Main Account').slice(0, 64),
    broker: (acc.broker || '').slice(0, 64),
    accountType: acc.accountType || 'CASH',
    startingBalance: Number(acc.startingBalance || 10000),
    currency: (acc.currency || 'USD').slice(0, 8),
    color: acc.color || '#10b981',
    notes: (acc.notes || '').slice(0, 1000),
    createdAt: acc.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export const tradeService = {
  /**
   * Save a single trade to Firestore or LocalStorage
   */
  async saveTrade(trade: Trade, userId: string | null): Promise<Trade> {
    const finalUserId = userId || 'local_user';
    const payload = sanitizeTradePayload(trade, finalUserId) as Trade;

    if (userId && auth.currentUser) {
      const path = `users/${userId}/trades/${payload.id}`;
      try {
        await setDoc(doc(db, 'users', userId, 'trades', payload.id), payload);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    }

    // Always update local storage cache as well
    const local = this.getLocalTrades();
    const index = local.findIndex(t => t.id === payload.id);
    if (index >= 0) {
      local[index] = payload;
    } else {
      local.unshift(payload);
    }
    this.saveLocalTrades(local);

    return payload;
  },

  /**
   * Batch save an array of trades (e.g. from CSV import or demo seed)
   */
  async batchSaveTrades(trades: Trade[], userId: string | null): Promise<Trade[]> {
    const finalUserId = userId || 'local_user';
    const cleanList = trades.map(t => sanitizeTradePayload(t, finalUserId) as Trade);

    if (userId && auth.currentUser) {
      const path = `users/${userId}/trades`;
      try {
        const CHUNK_SIZE = 400;
        for (let i = 0; i < cleanList.length; i += CHUNK_SIZE) {
          const chunk = cleanList.slice(i, i + CHUNK_SIZE);
          const batch = writeBatch(db);
          for (const item of chunk) {
            const ref = doc(db, 'users', userId, 'trades', item.id);
            batch.set(ref, item);
          }
          await batch.commit();
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    }

    // Merge into local cache
    const existing = this.getLocalTrades();
    const existingIds = new Set(existing.map(t => t.id));
    const merged = [...cleanList.filter(t => !existingIds.has(t.id)), ...existing];
    this.saveLocalTrades(merged);

    return cleanList;
  },

  /**
   * Delete a single trade
   */
  async deleteTrade(tradeId: string, userId: string | null): Promise<void> {
    if (userId && auth.currentUser) {
      const path = `users/${userId}/trades/${tradeId}`;
      try {
        await deleteDoc(doc(db, 'users', userId, 'trades', tradeId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    }

    const local = this.getLocalTrades().filter(t => t.id !== tradeId);
    this.saveLocalTrades(local);
  },

  /**
   * Delete all trades for a user
   */
  async clearAllTrades(userId: string | null): Promise<void> {
    if (userId && auth.currentUser) {
      const path = `users/${userId}/trades`;
      try {
        const snapshot = await getDocs(collection(db, 'users', userId, 'trades'));
        const batch = writeBatch(db);
        snapshot.docs.forEach(docSnap => {
          batch.delete(docSnap.ref);
        });
        await batch.commit();
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    }
    this.saveLocalTrades([]);
  },

  /**
   * Realtime Firestore subscription for authenticated user's trades
   */
  subscribeToTrades(
    userId: string,
    onData: (trades: Trade[]) => void,
    onError: (error: any) => void
  ): () => void {
    const path = `users/${userId}/trades`;
    const colRef = collection(db, 'users', userId, 'trades');

    return onSnapshot(
      colRef,
      snapshot => {
        const trades: Trade[] = [];
        snapshot.forEach(docSnap => {
          trades.push(docSnap.data() as Trade);
        });
        trades.sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
        this.saveLocalTrades(trades);
        onData(trades);
      },
      error => {
        handleFirestoreError(error, OperationType.GET, path);
        onError(error);
      }
    );
  },

  // ---------------- ACCOUNT MANAGEMENT ---------------- //

  /**
   * Save or update a trading account
   */
  async saveAccount(account: TradingAccount, userId: string | null): Promise<TradingAccount> {
    const finalUserId = userId || 'local_user';
    const payload = sanitizeAccountPayload(account, finalUserId);

    if (userId && auth.currentUser) {
      const path = `users/${userId}/accounts/${payload.id}`;
      try {
        await setDoc(doc(db, 'users', userId, 'accounts', payload.id), payload);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    }

    const local = this.getLocalAccounts();
    const index = local.findIndex(a => a.id === payload.id);
    if (index >= 0) {
      local[index] = payload;
    } else {
      local.push(payload);
    }
    this.saveLocalAccounts(local);
    return payload;
  },

  /**
   * Delete an account
   */
  async deleteAccount(accountId: string, userId: string | null): Promise<void> {
    if (userId && auth.currentUser) {
      const path = `users/${userId}/accounts/${accountId}`;
      try {
        await deleteDoc(doc(db, 'users', userId, 'accounts', accountId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    }

    const local = this.getLocalAccounts().filter(a => a.id !== accountId);
    this.saveLocalAccounts(local);
  },

  /**
   * Realtime subscription to trading accounts
   */
  subscribeToAccounts(
    userId: string,
    onData: (accounts: TradingAccount[]) => void,
    onError: (error: any) => void
  ): () => void {
    const path = `users/${userId}/accounts`;
    const colRef = collection(db, 'users', userId, 'accounts');

    return onSnapshot(
      colRef,
      snapshot => {
        const accounts: TradingAccount[] = [];
        snapshot.forEach(docSnap => {
          accounts.push(docSnap.data() as TradingAccount);
        });
        if (accounts.length === 0) {
          // Initialize default accounts for user if none exist yet
          const defaults = this.getDefaultAccounts(userId);
          defaults.forEach(a => this.saveAccount(a, userId));
          onData(defaults);
        } else {
          this.saveLocalAccounts(accounts);
          onData(accounts);
        }
      },
      error => {
        handleFirestoreError(error, OperationType.GET, path);
        onError(error);
      }
    );
  },

  getDefaultAccounts(userId: string): TradingAccount[] {
    const nowIso = new Date().toISOString();
    return DEFAULT_ACCOUNTS_DATA.map(d => ({
      ...d,
      userId,
      createdAt: nowIso,
      updatedAt: nowIso
    }));
  },

  getLocalAccounts(): TradingAccount[] {
    try {
      const data = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      const defaults = this.getDefaultAccounts('local_user');
      this.saveLocalAccounts(defaults);
      return defaults;
    } catch {
      return this.getDefaultAccounts('local_user');
    }
  },

  saveLocalAccounts(accounts: TradingAccount[]): void {
    try {
      localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));
    } catch {
      // ignore
    }
  },

  /**
   * User profile persistence
   */
  async saveUserProfile(profile: UserProfile): Promise<void> {
    if (profile.userId && auth.currentUser) {
      const path = `users/${profile.userId}`;
      try {
        await setDoc(doc(db, 'users', profile.userId), {
          ...profile,
          updatedAt: new Date().toISOString()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    }
    try {
      localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(profile));
    } catch {
      // ignore storage quota error
    }
  },

  // Local storage helpers
  getLocalTrades(): Trade[] {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveLocalTrades(trades: Trade[]): void {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(trades));
    } catch {
      // ignore
    }
  },

  getLocalProfile(): UserProfile | null {
    try {
      const data = localStorage.getItem(LOCAL_PROFILE_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }
};
