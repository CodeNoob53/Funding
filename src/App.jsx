// src/App.jsx
import { useEffect } from 'react';
import Header from './components/Header';
import FundingSection from './components/fundingSection/FundingSection';
import CalculatorSection from './components/calc/CalculatorSection';
import Footer from './components/Footer';
import FilterPanel from './components/FilterPanel';
import useThemeStore from './store/themeStore';
import useAppStore from './store/appStore';
import { useFundingData } from './hooks/useFundingData';
import logger from './services/logger';
import { APP_VERSION } from './config/appConfig';
import './App.css';

function App() {
  // Отримуємо дані з глобального стору
  const { selectedToken, isFilterPanelOpen, toggleFilterPanel } = useAppStore(state => ({
    selectedToken: state.selectedToken,
    isFilterPanelOpen: state.isFilterPanelOpen,
    toggleFilterPanel: state.toggleFilterPanel
  }));
  
  const theme = useThemeStore((state) => state.theme);

  // Використовуємо хук для завантаження даних
  useFundingData();

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

  return (
    <div className="app" data-theme={theme}>
      <Header />
      <main className={`main-content ${isFilterPanelOpen ? 'with-filter-panel' : ''}`}>
        <FundingSection onToggleFilters={toggleFilterPanel} />
        <CalculatorSection selectedToken={selectedToken} />
        {isFilterPanelOpen && (
          <FilterPanel onClose={toggleFilterPanel} />
        )}
      </main>
      <Footer />
    </div>
  );
}

export default App;