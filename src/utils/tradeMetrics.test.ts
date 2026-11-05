import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateTradeMetrics,
  calculateEquityCurve,
  aggregateDailyStats,
  calculateSetupAnalysis,
  calculateAssetAnalysis,
  calculateAccountPerformance,
  formatCurrency
} from './tradeMetrics';
import { Trade, TradingAccount } from '../types/trade';

const mockTrades: Trade[] = [
  {
    id: 't1',
    userId: 'user1',
    symbol: 'NVDA',
    side: 'LONG',
    assetClass: 'STOCKS',
    entryDate: '2026-10-01T10:00:00',
    exitDate: '2026-10-01T11:00:00',
    entryPrice: 100,
    exitPrice: 110,
    quantity: 10,
    netPnl: 100,
    grossPnl: 102,
    fees: 2,
    setup: 'Breakout',
    status: 'WIN'
  },
  {
    id: 't2',
    userId: 'user1',
    symbol: 'TSLA',
    side: 'SHORT',
    assetClass: 'STOCKS',
    entryDate: '2026-10-02T10:00:00',
    exitDate: '2026-10-02T11:00:00',
    entryPrice: 200,
    exitPrice: 205,
    quantity: 10,
    netPnl: -50,
    grossPnl: -48,
    fees: 2,
    setup: 'Breakout',
    mistakes: 'FOMO',
    status: 'LOSS'
  },
  {
    id: 't3',
    userId: 'user1',
    symbol: 'AAPL',
    side: 'LONG',
    assetClass: 'OPTIONS',
    entryDate: '2026-10-03T10:00:00',
    exitDate: '2026-10-03T11:00:00',
    entryPrice: 5,
    exitPrice: 5,
    quantity: 10,
    netPnl: 0,
    grossPnl: 2,
    fees: 2,
    setup: 'VWAP Bounce',
    status: 'BREAKEVEN'
  }
];

test('calculateTradeMetrics computes accurate statistics for mixed trades', () => {
  const metrics = calculateTradeMetrics(mockTrades);

  assert.equal(metrics.totalTrades, 3);
  assert.equal(metrics.winCount, 1);
  assert.equal(metrics.lossCount, 1);
  assert.equal(metrics.breakevenCount, 1);
  assert.equal(metrics.netPnl, 50); // 100 - 50 + 0 = 50
  assert.equal(metrics.winRate, 33.33); // 1 / 3
  assert.equal(metrics.avgWin, 100);
  assert.equal(metrics.avgLoss, 50);
  assert.equal(metrics.profitFactor, 2); // 100 / 50
  assert.equal(metrics.winLossRatio, 2); // 100 / 50
  assert.equal(metrics.totalFees, 6);
  assert.equal(metrics.mostFrequentMistake, 'FOMO');
  assert.equal(metrics.totalMistakeCost, 50);
});

test('calculateTradeMetrics handles empty trade array safely', () => {
  const metrics = calculateTradeMetrics([]);
  assert.equal(metrics.totalTrades, 0);
  assert.equal(metrics.netPnl, 0);
  assert.equal(metrics.winRate, 0);
  assert.equal(metrics.profitFactor, 0);
});

test('calculateEquityCurve tracks cumulative P&L in chronological sequence', () => {
  const curve = calculateEquityCurve(mockTrades);
  assert.equal(curve.length, 3);
  assert.equal(curve[0].cumulativePnl, 100);
  assert.equal(curve[1].cumulativePnl, 50); // 100 - 50
  assert.equal(curve[2].cumulativePnl, 50); // 50 + 0
});

test('aggregateDailyStats groups trades by calendar day', () => {
  const daily = aggregateDailyStats(mockTrades);
  assert.ok(daily['2026-10-01']);
  assert.equal(daily['2026-10-01'].netPnl, 100);
  assert.equal(daily['2026-10-01'].tradeCount, 1);
  assert.ok(daily['2026-10-02']);
  assert.equal(daily['2026-10-02'].netPnl, -50);
});

test('calculateSetupAnalysis groups properly by setup name', () => {
  const setups = calculateSetupAnalysis(mockTrades);
  const breakout = setups.find(s => s.setup === 'Breakout');
  assert.ok(breakout);
  assert.equal(breakout.tradeCount, 2);
  assert.equal(breakout.netPnl, 50);
});

test('calculateAssetAnalysis groups by instrument asset class', () => {
  const assets = calculateAssetAnalysis(mockTrades);
  const stocks = assets.find(a => a.assetClass === 'STOCKS');
  assert.ok(stocks);
  assert.equal(stocks.tradeCount, 2);
  assert.equal(stocks.netPnl, 50);
});

test('formatCurrency formats positive, negative and zero amounts with proper symbols', () => {
  assert.equal(formatCurrency(1250.5), '+$1,250.50');
  assert.equal(formatCurrency(-350.25), '-$350.25');
  assert.equal(formatCurrency(0), '$0.00');
  assert.equal(formatCurrency(-1202, false, 0), '-$1,202');
  assert.equal(formatCurrency(14418, false, 0), '$14,418');
});

test('calculateAccountPerformance computes per-account statistics accurately', () => {
  const accounts: TradingAccount[] = [
    {
      id: 'acc1',
      userId: 'user1',
      name: 'Prop Account',
      accountType: 'PROP_FIRM',
      startingBalance: 50000,
      currency: 'USD'
    },
    {
      id: 'acc2',
      userId: 'user1',
      name: 'Cash Equities',
      accountType: 'CASH',
      startingBalance: 10000,
      currency: 'USD'
    }
  ];

  const tradesWithAccounts: Trade[] = [
    { ...mockTrades[0], accountId: 'acc1' }, // Net P&L: 100
    { ...mockTrades[1], accountId: 'acc1' }, // Net P&L: -50
    { ...mockTrades[2], accountId: 'acc2' }  // Net P&L: 0
  ];

  const results = calculateAccountPerformance(accounts, tradesWithAccounts);
  assert.equal(results.length, 2);

  const acc1Perf = results.find(r => r.account.id === 'acc1');
  assert.ok(acc1Perf);
  assert.equal(acc1Perf.tradeCount, 2);
  assert.equal(acc1Perf.netPnl, 50);
  assert.equal(acc1Perf.winRate, 50);
  assert.equal(acc1Perf.currentBalance, 50050);
  assert.equal(acc1Perf.profitFactor, 2);

  const acc2Perf = results.find(r => r.account.id === 'acc2');
  assert.ok(acc2Perf);
  assert.equal(acc2Perf.tradeCount, 1);
  assert.equal(acc2Perf.netPnl, 0);
  assert.equal(acc2Perf.currentBalance, 10000);
});

test('convertCurrency accurately converts between USD and INR', async () => {
  const { convertCurrency, DEFAULT_USD_INR_RATE } = await import('./tradeMetrics');

  // USD to INR
  assert.equal(convertCurrency(100, 'USD', 'INR', 86.5), 8650);
  assert.equal(convertCurrency(1, 'USD', 'INR', 86.5), 86.5);

  // INR to USD
  assert.equal(convertCurrency(8650, 'INR', 'USD', 86.5), 100);
  assert.equal(convertCurrency(86.5, 'INR', 'USD', 86.5), 1);

  // Same currency
  assert.equal(convertCurrency(500, 'USD', 'USD'), 500);
  assert.equal(convertCurrency(50000, 'INR', 'INR'), 50000);
  assert.equal(convertCurrency(0, 'USD', 'INR'), 0);
});

test('normalizeTrade and normalizeTrades convert mixed portfolio to target currency', async () => {
  const { normalizeTrades, calculateTradeMetrics } = await import('./tradeMetrics');

  const mixedTrades: Trade[] = [
    {
      id: 't_usd',
      userId: 'u1',
      symbol: 'AAPL',
      side: 'LONG',
      assetClass: 'STOCKS',
      entryDate: '2026-10-01',
      entryPrice: 150,
      quantity: 10,
      netPnl: 100, // $100 USD
      currency: 'USD',
      status: 'WIN'
    },
    {
      id: 't_inr',
      userId: 'u1',
      symbol: 'RELIANCE',
      side: 'LONG',
      assetClass: 'STOCKS',
      entryDate: '2026-10-02',
      entryPrice: 3000,
      quantity: 50,
      netPnl: 8650, // ₹8,650 INR (= $100 USD at 86.50 rate)
      currency: 'INR',
      status: 'WIN'
    }
  ];

  // Normalized to USD: total P&L should be 100 + (8650 / 86.5) = $200
  const normalizedToUSD = normalizeTrades(mixedTrades, 'USD', 86.5);
  const usdMetrics = calculateTradeMetrics(normalizedToUSD);
  assert.equal(usdMetrics.netPnl, 200);

  // Normalized to INR: total P&L should be (100 * 86.5) + 8650 = ₹17,300
  const normalizedToINR = normalizeTrades(mixedTrades, 'INR', 86.5);
  const inrMetrics = calculateTradeMetrics(normalizedToINR);
  assert.equal(inrMetrics.netPnl, 17300);
});

test('formatCurrency handles INR with rupee symbol and Indian number system formatting', () => {
  assert.equal(formatCurrency(150000, true, 2, 'INR'), '+₹1,50,000.00');
  assert.equal(formatCurrency(-25000, true, 2, 'INR'), '-₹25,000.00');
  assert.equal(formatCurrency(0, true, 2, 'INR'), '₹0.00');
  assert.equal(formatCurrency(100, true, 2, 'USD'), '+$100.00');
});


