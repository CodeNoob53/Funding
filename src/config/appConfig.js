// src/config/appConfig.js
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || '0.2.0';

// Налаштування для бази даних та локального сховища
export const STORAGE_KEYS = {
  FILTERS: 'funding-calculator-filter-settings',
  THEME: 'theme-storage',
  USER_PREFERENCES: 'user-preferences'
};

// Дефолтні налаштування додатку
export const DEFAULT_SETTINGS = {
  // Налаштування фільтрів
  filters: {
    enabled: true,

    // minFundingRate: 0.15
    // Мінімальна ставка фандингу для відображення
    // Якщо ставка фандингу менша за цю, вона не відображається
    minFundingRate: 0.15,

    // rateSignFilter: 'all' | 'positive' | 'negative'
    // 'all' - всі ставки, 'positive' - позитивні ставки, 'negative' - негативні ставки
    rateSignFilter: 'all',

    // displayMode: 'option1' | 'option2'
    // 'option1' - всі біржі (якщо ≥ на одній), 'option2' - тільки біржі ≥ значення
    displayMode: 'option1',

    // fundingInterval: 'all' | '8h' | '1h' | 'perpetual'
    // 'all' - всі інтервали, '8h' - 8-годинний інтервал, '1h' - 1-годинний інтервал, 'perpetual' - постійний
    fundingInterval: 'all',

    // statusFilter: 'all' | 'active' | 'inactive'
    // 'all' - всі статуси, 'active' - активні ставки, 'inactive' - неактивні ставки
    statusFilter: 'all',

    // sortBy: 'exchanges' | 'fundingRate' | 'symbol' | 'bestFR'
    // 'exchanges' - кількість бірж, 'fundingRate' - середня ставка, 'symbol' - символ (A-Z), 'bestFR' - найкраща ставка
    sortBy: 'exchanges',

    // sortOrder: 'asc' | 'desc'
    // 'asc' - зростання, 'desc' - спадання
    sortOrder: 'asc',

    // exchangeSortBy: 'name' | 'tokens' | 'bestFR'
    // 'name' - назва біржі (A-Z), 'tokens' - кількість токенів, 'bestFR' - найкраща ставка
    exchangeSortBy: 'tokens',

    // exchangeSortOrder: 'asc' | 'desc'
    // 'asc' - зростання, 'desc' - спадання
    exchangeSortOrder: 'asc',
    
    // Налаштування видимості бірж для різних типів маржі
    selectedExchanges: {},
    
    // Активні біржі для USD Margined (Stablecoin)
    stablecoinExchanges: {
      binance: true,
      okx: true,
      dydx: false,
      bybit: true,
      vertex: true,
      bitget: true,
      coinex: false,
      bitfinex: false,
      kraken: false,
      htx: false,
      bingx: true,
      gateio: true,
      cryptocom: true,
      coinbase: false,
      hyperliquid: false,
      bitunix: true,
      mexc: true,
      whitebit: true
    },
    
    // Активні біржі для Token Margined
    tokenExchanges: {
      binance: true,
      okx: true,
      bitmex: false,
      bybit: true,
      deribit: false,
      coinex: false,
      kraken: false,
      htx: false
    }
  },

  // Налаштування калькулятора
  // дефолтні значення для калькулятора
  calculator: {
    
    // дефолтне значення комісія для суми інвестицій
    defaultOpenFee: 0.04,
    // дефолтне значення комісія для закриття позиції
    defaultCloseFee: 0.04,
    defaultLeverage: 10
  },
  
  // Загальні налаштування
  general: {
    autoRefreshInterval: 20000, // 20 секунд
    preferredLanguage: 'uk',
    theme: 'dark'
  }
};

// Налаштування API та ендпоінтів
export const API_CONFIG = {
  ENDPOINTS: {
    FUNDING_RATES: "/funding-rates",
    COINS_MARKETS: "/coins-markets",
    HISTORICAL_FUNDING: "/historical-funding"
  },
  
  CACHE_EXPIRY: {
    FUNDING_DATA: 20000 // 20 секунд
  }
};

// Налаштування інтерфейсу
export const UI_CONFIG = {
  MAX_VISIBLE_TOKENS: 50,
  TOKENS_LOAD_STEP: 20
};