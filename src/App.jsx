import { useState, useEffect } from 'react';
import Header from './components/Header';
import FundingSection from './components/FundingSection';
import CalculatorSection from './components/CalculatorSection';
import Footer from './components/Footer';
import { fetchFundingRates } from './services/api';
import useThemeStore from './store/themeStore';
import logger from './services/logger';

const APP_VERSION = import.meta.env.VITE_APP_VERSION || '0.2.0';

function App() {
  const [fundingData, setFundingData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedToken, setSelectedToken] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    logger.info(`Фандинг Калькулятор v${APP_VERSION} запущено`, {
      environment: import.meta.env.MODE,
      dateTime: new Date().toISOString(),
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenSize: `${window.innerWidth}x${window.innerHeight}`
    });
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
        logger.info(`Дані про фандинг успішно завантажено (${data.length} записів)`);
        setError(null);
      } catch (err) {
        const errorMessage = 'Не вдалося завантажити дані про фандинг';
        setError(errorMessage);
        logger.error(errorMessage, err);
      } finally {
        setIsLoading(false);
      }
    };

    loadFundingData();
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
    logger.debug(`Вибрано токен: ${token.symbol}`);
  };

  const handleSelectRate = (data) => {
    const { token, exchange, funding_rate } = data;
    logger.debug(`Вибрано ставку: ${token.symbol} на ${exchange} (${funding_rate})`);

    const updatedToken = {
      ...token,
      selectedExchange: exchange,
      selectedRate: funding_rate
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

        <FundingSection
          fundingData={fundingData}
          isLoading={isLoading}
          error={error}
          onSelectToken={handleSelectToken}
          onSelectRate={handleSelectRate}
        />

        <div className="mt-8">
          <CalculatorSection
            selectedToken={selectedToken}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default App;