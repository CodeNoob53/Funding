// src/config/appConfig.js
export const STORAGE_KEYS = {
  USER_PREFERENCES: 'funding-calculator-preferences',
};

export const UI_CONFIG = {
  MAX_VISIBLE_TOKENS: 20,
  TOKENS_LOAD_STEP: 10,
};

export const DEFAULT_SETTINGS = {
  filters: {
    enabled: false,
    minFundingRate: 0.01,
    rateSignFilter: 'all',
    displayMode: 'option1',
    fundingInterval: 'all',
    statusFilter: 'all',
    sortBy: 'activeExchanges',
    sortOrder: 'desc',
    exchangeSortBy: 'name',
    exchangeSortOrder: 'asc',
    stablecoinExchanges: {
      'binance': true,
      'okx': true,
      'bitmex': true,
      'bybit': true,
      'deribit': true,
      'coinex': true,
      'kraken': true,
      'htx': true,
      'gate.io': true, // Оновлено
      'crypto.com': true, // Оновлено
    },
    tokenExchanges: {
      'binance': true,
      'okx': true,
      'dydx': true,
      'bybit': true,
      'vertex': true,
      'bitget': true,
      'coinex': true,
      'bitfinex': true,
      'kraken': true,
      'htx': true,
      'bingx': true,
      'gate.io': true, // Оновлено
      'crypto.com': true, // Оновлено
      'coinbase': true,
      'hyperliquid': true,
      'bitunix': true,
      'mexc': true,
      'whitebit': true,
    },
    selectedExchanges: {},
  },
};