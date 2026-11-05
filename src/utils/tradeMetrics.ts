import {
  Trade,
  TradeMetrics,
  EquityPoint,
  SetupAnalysis,
  AssetAnalysis,
  DayOfWeekAnalysis,
  MistakeAnalysis,
  DayStats,
  AssetClass,
  TradingAccount,
  AccountPerformance,
  CurrencyCode
} from '../types/trade';

/**
 * Default USD to INR exchange rate (1 USD = 86.50 INR)
 */
export const DEFAULT_USD_INR_RATE = 86.50;

/**
 * Converts an amount between USD and INR using the specified exchange rate
 */
export function convertCurrency(
  amount: number,
  from: CurrencyCode = 'USD',
  to: CurrencyCode = 'USD',
  rate: number = DEFAULT_USD_INR_RATE
): number {
  if (isNaN(amount) || amount === 0) return 0;
  if (from === to) return amount;
  if (from === 'USD' && to === 'INR') {
    return Number((amount * rate).toFixed(2));
  }
  if (from === 'INR' && to === 'USD') {
    return Number((amount / rate).toFixed(2));
  }
  return amount;
}

/**
 * Normalizes a trade's financial fields to a target currency (USD or INR)
 */
export function normalizeTrade(
  trade: Trade,
  targetCurrency: CurrencyCode,
  rate: number = DEFAULT_USD_INR_RATE
): Trade {
  const sourceCurrency: CurrencyCode = trade.currency || 'USD';
  if (sourceCurrency === targetCurrency) {
    return trade;
  }

  return {
    ...trade,
    currency: targetCurrency,
    netPnl: convertCurrency(trade.netPnl, sourceCurrency, targetCurrency, rate),
    grossPnl: trade.grossPnl !== undefined ? convertCurrency(trade.grossPnl, sourceCurrency, targetCurrency, rate) : undefined,
    fees: trade.fees !== undefined ? convertCurrency(trade.fees, sourceCurrency, targetCurrency, rate) : undefined,
    entryPrice: convertCurrency(trade.entryPrice, sourceCurrency, targetCurrency, rate),
    exitPrice: trade.exitPrice !== undefined ? convertCurrency(trade.exitPrice, sourceCurrency, targetCurrency, rate) : undefined,
    stopLoss: trade.stopLoss !== undefined ? convertCurrency(trade.stopLoss, sourceCurrency, targetCurrency, rate) : undefined,
    takeProfit: trade.takeProfit !== undefined ? convertCurrency(trade.takeProfit, sourceCurrency, targetCurrency, rate) : undefined,
  };
}

/**
 * Normalizes a list of trades into a single target currency for unified analytics and charts
 */
export function normalizeTrades(
  trades: Trade[],
  targetCurrency: CurrencyCode,
  rate: number = DEFAULT_USD_INR_RATE
): Trade[] {
  return trades.map(t => normalizeTrade(t, targetCurrency, rate));
}

/**
 * Universal currency formatter for clean TradeZella-style figures with USD ($) and INR (₹) support.
 * Uses en-IN locale for Indian numbering system (e.g. ₹1,50,000.00).
 */
export function formatCurrency(
  val: number,
  showPlus = true,
  decimals = 2,
  currency: CurrencyCode = 'USD'
): string {
  if (isNaN(val)) return currency === 'INR' ? '₹0.00' : '$0.00';
  const symbol = currency === 'INR' ? '₹' : '$';
  const locale = currency === 'INR' ? 'en-IN' : 'en-US';
  const absFormatted = Math.abs(val).toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
  if (val > 0) return `${showPlus ? '+' : ''}${symbol}${absFormatted}`;
  if (val < 0) return `-${symbol}${absFormatted}`;
  return `${symbol}${absFormatted}`;
}

/**
 * Calculates key trading performance metrics from a list of trades
 */
export function calculateTradeMetrics(trades: Trade[]): TradeMetrics {
  const closedTrades = trades.filter(t => t.status !== 'OPEN');
  const totalTrades = closedTrades.length;

  if (totalTrades === 0) {
    return {
      totalTrades: 0,
      winCount: 0,
      lossCount: 0,
      breakevenCount: 0,
      openCount: trades.filter(t => t.status === 'OPEN').length,
      winRate: 0,
      lossRate: 0,
      netPnl: 0,
      grossWins: 0,
      grossLosses: 0,
      profitFactor: 0,
      avgWin: 0,
      avgLoss: 0,
      winLossRatio: 0,
      largestWin: 0,
      largestLoss: 0,
      maxDrawdown: 0,
      maxDrawdownPercent: 0,
      expectancy: 0,
      totalFees: 0,
      totalVolume: 0,
      bestSetup: 'None',
      mostFrequentMistake: 'None',
      totalMistakeCost: 0
    };
  }

  let winCount = 0;
  let lossCount = 0;
  let breakevenCount = 0;
  let netPnl = 0;
  let grossWins = 0;
  let grossLosses = 0;
  let largestWin = 0;
  let largestLoss = 0;
  let totalFees = 0;
  let totalVolume = 0;
  let totalMistakeCost = 0;

  const mistakeFrequency: Record<string, number> = {};
  const setupPnl: Record<string, number> = {};

  // Sort chronologically for drawdown calculation
  const sortedTrades = [...closedTrades].sort((a, b) => {
    return new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime();
  });

  let peakPnl = 0;
  let currentRunningPnl = 0;
  let maxDrawdown = 0;

  for (const trade of sortedTrades) {
    const pnl = trade.netPnl;
    netPnl += pnl;
    currentRunningPnl += pnl;

    if (currentRunningPnl > peakPnl) {
      peakPnl = currentRunningPnl;
    }
    const currentDrawdown = peakPnl - currentRunningPnl;
    if (currentDrawdown > maxDrawdown) {
      maxDrawdown = currentDrawdown;
    }

    if (pnl > 0) {
      winCount++;
      grossWins += pnl;
      if (pnl > largestWin) largestWin = pnl;
    } else if (pnl < 0) {
      lossCount++;
      grossLosses += Math.abs(pnl);
      if (pnl < largestLoss) largestLoss = pnl;
    } else {
      breakevenCount++;
    }

    if (trade.fees) {
      totalFees += trade.fees;
    }
    totalVolume += trade.quantity * trade.entryPrice;

    if (trade.setup) {
      setupPnl[trade.setup] = (setupPnl[trade.setup] || 0) + pnl;
    }

    if (trade.mistakes && trade.mistakes.trim().length > 0) {
      const parts = trade.mistakes.split(',').map(s => s.trim()).filter(Boolean);
      for (const m of parts) {
        mistakeFrequency[m] = (mistakeFrequency[m] || 0) + 1;
      }
      if (pnl < 0) {
        totalMistakeCost += Math.abs(pnl);
      }
    }
  }

  const winRate = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0;
  const lossRate = totalTrades > 0 ? (lossCount / totalTrades) * 100 : 0;
  const avgWin = winCount > 0 ? grossWins / winCount : 0;
  const avgLoss = lossCount > 0 ? grossLosses / lossCount : 0;
  const winLossRatio = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? avgWin : 0;
  const profitFactor = grossLosses > 0 ? grossWins / grossLosses : grossWins > 0 ? 999 : 0;
  const expectancy = totalTrades > 0 ? netPnl / totalTrades : 0;

  // Best setup
  let bestSetup = 'None';
  let bestSetupPnl = -Infinity;
  for (const [setup, sPnl] of Object.entries(setupPnl)) {
    if (sPnl > bestSetupPnl) {
      bestSetupPnl = sPnl;
      bestSetup = setup;
    }
  }

  // Most frequent mistake
  let mostFrequentMistake = 'None';
  let maxMistakeFreq = 0;
  for (const [m, count] of Object.entries(mistakeFrequency)) {
    if (count > maxMistakeFreq) {
      maxMistakeFreq = count;
      mostFrequentMistake = m;
    }
  }

  const maxDrawdownPercent = peakPnl > 0 ? (maxDrawdown / peakPnl) * 100 : 0;

  return {
    totalTrades,
    winCount,
    lossCount,
    breakevenCount,
    openCount: trades.filter(t => t.status === 'OPEN').length,
    winRate: Number(winRate.toFixed(2)),
    lossRate: Number(lossRate.toFixed(2)),
    netPnl: Number(netPnl.toFixed(2)),
    grossWins: Number(grossWins.toFixed(2)),
    grossLosses: Number(grossLosses.toFixed(2)),
    profitFactor: Number(profitFactor.toFixed(2)),
    avgWin: Number(avgWin.toFixed(2)),
    avgLoss: Number(avgLoss.toFixed(2)),
    winLossRatio: Number(winLossRatio.toFixed(2)),
    largestWin: Number(largestWin.toFixed(2)),
    largestLoss: Number(largestLoss.toFixed(2)),
    maxDrawdown: Number(maxDrawdown.toFixed(2)),
    maxDrawdownPercent: Number(maxDrawdownPercent.toFixed(2)),
    expectancy: Number(expectancy.toFixed(2)),
    totalFees: Number(totalFees.toFixed(2)),
    totalVolume: Number(totalVolume.toFixed(2)),
    bestSetup,
    mostFrequentMistake,
    totalMistakeCost: Number(totalMistakeCost.toFixed(2))
  };
}

/**
 * Builds cumulative equity curve points chronologically
 */
export function calculateEquityCurve(trades: Trade[]): EquityPoint[] {
  const closedTrades = trades
    .filter(t => t.status !== 'OPEN')
    .sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());

  if (closedTrades.length === 0) return [];

  let cumulativePnl = 0;
  return closedTrades.map(trade => {
    cumulativePnl += trade.netPnl;
    return {
      date: trade.entryDate.split('T')[0],
      tradeId: trade.id,
      symbol: trade.symbol,
      tradePnl: trade.netPnl,
      cumulativePnl: Number(cumulativePnl.toFixed(2))
    };
  });
}

/**
 * Aggregates trades into daily stats for calendar and daily breakdown
 */
export function aggregateDailyStats(trades: Trade[]): Record<string, DayStats> {
  const result: Record<string, DayStats> = {};

  for (const trade of trades) {
    const dateKey = trade.entryDate.split('T')[0];
    if (!result[dateKey]) {
      result[dateKey] = {
        date: dateKey,
        netPnl: 0,
        tradeCount: 0,
        wins: 0,
        losses: 0,
        trades: []
      };
    }

    result[dateKey].trades.push(trade);
    result[dateKey].tradeCount++;
    result[dateKey].netPnl = Number((result[dateKey].netPnl + trade.netPnl).toFixed(2));
    if (trade.netPnl > 0) {
      result[dateKey].wins++;
    } else if (trade.netPnl < 0) {
      result[dateKey].losses++;
    }
  }

  return result;
}

/**
 * Groups and analyzes performance by Strategy / Setup
 */
export function calculateSetupAnalysis(trades: Trade[]): SetupAnalysis[] {
  const closed = trades.filter(t => t.status !== 'OPEN');
  const groups: Record<string, Trade[]> = {};

  for (const t of closed) {
    const key = t.setup?.trim() || 'Unassigned';
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  }

  return Object.entries(groups).map(([setup, groupTrades]) => {
    const count = groupTrades.length;
    const wins = groupTrades.filter(t => t.netPnl > 0);
    const losses = groupTrades.filter(t => t.netPnl < 0);
    const winRate = count > 0 ? (wins.length / count) * 100 : 0;
    const netPnl = groupTrades.reduce((acc, t) => acc + t.netPnl, 0);
    const avgPnl = count > 0 ? netPnl / count : 0;
    const grossWins = wins.reduce((acc, t) => acc + t.netPnl, 0);
    const grossLosses = Math.abs(losses.reduce((acc, t) => acc + t.netPnl, 0));
    const profitFactor = grossLosses > 0 ? grossWins / grossLosses : grossWins > 0 ? 999 : 0;

    return {
      setup,
      tradeCount: count,
      winRate: Number(winRate.toFixed(1)),
      netPnl: Number(netPnl.toFixed(2)),
      avgPnl: Number(avgPnl.toFixed(2)),
      profitFactor: Number(profitFactor.toFixed(2))
    };
  }).sort((a, b) => b.netPnl - a.netPnl);
}

/**
 * Groups and analyzes performance by Asset Class
 */
export function calculateAssetAnalysis(trades: Trade[]): AssetAnalysis[] {
  const assetTypes: AssetClass[] = ['STOCKS', 'OPTIONS', 'CRYPTO', 'FOREX', 'FUTURES'];
  const closed = trades.filter(t => t.status !== 'OPEN');

  return assetTypes.map(asset => {
    const list = closed.filter(t => t.assetClass === asset);
    const count = list.length;
    const wins = list.filter(t => t.netPnl > 0).length;
    const netPnl = list.reduce((acc, t) => acc + t.netPnl, 0);
    const winRate = count > 0 ? (wins / count) * 100 : 0;

    return {
      assetClass: asset,
      tradeCount: count,
      winRate: Number(winRate.toFixed(1)),
      netPnl: Number(netPnl.toFixed(2))
    };
  }).filter(a => a.tradeCount > 0);
}

/**
 * Groups and analyzes performance by Day of the Week (Mon - Fri)
 */
export function calculateDayOfWeekAnalysis(trades: Trade[]): DayOfWeekAnalysis[] {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const closed = trades.filter(t => t.status !== 'OPEN');

  const groups: Record<number, Trade[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] };

  for (const t of closed) {
    const d = new Date(t.entryDate);
    const day = d.getDay();
    if (day >= 1 && day <= 5) {
      groups[day].push(t);
    }
  }

  return [1, 2, 3, 4, 5].map(dayIndex => {
    const groupTrades = groups[dayIndex] || [];
    const count = groupTrades.length;
    const wins = groupTrades.filter(t => t.netPnl > 0).length;
    const netPnl = groupTrades.reduce((acc, t) => acc + t.netPnl, 0);
    const winRate = count > 0 ? (wins / count) * 100 : 0;

    return {
      dayName: dayNames[dayIndex],
      dayIndex,
      tradeCount: count,
      netPnl: Number(netPnl.toFixed(2)),
      winRate: Number(winRate.toFixed(1))
    };
  });
}

/**
 * Aggregates psychological mistake frequency and cost
 */
export function calculateMistakeAnalysis(trades: Trade[]): MistakeAnalysis[] {
  const map: Record<string, { count: number; loss: number }> = {};

  for (const t of trades) {
    if (!t.mistakes || t.mistakes.trim().length === 0) continue;
    const tags = t.mistakes.split(',').map(s => s.trim()).filter(Boolean);
    const tradeLoss = t.netPnl < 0 ? Math.abs(t.netPnl) : 0;

    for (const tag of tags) {
      if (!map[tag]) map[tag] = { count: 0, loss: 0 };
      map[tag].count++;
      map[tag].loss += tradeLoss;
    }
  }

  return Object.entries(map).map(([mistake, data]) => ({
    mistake,
    occurrences: data.count,
    totalLoss: Number(data.loss.toFixed(2))
  })).sort((a, b) => b.totalLoss - a.totalLoss);
}

/**
 * Calculates comparative performance metrics across different trading accounts
 */
export function calculateAccountPerformance(accounts: TradingAccount[], trades: Trade[]): AccountPerformance[] {
  return accounts.map(account => {
    // Match trades by accountId or fallback to matching accountName
    const accountTrades = trades.filter(t => t.accountId === account.id || (!t.accountId && t.accountName === account.name));
    const closed = accountTrades.filter(t => t.status !== 'OPEN');
    const tradeCount = closed.length;
    const wins = closed.filter(t => t.netPnl > 0);
    const losses = closed.filter(t => t.netPnl < 0);
    const winCount = wins.length;
    const lossCount = losses.length;
    const winRate = tradeCount > 0 ? (winCount / tradeCount) * 100 : 0;
    const netPnl = closed.reduce((acc, t) => acc + t.netPnl, 0);
    const grossWins = wins.reduce((acc, t) => acc + t.netPnl, 0);
    const grossLosses = Math.abs(losses.reduce((acc, t) => acc + t.netPnl, 0));
    const profitFactor = grossLosses > 0 ? grossWins / grossLosses : grossWins > 0 ? 999 : 0;
    const currentBalance = account.startingBalance + netPnl;
    const returnPercent = account.startingBalance > 0 ? (netPnl / account.startingBalance) * 100 : 0;
    const avgPnl = tradeCount > 0 ? netPnl / tradeCount : 0;

    // Drawdown calculation for this specific account
    const sorted = [...closed].sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());
    let peak = 0;
    let running = 0;
    let maxDrawdown = 0;
    for (const t of sorted) {
      running += t.netPnl;
      if (running > peak) peak = running;
      const dd = peak - running;
      if (dd > maxDrawdown) maxDrawdown = dd;
    }

    return {
      account,
      tradeCount,
      winCount,
      lossCount,
      winRate: Number(winRate.toFixed(1)),
      netPnl: Number(netPnl.toFixed(2)),
      profitFactor: Number(profitFactor.toFixed(2)),
      currentBalance: Number(currentBalance.toFixed(2)),
      returnPercent: Number(returnPercent.toFixed(2)),
      maxDrawdown: Number(maxDrawdown.toFixed(2)),
      avgPnl: Number(avgPnl.toFixed(2))
    };
  }).sort((a, b) => b.netPnl - a.netPnl);
}

