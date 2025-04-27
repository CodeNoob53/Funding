import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || "https://open-api.coinglass.com/public/v2/funding";
const API_KEY = import.meta.env.VITE_API_KEY || "";

export const fetchFundingRates = async () => {
  try {
    // Якщо API-ключ не надано, використовуємо тестові дані для розробки
    if (!API_KEY) {
      console.warn('API-ключ не надано, використовуємо тестові дані');
      return getMockFundingData();
    }
    
    const response = await axios.get(API_URL, {
      headers: {
        'accept': 'application/json',
        'coinglassSecret': API_KEY
      }
    });

    if (response.data && response.data.success && response.data.data) {
      // Форматуємо дані для використання в додатку
      return formatFundingData(response.data.data);
    }
    
    throw new Error('Неправильний формат відповіді API');
  } catch (error) {
    console.error('Помилка отримання даних про фандинг:', error);
    throw error;
  }
};

// Форматування даних з API для використання в додатку
const formatFundingData = (data) => {
  // Конвертуємо об'єкт у масив для легшої фільтрації
  return Object.values(data).map(item => ({
    symbol: item.symbol,
    indexPrice: item.usdPrice || item.indexPrice,
    binanceFunding: item.binanceFundingRate,
    okexFunding: item.okexFundingRate,
    bybitFunding: item.bybitFundingRate,
    gateFunding: item.gateFundingRate,
    mexcFunding: item.mexcFundingRate,
    // Обчислюємо середній фандинг для сортування і фільтрації
    fundingRate: calculateAverageFunding(item)
  }));
};

// Обчислюємо середній фандинг для криптовалюти
const calculateAverageFunding = (item) => {
  const rates = [
    item.binanceFundingRate,
    item.okexFundingRate,
    item.bybitFundingRate,
    item.gateFundingRate,
    item.mexcFundingRate
  ].filter(rate => rate !== undefined && rate !== null && rate !== '-');
  
  if (rates.length === 0) return 0;
  
  const sum = rates.reduce((acc, rate) => acc + parseFloat(rate), 0);
  return sum / rates.length;
};

// Тестові дані для розробки, коли API-ключ не доступний
const getMockFundingData = () => {
  return [
    {
      symbol: 'BTC',
      indexPrice: 75000,
      fundingRate: 0.0020,
      binanceFunding: 0.0022,
      okexFunding: 0.0018,
      bybitFunding: 0.0021,
      gateFunding: 0.0019,
      mexcFunding: 0.0020
    },
    {
      symbol: 'ETH',
      indexPrice: 3500,
      fundingRate: 0.0018,
      binanceFunding: 0.0019,
      okexFunding: 0.0017,
      bybitFunding: 0.0018,
      gateFunding: 0.0016,
      mexcFunding: 0.0020
    },
    {
      symbol: 'SOL',
      indexPrice: 140,
      fundingRate: 0.0025,
      binanceFunding: 0.0027,
      okexFunding: 0.0023,
      bybitFunding: 0.0024,
      gateFunding: 0.0026,
      mexcFunding: 0.0025
    },
    {
      symbol: 'DOGE',
      indexPrice: 0.12,
      fundingRate: 0.0030,
      binanceFunding: 0.0035,
      okexFunding: 0.0028,
      bybitFunding: 0.0032,
      gateFunding: 0.0029,
      mexcFunding: 0.0026
    },
    {
      symbol: 'XRP',
      indexPrice: 0.58,
      fundingRate: -0.0016,
      binanceFunding: -0.0018,
      okexFunding: -0.0015,
      bybitFunding: -0.0017,
      gateFunding: -0.0016,
      mexcFunding: -0.0014
    },
    {
      symbol: 'ADA',
      indexPrice: 0.45,
      fundingRate: -0.0019,
      binanceFunding: -0.0021,
      okexFunding: -0.0018,
      bybitFunding: -0.0019,
      gateFunding: -0.0020,
      mexcFunding: -0.0017
    },
    {
      symbol: 'AVAX',
      indexPrice: 36.8,
      fundingRate: 0.0022,
      binanceFunding: 0.0025,
      okexFunding: 0.0020,
      bybitFunding: 0.0023,
      gateFunding: 0.0021,
      mexcFunding: 0.0021
    },
    {
      symbol: 'MATIC',
      indexPrice: 0.95,
      fundingRate: -0.0017,
      binanceFunding: -0.0018,
      okexFunding: -0.0016,
      bybitFunding: -0.0019,
      gateFunding: -0.0015,
      mexcFunding: -0.0017
    },
    {
      symbol: 'PEPE',
      indexPrice: 0.00018,
      fundingRate: 0.0170,
      binanceFunding: 0.0180,
      okexFunding: 0.0160,
      bybitFunding: 0.0175,
      gateFunding: 0.0165,
      mexcFunding: 0.0170
    },
    {
      symbol: 'APT',
      indexPrice: 8.65,
      fundingRate: -0.0160,
      binanceFunding: -0.0170,
      okexFunding: -0.0155,
      bybitFunding: -0.0165,
      gateFunding: -0.0150,
      mexcFunding: -0.0160
    },
  ];
};