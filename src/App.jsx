// src/App.jsx
import { useState, useEffect, useCallback } from 'react';
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
const FILTER_SETTINGS_KEY = 'funding-calculator-filter-settings';

function App() {
  const [fundingData, setFundingData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedToken, setSelectedToken] = useState(null);
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

  // Функція для збереження всіх налаштувань фільтрів
  const saveFilterSettings = useCallback(() => {
    const settings = {
      filtersEnabled,
      minFundingRate,
      rateSignFilter,
      displayMode,
      fundingInterval,
      statusFilter,
      sortBy,
      sortOrder,
      exchangeSortBy,
      exchangeSortOrder,
      selectedExchanges
    };
    
    localStorage.setItem(FILTER_SETTINGS_KEY, JSON.stringify(settings));
    logger.debug('Налаштування фільтрів збережено локально');
  }, [
    filtersEnabled, 
    minFundingRate, 
    rateSignFilter, 
    displayMode, 
    fundingInterval, 
    statusFilter, 
    sortBy, 
    sortOrder, 
    exchangeSortBy, 
    exchangeSortOrder, 
    selectedExchanges
  ]);

  // Завантаження налаштувань з localStorage при ініціалізації
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem(FILTER_SETTINGS_KEY);
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setFiltersEnabled(settings.filtersEnabled ?? true);
        setMinFundingRate(settings.minFundingRate ?? 0);
        setRateSignFilter(settings.rateSignFilter ?? 'all');
        setDisplayMode(settings.displayMode ?? 'option1');
        setFundingInterval(settings.fundingInterval ?? 'all');
        setStatusFilter(settings.statusFilter ?? 'all');
        setSortBy(settings.sortBy ?? 'exchanges');
        setSortOrder(settings.sortOrder ?? 'desc');
        setExchangeSortBy(settings.exchangeSortBy ?? 'name');
        setExchangeSortOrder(settings.exchangeSortOrder ?? 'asc');
        
        // Біржі завантажимо пізніше, коли буде доступний список availableExchanges
        if (settings.selectedExchanges && Object.keys(settings.selectedExchanges).length > 0) {
          setSelectedExchanges(settings.selectedExchanges);
        }
        
        logger.info('Налаштування фільтрів завантажено з локального сховища');
      }
    } catch (error) {
      logger.error('Помилка завантаження налаштувань фільтрів', error);
    }
  }, []);

  // Синхронізація і ініціалізація вибраних бірж
  useEffect(() => {
    if (Object.keys(availableExchanges).length > 0) {
      // Якщо список вибраних бірж порожній, спробуємо завантажити збережені або створити нові
      if (Object.keys(selectedExchanges).length === 0) {
        try {
          const savedSettings = localStorage.getItem(FILTER_SETTINGS_KEY);
          if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            if (settings.selectedExchanges && Object.keys(settings.selectedExchanges).length > 0) {
              setSelectedExchanges(settings.selectedExchanges);
              return;
            }
          }
        } catch (error) {
          logger.error('Помилка синхронізації бірж', error);
        }

        // Якщо немає збережених або відбулася помилка, створюємо новий список
        const initialExchanges = {};
        Object.keys(availableExchanges).forEach((key) => {
          initialExchanges[key] = true;
        });
        setSelectedExchanges(initialExchanges);
      } else {
        // Оновлюємо списки, додаючи нові біржі, яких раніше не було
        const updatedExchanges = { ...selectedExchanges };
        let hasChanges = false;
        
        Object.keys(availableExchanges).forEach((key) => {
          if (updatedExchanges[key] === undefined) {
            updatedExchanges[key] = true;
            hasChanges = true;
          }
        });
        
        if (hasChanges) {
          setSelectedExchanges(updatedExchanges);
        }
      }
    }
  }, [availableExchanges, selectedExchanges]);

  // Зберігаємо налаштування при їх зміні
  useEffect(() => {
    if (Object.keys(selectedExchanges).length > 0) {
      saveFilterSettings();
    }
  }, [
    filtersEnabled, 
    minFundingRate, 
    rateSignFilter, 
    displayMode, 
    fundingInterval, 
    statusFilter, 
    sortBy, 
    sortOrder, 
    exchangeSortBy, 
    exchangeSortOrder,
    selectedExchanges,
    saveFilterSettings
  ]);

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

    // Початкове завантаження
    loadFundingData();
    
    // Інтервал оновлення
    const intervalId = setInterval(() => {
      if (!document.hidden && !isLoading) { // Перевіряємо чи вкладка активна
        loadFundingData();
      } else {
        logger.debug('Пропускаємо оновлення: вкладка неактивна або попереднє оновлення ще виконується');
      }
    }, 20 * 1000);

    // Ініціалізація WebSocket
    socketService.connect();
    socketService.on('dataUpdate', (data) => {
      if (data?.length) {
        logger.info(`Отримано оновлення даних через WebSocket (${data.length} записів)`);
        setFundingData(data);
      }
    });

    return () => {
      logger.debug('Очищення інтервалу оновлення даних');
      clearInterval(intervalId);
      socketService.disconnect();
    };
  }, []); // Запускаємо тільки один раз при монтуванні

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

  return (
    <div className="app" data-theme={theme}>
      <Header />
      <main className={`main-content ${isFilterPanelOpen ? 'with-filter-panel' : ''}`}>
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