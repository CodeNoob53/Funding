import axios from 'axios';

// Базовий URL API v4
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://open-api-v4.coinglass.com";
const API_KEY = import.meta.env.VITE_API_KEY || "";

// Ендпоінти API
const ENDPOINTS = {
  // Поточні ставки фандингу по біржах
  FUNDING_RATES: "/api/futures/fundingRate/exchange-list",
  
  // Кумулятивні ставки фандингу за період
  CUMULATIVE_FUNDING: "/api/futures/fundingRate/cumulative-exchange-list",
  
  // Ринкові дані для ф'ючерсних монет (ціна, ліквідність, об'єм торгів)
  COINS_MARKETS: "/api/futures/coins-markets",
  
  // Підтримувані біржі та торгові пари
  SUPPORTED_EXCHANGES_PAIRS: "/api/futures/supported-exchange-and-pairs",
  
  // Поточні ордери для аналізу глибини ринку
  ORDER_BOOK: "/api/futures/orderbook/bid-ask"
};

// Функція для створення конфігурації запитів
const createRequestConfig = () => {
  return {
    headers: {
      'accept': 'application/json',
      'CG-API-KEY': API_KEY
    }
  };
};

/**
 * Отримання поточних ставок фандингу по всіх біржах
 */
export const fetchFundingRates = async () => {
  try {
    if (!API_KEY) {
      throw new Error('API-ключ не надано');
    }
    
    const response = await axios.get(`${API_BASE_URL}${ENDPOINTS.FUNDING_RATES}`, createRequestConfig());

    if (response.data && response.data.success && response.data.data) {
      return formatFundingData(response.data.data);
    }
    
    throw new Error('Неправильний формат відповіді API');
  } catch (error) {
    console.error('Помилка отримання даних про фандинг:', error);
    throw error;
  }
};

/**
 * Отримання кумулятивних ставок фандингу за період
 * @param {string} symbol - Символ криптовалюти (наприклад, "BTC")
 * @param {number} days - Кількість днів для аналізу (за замовчуванням 7)
 */
export const fetchCumulativeFunding = async (symbol, days = 7) => {
  try {
    if (!API_KEY) {
      throw new Error('API-ключ не надано');
    }
    
    const url = `${API_BASE_URL}${ENDPOINTS.CUMULATIVE_FUNDING}?symbol=${symbol}&days=${days}`;
    const response = await axios.get(url, createRequestConfig());
    
    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error('Неправильний формат відповіді API для кумулятивного фандингу');
  } catch (error) {
    console.error(`Помилка отримання кумулятивного фандингу для ${symbol}:`, error);
    throw error;
  }
};

/**
 * Отримання ринкових даних для монет (ціна, ліквідність, об'єм)
 * @param {string} symbol - Символ криптовалюти (опціонально)
 */
export const fetchCoinsMarkets = async (symbol = '') => {
  try {
    if (!API_KEY) {
      throw new Error('API-ключ не надано');
    }
    
    const url = `${API_BASE_URL}${ENDPOINTS.COINS_MARKETS}${symbol ? `?symbol=${symbol}` : ''}`;
    const response = await axios.get(url, createRequestConfig());
    
    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error('Неправильний формат відповіді API для ринкових даних');
  } catch (error) {
    console.error('Помилка отримання ринкових даних:', error);
    throw error;
  }
};

/**
 * Отримання підтримуваних бірж і торгових пар
 * @param {string} symbol - Символ криптовалюти (опціонально)
 */
export const fetchSupportedExchangesAndPairs = async (symbol = '') => {
  try {
    if (!API_KEY) {
      throw new Error('API-ключ не надано');
    }
    
    const url = `${API_BASE_URL}${ENDPOINTS.SUPPORTED_EXCHANGES_PAIRS}${symbol ? `?symbol=${symbol}` : ''}`;
    const response = await axios.get(url, createRequestConfig());
    
    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error('Неправильний формат відповіді API для підтримуваних бірж і пар');
  } catch (error) {
    console.error('Помилка отримання підтримуваних бірж і пар:', error);
    throw error;
  }
};

/**
 * Отримання книги ордерів для аналізу глибини ринку
 * @param {string} symbol - Символ криптовалюти
 * @param {string} exchange - Назва біржі (наприклад, "binance")
 */
export const fetchOrderBook = async (symbol, exchange) => {
  try {
    if (!API_KEY) {
      throw new Error('API-ключ не надано');
    }
    
    const url = `${API_BASE_URL}${ENDPOINTS.ORDER_BOOK}?symbol=${symbol}&exchange=${exchange}`;
    const response = await axios.get(url, createRequestConfig());
    
    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error('Неправильний формат відповіді API для книги ордерів');
  } catch (error) {
    console.error(`Помилка отримання книги ордерів для ${symbol} на біржі ${exchange}:`, error);
    throw error;
  }
};

// Форматування даних з API для використання в додатку
const formatFundingData = (data) => {
  // Конвертуємо об'єкт у масив для легшої фільтрації
  return Object.values(data).map(item => {
    const formattedItem = {
      symbol: item.symbol,
      indexPrice: item.usdPrice || item.indexPrice
    };
    
    // Додаємо всі наявні фандинг-ставки з API
    const exchangeRates = {};
    
    // Додаємо всі доступні біржі та їх ставки
    Object.keys(item).forEach(key => {
      if (key.includes('FundingRate') && key !== 'nextFundingRate') {
        // Парсимо назву біржі з ключа (наприклад, binanceFundingRate -> binance)
        const exchangeName = key.replace('FundingRate', '');
        exchangeRates[exchangeName] = item[key];
      }
    });
    
    // Об'єднуємо дані
    const result = {
      ...formattedItem,
      ...exchangeRates,
      // Обчислюємо середній фандинг для сортування і фільтрації
      fundingRate: calculateAverageFunding(item)
    };
    
    return result;
  });
};

// Обчислюємо середній фандинг для криптовалюти
const calculateAverageFunding = (item) => {
  // Збираємо всі доступні ставки фандингу з різних бірж
  const rates = [];
  Object.keys(item).forEach(key => {
    if (key.includes('FundingRate') && key !== 'nextFundingRate') {
      const rate = item[key];
      if (rate !== undefined && rate !== null && rate !== '-') {
        rates.push(parseFloat(rate));
      }
    }
  });
  
  if (rates.length === 0) return 0;
  
  const sum = rates.reduce((acc, rate) => acc + rate, 0);
  return sum / rates.length;
};