import axios from 'axios';

const API_URL = "https://open-api.coinglass.com/public/v2/funding";
const API_KEY = ""; // API key should be provided by the user

export const fetchFundingRates = async () => {
  try {
    // If API key is not provided, return mock data for development
    if (!API_KEY) {
      console.warn('API key not provided, using mock data');
      return getMockFundingData();
    }
    
    const response = await axios.get(API_URL, {
      headers: {
        'accept': 'application/json',
        'coinglassSecret': API_KEY
      }
    });

    if (response.data && response.data.success && response.data.data) {
      // Convert object to array for easier filtering
      return Object.values(response.data.data);
    }
    
    throw new Error('Invalid API response format');
  } catch (error) {
    console.error('Error fetching funding rates:', error);
    throw error;
  }
};

// Mock data for development when API key is not available
const getMockFundingData = () => {
  return [
    { symbol: 'BTC', fundingRate: 0.0020, indexPrice: 75000 },
    { symbol: 'ETH', fundingRate: 0.0018, indexPrice: 3500 },
    { symbol: 'SOL', fundingRate: 0.0025, indexPrice: 140 },
    { symbol: 'DOGE', fundingRate: 0.0030, indexPrice: 0.12 },
    { symbol: 'XRP', fundingRate: 0.0016, indexPrice: 0.58 },
    { symbol: 'ADA', fundingRate: 0.0019, indexPrice: 0.45 },
    { symbol: 'AVAX', fundingRate: 0.0022, indexPrice: 36.8 },
    { symbol: 'MATIC', fundingRate: 0.0017, indexPrice: 0.95 },
  ];
};