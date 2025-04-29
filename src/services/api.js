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
  
  // Історія ставок фандингу
  FUNDING_HISTORY: "/api/futures/funding-rate/history",
  
  // Ринкові дані для ф'ючерсних монет (ціна, ліквідність, об'єм торгів)
  COINS_MARKETS: "/api/futures/coins-markets",
  
  // Підтримувані біржі та торгові пари
  SUPPORTED_EXCHANGES_PAIRS: "/api/futures/supported-exchange-and-pairs",
  
  // Поточні ордери для аналізу глибини ринку
  ORDER_BOOK: "/api/futures/orderbook/bid-ask"
};

// Функція для створення конфігурації запитів
const createRequestConfig = () => {
  const config = {
    headers: {
      'accept': 'application/json',
      'CG-API-KEY': API_KEY
    }
  };
  
  console.log('🔑 Запит буде відправлено з API ключем:', API_KEY ? `${API_KEY.substring(0, 4)}...${API_KEY.substring(API_KEY.length - 4)}` : 'ВІДСУТНІЙ КЛЮЧ');
  
  return config;
};

/**
 * Тестовий запит для перевірки з'єднання з API
 */
export const testApiConnection = async () => {
  try {
    console.log('🧪 Тестування з\'єднання з API Coinglass...');
    console.log(`🌐 URL: ${API_BASE_URL}/api/futures/fundingRate/exchange-list`);
    
    if (!API_KEY) {
      console.error('❌ API ключ не надано! Запит буде відхилено.');
      return { success: false, error: 'API_KEY не надано' };
    }
    
    const startTime = Date.now();
    const response = await axios.get(`${API_BASE_URL}${ENDPOINTS.FUNDING_RATES}`, createRequestConfig());
    const endTime = Date.now();
    
    console.log(`⏱️ Час відповіді: ${endTime - startTime}ms`);
    console.log('📊 Структура відповіді:', Object.keys(response.data));
    
    if (response.data && response.data.success) {
      console.log('✅ Запит успішний!');
      console.log(`📈 Отримано дані для ${Object.keys(response.data.data).length} криптовалют`);
      
      // Виводимо приклад перших 2-х елементів
      const sampleKeys = Object.keys(response.data.data).slice(0, 2);
      console.log('📋 Зразок даних:');
      sampleKeys.forEach(key => {
        console.log(`- ${key}:`, response.data.data[key]);
      });
      
      return { success: true, data: response.data.data };
    } else {
      console.error('❌ Помилка в API відповіді:', response.data);
      return { success: false, error: response.data };
    }
  } catch (error) {
    console.error('❌ Помилка при тестуванні API:', error);
    
    // Виводимо детальну інформацію про помилку
    if (error.response) {
      console.error('📡 Статус відповіді:', error.response.status);
      console.error('📡 Заголовки відповіді:', error.response.headers);
      console.error('📡 Дані відповіді:', error.response.data);
    } else if (error.request) {
      console.error('📡 Запит був зроблений, але відповідь не отримана');
      console.error('📡 Деталі запиту:', error.request);
    } else {
      console.error('📡 Помилка при створенні запиту:', error.message);
    }
    
    return { success: false, error: error.toString(), details: error.response?.data };
  }
};

/**
 * Отримання поточних ставок фандингу по всіх біржах
 */
export const fetchFundingRates = async () => {
  try {
    console.log('📥 Отримання поточних ставок фандингу...');
    
    if (!API_KEY) {
      console.error('❌ API-ключ не надано');
      throw new Error('API-ключ не надано');
    }
    
    const startTime = Date.now();
    const response = await axios.get(`${API_BASE_URL}${ENDPOINTS.FUNDING_RATES}`, createRequestConfig());
    const endTime = Date.now();
    
    console.log(`⏱️ Час відповіді: ${endTime - startTime}ms`);
    
    if (response.data && response.data.success && response.data.data) {
      console.log('✅ Успішно отримано дані про фандинг');
      console.log(`📊 Отримано інформацію для ${Object.keys(response.data.data).length} криптовалют`);
      
      const formattedData = formatFundingData(response.data.data);
      console.log(`📈 Дані відформатовано успішно для ${formattedData.length} криптовалют`);
      
      return formattedData;
    }
    
    console.error('❌ Неправильний формат відповіді API:', response.data);
    throw new Error('Неправильний формат відповіді API');
  } catch (error) {
    console.error('❌ Помилка отримання даних про фандинг:', error);
    
    // Виводимо детальну інформацію про помилку
    if (error.response) {
      console.error('📡 Статус відповіді:', error.response.status);
      console.error('📡 Заголовки відповіді:', error.response.headers);
      console.error('📡 Дані відповіді:', error.response.data);
    }
    
    throw error;
  }
};

/**
 * Отримання історії ставок фандингу
 * @param {string} symbol - Символ криптовалюти (наприклад, "BTC")
 * @param {string} exchange - Біржа (наприклад, "Binance")
 * @param {string} interval - Інтервал (наприклад, "1d" для щоденних ставок)
 */
export const fetchFundingHistory = async (symbol, exchange = "Binance", interval = "1d") => {
  try {
    console.log(`📥 Отримання історії фандингу для ${symbol} на ${exchange} (інтервал: ${interval})...`);
    
    if (!API_KEY) {
      console.error('❌ API-ключ не надано');
      throw new Error('API-ключ не надано');
    }
    
    // Додаємо USDT до символу, якщо він ще не має суфіксу
    const fullSymbol = symbol.includes('USDT') ? symbol : `${symbol}USDT`;
    
    const url = `${API_BASE_URL}${ENDPOINTS.FUNDING_HISTORY}?symbol=${fullSymbol}&exchange=${exchange}&interval=${interval}`;
    console.log(`🌐 URL запиту: ${url}`);
    
    const startTime = Date.now();
    const response = await axios.get(url, createRequestConfig());
    const endTime = Date.now();
    
    console.log(`⏱️ Час відповіді: ${endTime - startTime}ms`);
    
    if (response.data && response.data.code === "0" && response.data.data) {
      console.log('✅ Успішно отримано історію фандингу');
      console.log(`📊 Отримано ${response.data.data.length} записів`);
      
      // Виводимо приклад останніх 2-х записів для перевірки
      const sampleData = response.data.data.slice(-2);
      console.log('📋 Останні записи:', sampleData);
      
      return response.data.data;
    }
    
    console.error('❌ Неправильний формат відповіді API для історії фандингу:', response.data);
    throw new Error('Неправильний формат відповіді API для історії фандингу');
  } catch (error) {
    console.error(`❌ Помилка отримання історії фандингу для ${symbol}:`, error);
    
    // Виводимо детальну інформацію про помилку
    if (error.response) {
      console.error('📡 Статус відповіді:', error.response.status);
      console.error('📡 Заголовки відповіді:', error.response.headers);
      console.error('📡 Дані відповіді:', error.response.data);
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
    console.log(`📥 Отримання кумулятивного фандингу для ${symbol} за ${days} днів...`);
    
    if (!API_KEY) {
      console.error('❌ API-ключ не надано');
      throw new Error('API-ключ не надано');
    }
    
    const url = `${API_BASE_URL}${ENDPOINTS.CUMULATIVE_FUNDING}?symbol=${symbol}&days=${days}`;
    console.log(`🌐 URL запиту: ${url}`);
    
    const startTime = Date.now();
    const response = await axios.get(url, createRequestConfig());
    const endTime = Date.now();
    
    console.log(`⏱️ Час відповіді: ${endTime - startTime}ms`);
    
    if (response.data && response.data.success && response.data.data) {
      console.log('✅ Успішно отримано кумулятивний фандинг');
      console.log('📊 Структура даних:', response.data.data);
      return response.data.data;
    }
    
    console.error('❌ Неправильний формат відповіді API для кумулятивного фандингу:', response.data);
    throw new Error('Неправильний формат відповіді API для кумулятивного фандингу');
  } catch (error) {
    console.error(`❌ Помилка отримання кумулятивного фандингу для ${symbol}:`, error);
    
    // Виводимо детальну інформацію про помилку
    if (error.response) {
      console.error('📡 Статус відповіді:', error.response.status);
      console.error('📡 Заголовки відповіді:', error.response.headers);
      console.error('📡 Дані відповіді:', error.response.data);
    }
    
    throw error;
  }
};

/**
 * Отримання ринкових даних для монет (ціна, ліквідність, об'єм)
 * @param {string} symbol - Символ криптовалюти (опціонально)
 */
export const fetchCoinsMarkets = async (symbol = '') => {
  try {
    console.log(`📥 Отримання ринкових даних${symbol ? ` для ${symbol}` : ''}...`);
    
    if (!API_KEY) {
      console.error('❌ API-ключ не надано');
      throw new Error('API-ключ не надано');
    }
    
    const url = `${API_BASE_URL}${ENDPOINTS.COINS_MARKETS}${symbol ? `?symbol=${symbol}` : ''}`;
    console.log(`🌐 URL запиту: ${url}`);
    
    const startTime = Date.now();
    const response = await axios.get(url, createRequestConfig());
    const endTime = Date.now();
    
    console.log(`⏱️ Час відповіді: ${endTime - startTime}ms`);
    
    if (response.data && response.data.success && response.data.data) {
      console.log('✅ Успішно отримано ринкові дані');
      console.log(`📊 Обсяг даних: ${JSON.stringify(response.data.data).length} символів`);
      return response.data.data;
    }
    
    console.error('❌ Неправильний формат відповіді API для ринкових даних:', response.data);
    throw new Error('Неправильний формат відповіді API для ринкових даних');
  } catch (error) {
    console.error('❌ Помилка отримання ринкових даних:', error);
    
    // Виводимо детальну інформацію про помилку
    if (error.response) {
      console.error('📡 Статус відповіді:', error.response.status);
      console.error('📡 Заголовки відповіді:', error.response.headers);
      console.error('📡 Дані відповіді:', error.response.data);
    }
    
    throw error;
  }
};

/**
 * Отримання підтримуваних бірж і торгових пар
 * @param {string} symbol - Символ криптовалюти (опціонально)
 */
export const fetchSupportedExchangesAndPairs = async (symbol = '') => {
  try {
    console.log(`📥 Отримання підтримуваних бірж і пар${symbol ? ` для ${symbol}` : ''}...`);
    
    if (!API_KEY) {
      console.error('❌ API-ключ не надано');
      throw new Error('API-ключ не надано');
    }
    
    const url = `${API_BASE_URL}${ENDPOINTS.SUPPORTED_EXCHANGES_PAIRS}${symbol ? `?symbol=${symbol}` : ''}`;
    console.log(`🌐 URL запиту: ${url}`);
    
    const startTime = Date.now();
    const response = await axios.get(url, createRequestConfig());
    const endTime = Date.now();
    
    console.log(`⏱️ Час відповіді: ${endTime - startTime}ms`);
    
    if (response.data && response.data.success && response.data.data) {
      console.log('✅ Успішно отримано дані про підтримувані біржі і пари');
      console.log('📊 Приклад даних:', response.data.data.slice(0, 2));
      return response.data.data;
    }
    
    console.error('❌ Неправильний формат відповіді API для підтримуваних бірж і пар:', response.data);
    throw new Error('Неправильний формат відповіді API для підтримуваних бірж і пар');
  } catch (error) {
    console.error('❌ Помилка отримання підтримуваних бірж і пар:', error);
    
    // Виводимо детальну інформацію про помилку
    if (error.response) {
      console.error('📡 Статус відповіді:', error.response.status);
      console.error('📡 Заголовки відповіді:', error.response.headers);
      console.error('📡 Дані відповіді:', error.response.data);
    }
    
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
    console.log(`📥 Отримання книги ордерів для ${symbol} на біржі ${exchange}...`);
    
    if (!API_KEY) {
      console.error('❌ API-ключ не надано');
      throw new Error('API-ключ не надано');
    }
    
    const url = `${API_BASE_URL}${ENDPOINTS.ORDER_BOOK}?symbol=${symbol}&exchange=${exchange}`;
    console.log(`🌐 URL запиту: ${url}`);
    
    const startTime = Date.now();
    const response = await axios.get(url, createRequestConfig());
    const endTime = Date.now();
    
    console.log(`⏱️ Час відповіді: ${endTime - startTime}ms`);
    
    if (response.data && response.data.success && response.data.data) {
      console.log('✅ Успішно отримано книгу ордерів');
      return response.data.data;
    }
    
    console.error('❌ Неправильний формат відповіді API для книги ордерів:', response.data);
    throw new Error('Неправильний формат відповіді API для книги ордерів');
  } catch (error) {
    console.error(`❌ Помилка отримання книги ордерів для ${symbol} на біржі ${exchange}:`, error);
    
    // Виводимо детальну інформацію про помилку
    if (error.response) {
      console.error('📡 Статус відповіді:', error.response.status);
      console.error('📡 Заголовки відповіді:', error.response.headers);
      console.error('📡 Дані відповіді:', error.response.data);
    }
    
    throw error;
  }
};

// Форматування даних з API для використання в додатку
const formatFundingData = (data) => {
  console.log('🔄 Форматування даних фандингу...');
  console.log('📋 Приклад вхідних даних:', Object.keys(data).slice(0, 3).map(key => ({ key, value: data[key] })));
  
  try {
    // Конвертуємо об'єкт у масив для легшої фільтрації
    const formattedData = Object.values(data).map(item => {
      // Створюємо базову структуру для елемента
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
    
    console.log('✅ Форматування завершено успішно');
    console.log('📋 Приклад вихідних даних:', formattedData.slice(0, 2));
    
    return formattedData;
  } catch (error) {
    console.error('❌ Помилка при форматуванні даних:', error);
    throw error;
  }
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