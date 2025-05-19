// src/services/api.js
import axios from 'axios';
import logger from './logger';

// Визначаємо API URL залежно від середовища
const isProduction = import.meta.env.PROD;
const isLocalDev = import.meta.env.DEV;

// Для продакшн використовуємо локальний проксі
const API_URL = isProduction && import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL
  : isProduction 
    ? '/api/proxy' 
    : isLocalDev 
      ? 'http://localhost:3001/api/proxy'
      : '/api/proxy';

// Ендпоінти API
const ENDPOINTS = {
  // Ставки фандингу (узгоджено з сервером)
  FUNDING_RATES: "/funding-rates",
  
  // Ринкові дані для ф'ючерсних монет
  COINS_MARKETS: "/coins-markets",
  
  // Історичні дані фандингу
  HISTORICAL_FUNDING: "/historical-funding",
};

// Кешування даних
const fundingDataCache = {
  data: null,
  timestamp: null,
  expiryTime: 20000 // 20 секунд у мілісекундах
};

/**
 * Отримання поточних ставок фандингу по всіх біржах
 * @returns {Promise<Array>} Масив об'єктів з даними про фандинг
 */
export const fetchFundingRates = async () => {
  // Перевіряємо, чи є валідні дані в кеші
  const now = Date.now();
  if (fundingDataCache.data && fundingDataCache.timestamp && 
      (now - fundingDataCache.timestamp < fundingDataCache.expiryTime)) {
    logger.debug(`Використовуємо кешовані дані фандингу (${fundingDataCache.data.length} записів)`);
    return fundingDataCache.data;
  }
  
  const endpoint = ENDPOINTS.FUNDING_RATES;
  const url = `${API_URL}${endpoint}`;
  
  try {
    logger.debug(`Запит розширених фандинг ставок з ${url}`);
    const startTime = performance.now();
    
    const apiKey = import.meta.env.VITE_S_API_KEY;
    if (!apiKey) {
      throw new Error('API Key не визначено. Встановіть VITE_S_API_KEY у .env');
    }

    const headers = {
      's_api_key': apiKey, // Узгоджено з сервером
    };

    const response = await axios.get(url, { headers });
    
    const endTime = performance.now();
    logger.debug(`Відповідь отримана за ${(endTime - startTime).toFixed(2)}ms`);
    
    // Додаємо детальний лог структури відповіді для налагодження
    logger.debug('Структура відповіді:', {
      responseType: typeof response.data,
      isArray: Array.isArray(response.data),
      topLevelKeys: response.data && typeof response.data === 'object' && !Array.isArray(response.data) 
        ? Object.keys(response.data) 
        : null,
      firstItem: response.data && Array.isArray(response.data) && response.data.length > 0 
        ? Object.keys(response.data[0]) 
        : null,
      sampleData: response.data && Array.isArray(response.data) && response.data.length > 0 
        ? JSON.stringify(response.data[0]).substring(0, 500) 
        : null
    });

    // Визначаємо, яка структура відповіді
    let dataToFormat;
    
    if (Array.isArray(response.data)) {
      // Якщо відповідь - це вже масив
      logger.debug('Відповідь є масивом, використовуємо безпосередньо');
      dataToFormat = response.data;
    } else if (response.data && Array.isArray(response.data.data)) {
      // Якщо відповідь має вкладений масив data (стандартний формат API)
      logger.debug('Відповідь має вкладений масив data, використовуємо response.data.data');
      dataToFormat = response.data.data;
    } else {
      // Невідома структура
      logger.error('Невідома структура відповіді API:', response.data);
      throw new Error('Неправильний формат відповіді API: не вдалося знайти масив даних');
    }
    
    // Форматуємо дані
    const formattedData = formatExtendedFundingData(dataToFormat);
    
    // Зберігаємо дані в кеш
    fundingDataCache.data = formattedData;
    fundingDataCache.timestamp = now;
    
    // Додаємо дебаг-інформацію про перший токен
    if (formattedData.length > 0) {
      const firstToken = formattedData[0];
      logger.debug('Приклад форматованих даних:', {
        symbol: firstToken.symbol,
        hasSymbolLogo: !!firstToken.symbolLogo,
        stablecoinMarginCount: firstToken.stablecoin_margin_list?.length || 0,
        tokenMarginCount: firstToken.token_margin_list?.length || 0,
        sampleExchange: firstToken.stablecoin_margin_list?.length > 0 
          ? firstToken.stablecoin_margin_list[0] 
          : null
      });
    }
    
    return formattedData;
  } catch (error) {
    logger.apiError('Помилка отримання даних про фандинг', error, endpoint);
    throw error;
  }
};

/**
 * Форматування розширених даних з нового API для використання в додатку
 * @param {Array} responseData - Дані з API 
 * @returns {Array} Відформатовані дані у форматі, придатному для додатку
 */
const formatExtendedFundingData = (responseData) => {
  try {
    if (!responseData || !Array.isArray(responseData)) {
      logger.error('Неправильний формат даних від API', responseData);
      return [];
    }

    logger.debug('Початок форматування даних Coinglass', {
      dataLength: responseData.length,
      sample: responseData.length > 0 ? JSON.stringify(responseData[0]).substring(0, 500) : null
    });

    return responseData.map(item => {
      const {
        symbol,
        symbolLogo,
        uMarginList = [],
        cMarginList = [],
        uIndexPrice,
        uPrice
      } = item;

      const mapList = (list) =>
        list
          .filter(ex => ex.status === 1 || ex.status === 2)
          .map(ex => ({
            exchange: ex.exchangeName,
            funding_rate: typeof ex.rate === 'number' ? ex.rate : parseFloat(ex.rate) || 0,
            funding_rate_interval: ex.fundingIntervalHours || 8,
            next_funding_time: ex.nextFundingTime || null,
            predicted_rate: typeof ex.predictedRate === 'number'
              ? ex.predictedRate
              : parseFloat(ex.predictedRate) || null,
            price: ex.price || null,
            exchange_logo: ex.exchangeLogo || null,
            status: ex.status,
          }));

      const stablecoinMarginList = mapList(uMarginList);
      const tokenMarginList = mapList(cMarginList);

      const allRates = [...stablecoinMarginList, ...tokenMarginList]
        .map(e => e.funding_rate)
        .filter(rate => typeof rate === 'number' && !isNaN(rate));

      const fundingRate = allRates.length > 0
        ? allRates.reduce((acc, rate) => acc + rate, 0) / allRates.length
        : 0;

      const indexPrice = uIndexPrice ?? uPrice ?? null;

      return {
        symbol,
        symbolLogo,
        stablecoin_margin_list: stablecoinMarginList,
        token_margin_list: tokenMarginList,
        fundingRate,
        indexPrice,
      };
    });
  } catch (error) {
    logger.error('Помилка під час форматування розширених даних фандингу', error);
    throw new Error(`Помилка форматування даних: ${error.message}`);
  }
};