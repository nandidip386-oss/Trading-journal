export type TradeSide = 'LONG' | 'SHORT';
export type AssetClass = 'STOCKS' | 'OPTIONS' | 'CRYPTO' | 'FOREX' | 'FUTURES';
export type TradeStatus = 'WIN' | 'LOSS' | 'BREAKEVEN' | 'OPEN';
export type AccountType = 'CASH' | 'MARGIN' | 'PROP_FIRM' | 'CRYPTO' | 'FUTURES';
export type CurrencyCode = 'USD' | 'INR';

export interface TradingAccount {
  id: string;
  userId: string;
  name: string; // e.g. "TopStep 150K Funded", "Interactive Brokers", "Binance Futures"
  broker?: string; // e.g. "TopStep", "IBKR", "Robinhood", "Apex", "Binance"
  accountType: AccountType;
  startingBalance: number;
  currency: string;
  color?: string; // e.g. emerald, sky, purple, amber, rose
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Trade {
  id: string;
  userId: string;
  accountId?: string;
  accountName?: string;
  currency?: CurrencyCode; // 'USD' | 'INR', default 'USD'
  symbol: string;
  side: TradeSide;
  assetClass: AssetClass;
  entryDate: string; // ISO string YYYY-MM-DD or YYYY-MM-DDTHH:mm
  exitDate?: string;
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  netPnl: number;
  grossPnl?: number;
  fees?: number;
  pnlPercent?: number;
  stopLoss?: number;
  takeProfit?: number;
  setup?: string;
  status: TradeStatus;
  notes?: string;
  mistakes?: string;
  rating?: number; // 1-5
  chartUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserProfile {
  userId: string;
  email: string;
  displayName?: string;
  currency?: string;
  accountSize?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TradeMetrics {
  totalTrades: number;
  winCount: number;
  lossCount: number;
  breakevenCount: number;
  openCount: number;
  winRate: number; // percentage 0-100
  lossRate: number;
  netPnl: number;
  grossWins: number;
  grossLosses: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  winLossRatio: number;
  largestWin: number;
  largestLoss: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  expectancy: number; // average P&L per trade
  totalFees: number;
  totalVolume: number;
  bestSetup: string;
  mostFrequentMistake: string;
  totalMistakeCost: number;
}

export interface AccountPerformance {
  account: TradingAccount;
  tradeCount: number;
  winCount: number;
  lossCount: number;
  winRate: number;
  netPnl: number;
  profitFactor: number;
  currentBalance: number;
  returnPercent: number;
  maxDrawdown: number;
  avgPnl: number;
}

export interface DayStats {
  date: string; // YYYY-MM-DD
  netPnl: number;
  tradeCount: number;
  wins: number;
  losses: number;
  trades: Trade[];
}

export interface SetupAnalysis {
  setup: string;
  tradeCount: number;
  winRate: number;
  netPnl: number;
  avgPnl: number;
  profitFactor: number;
}

export interface AssetAnalysis {
  assetClass: AssetClass;
  tradeCount: number;
  winRate: number;
  netPnl: number;
}

export interface DayOfWeekAnalysis {
  dayName: string;
  dayIndex: number; // 0=Sun, 1=Mon, ..., 6=Sat
  tradeCount: number;
  netPnl: number;
  winRate: number;
}

export interface MistakeAnalysis {
  mistake: string;
  occurrences: number;
  totalLoss: number;
}

export interface EquityPoint {
  date: string;
  tradeId: string;
  symbol: string;
  tradePnl: number;
  cumulativePnl: number;
}
