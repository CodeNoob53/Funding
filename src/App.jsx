// src/App.jsx - оновлені зміни
import { useState, useEffect } from 'react';
import Header from './components/Header';
import FundingSection from './components/FundingSection';
import CalculatorSection from './components/CalculatorSection';
import Footer from './components/Footer';
import FilterPanel from './components/FilterPanel';
import { fetchFundingRates } from './services/api';
import useThemeStore from './store/themeStore';
import logger from './services/logger';
import socketService from './services/socketService';
import './App.css';

const APP_VERSION = import.meta.env.VITE_APP_VERSION || '0.2.0';

function App() {
  const [fundingData, setFundingData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedToken, setSelectedToken] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const theme = useThemeStore((state) => state.theme);
  
  // Додаємо стани для фільтрів
  const [showFilters, setShowFilters] = useState(false);
  const [filtersEnabled, setFiltersEnabled] = useState(() => {
    return localStorage.getItem('filtersEnabled') === 'true' || false;
  });
  const [minFundingRate, setMinFundingRate] = useState(() => {
    return parseFloat(localStorage.getItem('minFundingRate')) || 0.15;
  });
  const [rateSignFilter, setRateSignFilter] = useState(() => {
    return localStorage.getItem('rateSignFilter') || 'all';
  });
  const [displayMode, setDisplayMode] = useState(() => {
    return localStorage.getItem('displayMode') || 'option1';
  });
  const [fundingInterval, setFundingInterval] = useState(() => {
    return localStorage.getItem('fundingInterval') || 'all';
  });
  const [statusFilter, setStatusFilter] = useState(() => {
    return localStorage.getItem('statusFilter') || 'all';
  });
  const [sortBy, setSortBy] = useState(() => localStorage.getItem('sortBy') || 'exchanges');
  const [sortOrder, setSortOrder] = useState(() => localStorage.getItem('sortOrder') || 'desc');
  const [exchangeSortBy, setExchangeSortBy] = useState(() => localStorage.getItem('exchangeSortBy') || 'name');
  const [exchangeSortOrder, setExchangeSortOrder] = useState(() => localStorage.getItem('exchangeSortOrder') || 'asc');
  const [displayedExchanges, setDisplayedExchanges] = useState(() => {
    const saved = localStorage.getItem('displayedExchanges');
    return saved ? JSON.parse(saved) : {};
  });
  const [availableExchanges, setAvailableExchanges] = useState({});

  // Зберігаємо фільтри в localStorage
  useEffect(() => {
    localStorage.setItem('minFundingRate', minFundingRate);
    localStorage.setItem('rateSignFilter', rateSignFilter);
    localStorage.setItem('displayMode', displayMode);
    localStorage.setItem('filtersEnabled', filtersEnabled);
    localStorage.setItem('displayedExchanges', JSON.stringify(displayedExchanges));
    localStorage.setItem('fundingInterval', fundingInterval);
    localStorage.setItem('statusFilter', statusFilter);
    localStorage.setItem('sortBy', sortBy);
    localStorage.setItem('sortOrder', sortOrder);
    localStorage.setItem('exchangeSortBy', exchangeSortBy);
    localStorage.setItem('exchangeSortOrder', exchangeSortOrder);
  }, [
    minFundingRate,
    rateSignFilter,
    displayMode,
    filtersEnabled,
    displayedExchanges,
    fundingInterval,
    statusFilter,
    sortBy,
    sortOrder,
    exchangeSortBy,
    exchangeSortOrder,
  ]);

  // Обробка Esc для закриття панелі
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape' && showFilters) {
        setShowFilters(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showFilters]);

  // Встановлюємо CSS змінні для висот хедера і футера
  useEffect(() => {
    const headerHeight = document.querySelector('.header')?.offsetHeight || 72;
    const footerHeight = document.querySelector('.footer')?.offsetHeight || 96;
    document.documentElement.style.setProperty('--header-height', `${headerHeight}px`);
    document.documentElement.style.setProperty('--footer-height', `${footerHeight}px`);
  }, []);

  useEffect(() => {
    logger.info(`Фандинг Калькулятор v${APP_VERSION} запущено`, {
      environment: import.meta.env.MODE,
      dateTime: new Date().toISOString(),
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenSize: `${window.innerWidth}x${window.innerHeight}`
    });
  }, [error]);

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
    const intervalId = setInterval(async () => {
      if (!error) {
        await loadFundingData();
      } else {
        logger.debug('Пропускаємо оновлення через попередню помилку');
      }
    }, 20 * 1000);

    socketService.connect();
    socketService.on('dataUpdate', (data) => {
      logger.info('Оновлення даних через WebSocket', data);
      setFundingData(data);
    });

    return () => {
      logger.debug('Очищення інтервалу оновлення даних');
      clearInterval(intervalId);
      socketService.disconnect();
    };
  }, [error]);

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
  
  // Обробник для відкриття/закриття панелі фільтрів
  const handleToggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const formatUpdateTime = (date) => {
    if (!date) return '';
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <div className={`app ${showFilters ? 'app-with-filters' : ''}`} data-theme={theme}>
      <Header />

      <main className="main-content">
        <div className="content-container">
          {lastUpdated && (
            <div className="last-updated">
              Останнє оновлення: {formatUpdateTime(lastUpdated)}
            </div>
          )}

          <FundingSection
            fundingData={fundingData}
            isLoading={isLoading}
            error={error}
            onSelectToken={handleSelectToken}
            onSelectRate={handleSelectRate}
            onToggleFilters={handleToggleFilters}
            availableExchanges={availableExchanges}
            setAvailableExchanges={setAvailableExchanges}
            // Передаємо стан фільтрів
            filtersEnabled={filtersEnabled}
            minFundingRate={minFundingRate}
            rateSignFilter={rateSignFilter}
            displayMode={displayMode}
            fundingInterval={fundingInterval}
            statusFilter={statusFilter}
            sortBy={sortBy}
            sortOrder={sortOrder}
            exchangeSortBy={exchangeSortBy}
            exchangeSortOrder={exchangeSortOrder}
            displayedExchanges={displayedExchanges}
          />

          <div className="calculator-container">
            <CalculatorSection
              selectedToken={selectedToken}
            />
          </div>
        </div>
        
        {/* FilterPanel тепер розміщений в main, але не в content-container */}
        {showFilters && (
          <FilterPanel
            filtersEnabled={filtersEnabled}
            setFiltersEnabled={setFiltersEnabled}
            minFundingRate={minFundingRate}
            setMinFundingRate={setMinFundingRate}
            rateSignFilter={rateSignFilter}
            setRateSignFilter={setRateSignFilter}
            displayMode={displayMode}
            setDisplayMode={setDisplayMode}
            fundingInterval={fundingInterval}
            setFundingInterval={setFundingInterval}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            sortBy={sortBy}
            setSortBy={setSortBy}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            exchangeSortBy={exchangeSortBy}
            setExchangeSortBy={setExchangeSortBy}
            exchangeSortOrder={exchangeSortOrder}
            setExchangeSortOrder={setExchangeSortOrder}
            selectedExchanges={displayedExchanges}
            setSelectedExchanges={setDisplayedExchanges}
            availableExchanges={availableExchanges}
            onClose={() => setShowFilters(false)}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;