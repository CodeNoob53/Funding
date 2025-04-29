import { useState, useEffect } from 'react';
import Header from './components/Header';
import FundingSection from './components/FundingSection';
import CalculatorSection from './components/CalculatorSection';
import Footer from './components/Footer';
import { fetchFundingRates } from './services/api';
import useThemeStore from './store/themeStore';
import logger from './services/logger';

// Версія додатку для відстеження у логах
const APP_VERSION = import.meta.env.VITE_APP_VERSION || '0.2.0';

function App() {
  const [fundingData, setFundingData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedToken, setSelectedToken] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const theme = useThemeStore((state) => state.theme);

  // Логування при ініціалізації додатку
  useEffect(() => {
    logger.info(`Фандинг Калькулятор v${APP_VERSION} запущено`, {
      environment: import.meta.env.MODE,
      dateTime: new Date().toISOString(),
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenSize: `${window.innerWidth}x${window.innerHeight}`
    });
    
    // Перевіряємо наявність API ключа
    if (!import.meta.env.VITE_API_KEY) {
      logger.warn('API ключ не знайдено в змінних середовища');
    }
    
    // Прослуховуємо глобальні помилки
    const handleGlobalError = (event) => {
      logger.error('Незловлена глобальна помилка:', {
        message: event.message,
        source: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      });
    };
    
    window.addEventListener('error', handleGlobalError);
    
    return () => {
      window.removeEventListener('error', handleGlobalError);
      logger.info('Додаток вивантажено');
    };
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    logger.debug(`Тема змінена на: ${theme}`);
  }, [theme]);

  useEffect(() => {
    const loadFundingData = async () => {
      try {
        setIsLoading(true);
        logger.info('Початок завантаження даних про фандинг');
        
        const data = await fetchFundingRates();
        setFundingData(data);
        
        const now = new Date();
        setLastUpdated(now);
        
        logger.info(`Дані про фандинг успішно завантажено (${data.length} записів)`, {
          timestamp: now.toISOString(),
          tokenCount: data.length,
          topTokens: data.slice(0, 3).map(token => token.symbol)
        });
        
        setError(null);
      } catch (err) {
        const errorMessage = 'Не вдалося завантажити дані про фандинг';
        setError(errorMessage);
        
        logger.error(errorMessage, {
          originalError: err.message,
          stack: err.stack,
          time: new Date().toISOString()
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadFundingData();
    
    // Налаштовуємо інтервал оновлення даних (15 хвилин)
    const intervalId = setInterval(() => {
      logger.debug('Запуск періодичного оновлення даних фандингу');
      loadFundingData();
    }, 15 * 60 * 1000);
    
    return () => {
      logger.debug('Очищення інтервалу оновлення даних');
      clearInterval(intervalId);
    };
  }, []);

  const handleSelectToken = (token) => {
    setSelectedToken(token);
    logger.debug(`Вибрано токен: ${token.symbol}`, {
      tokenSymbol: token.symbol,
      fundingRate: token.fundingRate,
      exchanges: Object.keys(token).filter(key => 
        !key.includes('NextFundingTime') && 
        key !== 'symbol' && 
        key !== 'indexPrice' && 
        key !== 'fundingRate'
      )
    });
  };

  const handleSelectRate = (token, exchange, rate) => {
    logger.debug(`Вибрано ставку: ${token.symbol} на ${exchange} (${rate})`, {
      tokenSymbol: token.symbol,
      exchange,
      rate
    });

    // Оновлюємо вибраний токен із додатковими параметрами
    const updatedToken = {
      ...token,
      selectedExchange: exchange,
      selectedRate: rate
    };

    setSelectedToken(updatedToken);
  };

  const formatUpdateTime = (date) => {
    if (!date) return '';

    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        {lastUpdated && (
          <div className="mb-4 text-sm text-[rgb(var(--foreground))/60] flex justify-end">
            Останнє оновлення: {formatUpdateTime(lastUpdated)}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-3/5">
            <FundingSection
              fundingData={fundingData}
              isLoading={isLoading}
              error={error}
              onSelectToken={handleSelectToken}
              onSelectRate={handleSelectRate}
            />
          </div>

          <div className="lg:w-2/5 lg:self-start lg:top-24 lg:self-start">
            <CalculatorSection
              selectedToken={selectedToken}
              onSelectRate={handleSelectRate}
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default App;