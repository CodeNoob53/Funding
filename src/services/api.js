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
    },
    // Додаємо таймаут для запитів
    timeout: 15000
  };
};

/**
 * Отримання поточних ставок фандингу по всіх біржах
 */
export const fetchFundingRates = async () => {
  try {
    if (!API_KEY) {
      console.error('API-ключ не надано. Перевірте файл .env або змінні середовища.');
      throw new Error('API-ключ не надано');
    }
    
    // Виводимо URL для дебагу
    const url = `${API_BASE_URL}${ENDPOINTS.FUNDING_RATES}`;
    console.log(`Виконуємо запит до: ${url}`);
    
    const response = await axios.get(url, createRequestConfig());

    // Перевіряємо наявність даних та структуру відповіді
    if (!response.data) {
      console.error('API повернув порожню відповідь');
      throw new Error('Порожня відповідь від API');
    }
    
    if (!response.data.success) {
      console.error('API повернув помилку:', response.data);
      throw new Error(response.data.message || 'API повернув помилку');
    }
    
    if (!response.data.data || Object.keys(response.data.data).length === 0) {
      console.error('API повернув пусті дані:', response.data);
      throw new Error('Отримано порожній список даних від API');
    }
    
    // Форматуємо та повертаємо дані
    const formattedData = formatFundingData(response.data.data);
    console.log(`Отримано ${formattedData.length} записів з API`);
    return formattedData;
    
  } catch (error) {
    // Детальний лог помилки для дебагу
    if (error.response) {
      // Сервер відповів з кодом помилки
      console.error('Помилка відповіді API:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
    } else if (error.request) {
      // Запит був зроблений, але відповіді не отримано
      console.error('Немає відповіді від сервера:', error.request);
    } else {
      // Щось пішло не так при налаштуванні запиту
      console.error('Помилка запиту:', error.message);
    }
    
    // Додатково перевіряємо часті причини помилок
    if (error.message.includes('Network Error')) {
      console.error('Помилка мережі. Перевірте підключення до інтернету або CORS налаштування.');
    } else if (error.message.includes('timeout')) {
      console.error('Запит перевищив часовий ліміт.');
    } else if (error.response && error.response.status === 401) {
      console.error('Неавторизований доступ. Перевірте API-ключ.');
    } else if (error.response && error.response.status === 403) {
      console.error('Доступ заборонено. Перевірте права доступу для API-ключа.');
    } else if (error.response && error.response.status === 429) {
      console.error('Перевищено ліміт запитів API.');
    }
    
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
      console.error('API-ключ не надано');
      throw new Error('API-ключ не надано');
    }
    
    if (!symbol) {
      console.error('Символ монети не вказано');
      throw new Error('Символ монети не вказано');
    }
    
    const url = `${API_BASE_URL}${ENDPOINTS.CUMULATIVE_FUNDING}?symbol=${symbol}&days=${days}`;
    console.log(`Виконуємо запит до: ${url}`);
    
    const response = await axios.get(url, createRequestConfig());
    
    if (!response.data || !response.data.success || !response.data.data) {
      console.error('Неправильний формат відповіді API:', response.data);
      throw new Error('Неправильний формат відповіді API');
    }
    
    return response.data.data;
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
      console.error('API-ключ не надано');
      throw new Error('API-ключ не надано');
    }
    
    const url = `${API_BASE_URL}${ENDPOINTS.COINS_MARKETS}${symbol ? `?symbol=${symbol}` : ''}`;
    console.log(`Виконуємо запит до: ${url}`);
    
    const response = await axios.get(url, createRequestConfig());
    
    if (!response.data || !response.data.success || !response.data.data) {
      console.error('Неправильний формат відповіді API:', response.data);
      throw new Error('Неправильний формат відповіді API');
    }
    
    return response.data.data;
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
      console.error('API-ключ не надано');
      throw new Error('API-ключ не надано');
    }
    
    const url = `${API_BASE_URL}${ENDPOINTS.SUPPORTED_EXCHANGES_PAIRS}${symbol ? `?symbol=${symbol}` : ''}`;
    console.log(`Виконуємо запит до: ${url}`);
    
    const response = await axios.get(url, createRequestConfig());
    
    if (!response.data || !response.data.success || !response.data.data) {
      console.error('Неправильний формат відповіді API:', response.data);
      throw new Error('Неправильний формат відповіді API');
    }
    
    return response.data.data;
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
      console.error('API-ключ не надано');
      throw new Error('API-ключ не надано');
    }
    
    if (!symbol || !exchange) {
      console.error('Не вказано символ або біржу');
      throw new Error('Не вказано символ або біржу');
    }
    
    const url = `${API_BASE_URL}${ENDPOINTS.ORDER_BOOK}?symbol=${symbol}&exchange=${exchange}`;
    console.log(`Виконуємо запит до: ${url}`);
    
    const response = await axios.get(url, createRequestConfig());
    
    if (!response.data || !response.data.success || !response.data.data) {
      console.error('Неправильний формат відповіді API:', response.data);
      throw new Error('Неправильний формат відповіді API');
    }
    
    return response.data.data;
  } catch (error) {
    console.error(`Помилка отримання книги ордерів для ${symbol} на біржі ${exchange}:`, error);
    throw error;
  }
};

// Форматування даних з API для використання в додатку
const formatFundingData = (data) => {
  try {
    console.log('Форматування даних про фандинг...');
    
    // Перевіряємо, чи data є об'єктом
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      console.error('Неправильний формат вхідних даних:', data);
      throw new Error('Неправильний формат вхідних даних');
    }
    
    // Конвертуємо об'єкт у масив для легшої фільтрації
    const result = Object.values(data).map(item => {
      if (!item || !item.symbol) {
        console.warn('Знайдено елемент без символу:', item);
        return null; // Пропускаємо елементи без символу
      }
      
      const formattedItem = {
        symbol: item.symbol,
        indexPrice: item.usdPrice || item.indexPrice || 0
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
      const resultItem = {
        ...formattedItem,
        ...exchangeRates,
        // Обчислюємо середній фандинг для сортування і фільтрації
        fundingRate: calculateAverageFunding(item)
      };
      
      return resultItem;
    }).filter(Boolean); // Видаляємо null елементи
    
    console.log(`Сформатовано ${result.length} елементів`);
    return result;
  } catch (error) {
    console.error('Помилка форматування даних:', error);
    throw error;
  }
};

// Обчислюємо середній фандинг для криптовалюти
const calculateAverageFunding = (item) => {
  try {
    // Збираємо всі доступні ставки фандингу з різних бірж
    const rates = [];
    Object.keys(item).forEach(key => {
      if (key.includes('FundingRate') && key !== 'nextFundingRate') {
        const rate = item[key];
        if (rate !== undefined && rate !== null && rate !== '-') {
          const parsedRate = parseFloat(rate);
          if (!isNaN(parsedRate)) {
            rates.push(parsedRate);
          }
        }
      }
    });
    
    if (rates.length === 0) return 0;
    
    const sum = rates.reduce((acc, rate) => acc + rate, 0);
    return sum / rates.length;
  } catch (error) {
    console.error('Помилка обчислення середнього фандингу:', error);
    return 0; // Повертаємо 0 у випадку помилки
  }
};