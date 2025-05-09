// src/App.jsx
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
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [filtersEnabled, setFiltersEnabled] = useState(true);
  const [minFundingRate, setMinFundingRate] = useState(0);
  const [rateSignFilter, setRateSignFilter] = useState('all');
  const [displayMode, setDisplayMode] = useState('option1');
  const [fundingInterval, setFundingInterval] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('exchanges');
  const [sortOrder, setSortOrder] = useState('desc');
  const [exchangeSortBy, setExchangeSortBy] = useState('name');
  const [exchangeSortOrder, setExchangeSortOrder] = useState('asc');
  const [selectedExchanges, setSelectedExchanges] = useState({});
  const [availableExchanges, setAvailableExchanges] = useState({});
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    const initialExchanges = {};
    Object.keys(availableExchanges).forEach((key) => {
      initialExchanges[key] = true;
    });
    setSelectedExchanges(initialExchanges);
  }, [availableExchanges]);

  useEffect(() => {
    logger.info(`Фандинг Калькулятор v${APP_VERSION} запущено`, {
      environment: import.meta.env.MODE,
      dateTime: new Date().toISOString(),
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenSize: `${window.innerWidth}x${window.innerHeight}`,
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
      selectedRate: funding_rate,
    };

    setSelectedToken(updatedToken);
  };

  const handleToggleFilters = () => {
    setIsFilterPanelOpen((prev) => !prev);
    logger.debug(`Панель фільтрів: ${!isFilterPanelOpen ? 'відкрита' : 'закрита'}`);
  };

  const formatUpdateTime = (date) => {
    if (!date) return '';
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <div className="app" data-theme={theme}>
      <Header />
      <main className={`main-content ${isFilterPanelOpen ? 'with-filter-panel' : ''}`}>
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
          displayedExchanges={selectedExchanges}
        />
        <CalculatorSection selectedToken={selectedToken} />
        {isFilterPanelOpen && (
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
            selectedExchanges={selectedExchanges}
            setSelectedExchanges={setSelectedExchanges}
            availableExchanges={availableExchanges}
            onClose={() => setIsFilterPanelOpen(false)}
          />
        )}
      </main>
      <Footer />
    </div>
  );
}

export default App;