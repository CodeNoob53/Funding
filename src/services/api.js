import axios from 'axios';
import logger from './logger';

// Визначаємо API URL залежно від середовища
const isProduction = import.meta.env.PROD;
const isLocalDev = import.meta.env.DEV;

// Для продакшн використовуємо локальний проксі
const API_URL = isProduction 
  ? '/api/proxy' 
  : isLocalDev 
    ? 'http://localhost:3001/api/proxy'
    : '/api/proxy';

// Ендпоінти API
const ENDPOINTS = {
  // Поточні ставки фандингу по біржах
  FUNDING_RATES: "/funding-rates",
  
  // Ринкові дані для ф'ючерсних монет
  COINS_MARKETS: "/coins-markets",
  
  // Історичні дані фандингу
  HISTORICAL_FUNDING: "/historical-funding",
};

// Налаштування логування запитів і відповідей
const IS_DEBUG = import.meta.env.VITE_DEBUG === 'true' || false;

/**
 * Отримання поточних ставок фандингу по всіх біржах
 * @returns {Promise<Array>} Масив об'єктів з даними про фандинг
 */
export const fetchFundingRates = async () => {
  const endpoint = ENDPOINTS.FUNDING_RATES;
  const url = `${API_URL}${endpoint}`;
  
  try {
    logger.debug(`Запит фандинг ставок з ${url}`);
    const startTime = performance.now();
    
    const response = await axios.get(url);
    
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
 * Отримання ринкових даних для монет
 * @param {string} symbol - Символ криптовалюти (опціонально)
 * @returns {Promise<Array>} Масив об'єктів з ринковими даними
 */
export const fetchCoinsMarkets = async (symbol = '') => {
  const endpoint = `${ENDPOINTS.COINS_MARKETS}${symbol ? `?symbol=${symbol}` : ''}`;
  const url = `${API_URL}${endpoint}`;
  
  try {
    logger.debug(`Запит ринкових даних з ${url}`);
    const startTime = performance.now();
    
    const response = await axios.get(url);
    
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
  const url = `${API_URL}${endpoint}`;
  
  try {
    logger.debug(`Запит історичних даних фандингу з ${url}`, params);
    const startTime = performance.now();
    
    const response = await axios.get(url);
    
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
      // Збираємо списки для stablecoin і token margin
      const stablecoinMarginList = [];
      const tokenMarginList = [];

      // Обробка stablecoin_margin_list
      if (Array.isArray(item.stablecoin_margin_list)) {
        item.stablecoin_margin_list.forEach(exchange => {
          if (exchange.exchange) {
            stablecoinMarginList.push({
              exchange: exchange.exchange,
              funding_rate: parseFloat(exchange.funding_rate) || 0,
              funding_rate_interval: exchange.funding_rate_interval || 8,
              next_funding_time: exchange.next_funding_time || null,
            });
          }
        });
      }

      // Обробка token_margin_list
      if (Array.isArray(item.token_margin_list)) {
        item.token_margin_list.forEach(exchange => {
          if (exchange.exchange) {
            tokenMarginList.push({
              exchange: exchange.exchange,
              funding_rate: parseFloat(exchange.funding_rate) || 0,
              funding_rate_interval: exchange.funding_rate_interval || 8,
              next_funding_time: exchange.next_funding_time || null,
            });
          }
        });
      }

      // Обчислюємо середню ставку фандингу для сортування і фільтрації
      const rates = [
        ...stablecoinMarginList.map(entry => entry.funding_rate),
        ...tokenMarginList.map(entry => entry.funding_rate),
      ].filter(rate => rate !== undefined && rate !== null && !isNaN(rate));

      const fundingRate = rates.length > 0 
        ? rates.reduce((acc, rate) => acc + rate, 0) / rates.length 
        : 0;

      // Повертаємо об'єкт у форматі, сумісному з FundingSection
      return {
        symbol: item.symbol || 'UNKNOWN',
        stablecoin_margin_list: stablecoinMarginList,
        token_margin_list: tokenMarginList,
        indexPrice: item.index_price || null,
        fundingRate,
      };
    });
    
    logger.debug('Завершено форматування даних фандингу', { 
      resultLength: result.length,
      sample: result.length > 0 ? result[0] : null
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