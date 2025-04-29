import axios from 'axios';
import logger from './logger';

// Базовий URL API v4
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://open-api-v4.coinglass.com";
const API_KEY = import.meta.env.VITE_API_KEY || "";

// Налаштування логування запитів і відповідей
const IS_DEBUG = import.meta.env.VITE_DEBUG === 'true' || false;

// Ендпоінти API
const ENDPOINTS = {
  // Поточні ставки фандингу по біржах
  FUNDING_RATES: "/api/futures/funding-rate/exchange-list",
  
  // Ринкові дані для ф'ючерсних монет (ціна, ліквідність, об'єм торгів)
  COINS_MARKETS: "/api/futures/coins-markets",
  
  // Історичні дані фандингу (якщо потрібно в майбутньому)
  HISTORICAL_FUNDING: "/api/futures/funding-rate/chart",
};

/**
 * Функція для створення конфігурації запитів
 * @returns {Object} Конфігурація для axios
 */
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
 * @returns {Promise<Array>} Масив об'єктів з даними про фандинг
 */
export const fetchFundingRates = async () => {
  const endpoint = ENDPOINTS.FUNDING_RATES;
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    if (!API_KEY) {
      const error = new Error('API-ключ не надано');
      logger.error('Відсутній API-ключ для CoinGlass', error);
      throw error;
    }
    
    logger.debug(`Запит фандинг ставок з ${url}`);
    const startTime = performance.now();
    
    const response = await axios.get(url, createRequestConfig());
    
    const endTime = performance.now();
    logger.debug(`Відповідь отримана за ${(endTime - startTime).toFixed(2)}ms`);
    
    if (IS_DEBUG) {
      logger.debug('Відповідь API:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data
      });
    }

    if (response.data && response.data.code === "0" && response.data.data) {
      const formattedData = formatFundingData(response.data.data);
      logger.info(`Отримано ${formattedData.length} записів про фандинг`);
      return formattedData;
    }
    
    const errorMsg = 'Неправильний формат відповіді API';
    logger.error(errorMsg, response.data);
    throw new Error(errorMsg);
  } catch (error) {
    logger.apiError('Помилка отримання даних про фандинг', error, endpoint);
    throw error;
  }
};

/**
 * Отримання ринкових даних для монет (ціна, ліквідність, об'єм)
 * @param {string} symbol - Символ криптовалюти (опціонально)
 * @returns {Promise<Array>} Масив об'єктів з ринковими даними
 */
export const fetchCoinsMarkets = async (symbol = '') => {
  const endpoint = ENDPOINTS.COINS_MARKETS + (symbol ? `?symbol=${symbol}` : '');
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    if (!API_KEY) {
      const error = new Error('API-ключ не надано');
      logger.error('Відсутній API-ключ для CoinGlass', error);
      throw error;
    }
    
    logger.debug(`Запит ринкових даних з ${url}`);
    const startTime = performance.now();
    
    const response = await axios.get(url, createRequestConfig());
    
    const endTime = performance.now();
    logger.debug(`Відповідь отримана за ${(endTime - startTime).toFixed(2)}ms`);
    
    if (IS_DEBUG) {
      logger.debug('Відповідь API:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });
    }
    
    if (response.data && response.data.code === "0" && response.data.data) {
      logger.info(`Отримано ринкові дані${symbol ? ` для ${symbol}` : ''}`);
      return response.data.data;
    }
    
    const errorMsg = 'Неправильний формат відповіді API для ринкових даних';
    logger.error(errorMsg, response.data);
    throw new Error(errorMsg);
  } catch (error) {
    logger.apiError('Помилка отримання ринкових даних', error, endpoint, { symbol });
    throw error;
  }
};

/**
 * Отримання історичних даних фандингу
 * @param {string} symbol - Символ криптовалюти 
 * @param {string} exchange - Назва біржі
 * @param {number} days - Кількість днів для історії (за замовчуванням 7)
 * @returns {Promise<Object>} Дані історії фандингу
 */
export const fetchHistoricalFunding = async (symbol, exchange, days = 7) => {
  const params = { symbol, exchange, days };
  const endpoint = `${ENDPOINTS.HISTORICAL_FUNDING}?symbol=${symbol}&exchange=${exchange}&days=${days}`;
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    if (!API_KEY) {
      const error = new Error('API-ключ не надано');
      logger.error('Відсутній API-ключ для CoinGlass', error);
      throw error;
    }
    
    logger.debug(`Запит історичних даних фандингу з ${url}`, params);
    const startTime = performance.now();
    
    const response = await axios.get(url, createRequestConfig());
    
    const endTime = performance.now();
    logger.debug(`Відповідь отримана за ${(endTime - startTime).toFixed(2)}ms`);
    
    if (response.data && response.data.code === "0" && response.data.data) {
      logger.info(`Отримано історичні дані фандингу для ${symbol} на ${exchange}`);
      return response.data.data;
    }
    
    const errorMsg = 'Неправильний формат відповіді API для історичних даних фандингу';
    logger.error(errorMsg, response.data);
    throw new Error(errorMsg);
  } catch (error) {
    logger.apiError('Помилка отримання історичних даних фандингу', error, endpoint, params);
    throw error;
  }
};

/**
 * Форматування даних з API для використання в додатку
 * @param {Array} data - Дані з API 
 * @returns {Array} Відформатовані дані у форматі, придатному для додатку
 */
const formatFundingData = (data) => {
  try {
    logger.debug('Початок форматування даних фандингу', { 
      dataLength: data.length,
      sample: data.length > 0 ? data[0] : null 
    });
    
    const result = data.map(item => {
      // Базова інформація про символ
      const resultItem = {
        symbol: item.symbol,
      };
      
      // Збираємо всі ставки фандингу з різних бірж
      const exchangeRates = {};
      
      // Додаємо ставки з stablecoin_margin_list (USDT/USD)
      if (item.stablecoin_margin_list && item.stablecoin_margin_list.length > 0) {
        item.stablecoin_margin_list.forEach(exchange => {
          const exchangeName = exchange.exchange.toLowerCase();
          exchangeRates[exchangeName] = exchange.funding_rate;
          
          // Додаємо наступний час фандингу
          if (exchange.next_funding_time) {
            exchangeRates[`${exchangeName}NextFundingTime`] = exchange.next_funding_time;
          }
          
          // Додаємо інформацію про інтервал фандингу (в годинах)
          if (exchange.funding_rate_interval) {
            exchangeRates[`${exchangeName}Interval`] = exchange.funding_rate_interval;
          }
        });
      }
      
      // Додаємо ставки з token_margin_list (coin-margined)
      if (item.token_margin_list && item.token_margin_list.length > 0) {
        item.token_margin_list.forEach(exchange => {
          const exchangeName = exchange.exchange.toLowerCase();
          // Для розрізнення coin-margined додаємо суфікс
          exchangeRates[`${exchangeName}Coin`] = exchange.funding_rate;
          
          if (exchange.next_funding_time) {
            exchangeRates[`${exchangeName}CoinNextFundingTime`] = exchange.next_funding_time;
          }
        });
      }
      
      // Додаємо інформацію про ціну, якщо вона є
      if (item.index_price) {
        resultItem.indexPrice = item.index_price;
      }
      
      // Обчислюємо середню ставку фандингу для сортування і фільтрації
      const rates = [];
      
      for (const key in exchangeRates) {
        if (!key.includes('NextFundingTime') && 
            !key.includes('Interval') && 
            !key.includes('Coin')) {
          const rate = exchangeRates[key];
          if (rate !== undefined && rate !== null && rate !== '-') {
            rates.push(parseFloat(rate));
          }
        }
      }
      
      const fundingRate = rates.length > 0 
        ? rates.reduce((acc, rate) => acc + rate, 0) / rates.length 
        : 0;
      
      // Об'єднуємо всі дані
      return {
        ...resultItem,
        ...exchangeRates,
        fundingRate
      };
    });
    
    logger.debug('Завершено форматування даних фандингу', { 
      resultLength: result.length 
    });
    
    return result;
  } catch (error) {
    logger.error('Помилка під час форматування даних фандингу', error);
    throw new Error(`Помилка форматування даних: ${error.message}`);
  }
};

export default {
  fetchFundingRates,
  fetchCoinsMarkets,
  fetchHistoricalFunding
};