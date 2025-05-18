// src/App.jsx
import { useEffect, useRef } from 'react';
import Header from './components/Header';
import FundingSection from './components/fundingSection/FundingSection';
import CalculatorSection from './components/calc/CalculatorSection';
import Footer from './components/Footer';
import FilterPanel from './components/FilterPanel';
import ConnectionStatus from './components/ConnectionStatus/ConnectionStatus';
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
  const hasLoggedStartup = useRef(false);

  // Використовуємо хук для завантаження даних та WebSocket
  const fundingDataMethods = useFundingData();

  useEffect(() => {
    // Логуємо стартову інформацію тільки один раз
    if (!hasLoggedStartup.current) {
      logger.info(`Фандинг Калькулятор v${APP_VERSION} запущено`, {
        environment: import.meta.env.MODE,
        dateTime: new Date().toISOString(),
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screenSize: `${window.innerWidth}x${window.innerHeight}`,
        theme: theme,
        // WebSocket налаштування
        socketUrl: import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001',
        hasApiKey: !!import.meta.env.VITE_S_API_KEY
      });
      hasLoggedStartup.current = true;
    }
  }, [theme]);

  useEffect(() => {
    // Встановлюємо атрибут теми для CSS
    document.documentElement.setAttribute('data-theme', theme);
    logger.debug(`Тема змінена на: ${theme}`);
  }, [theme]);

  // Обробка помилок WebSocket для користувача
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && !fundingDataMethods.isWebSocketConnected()) {
        logger.info('Сторінка стала активною, перевіряємо WebSocket...');
        
        // Спробуємо переподключитися через 1 секунду
        setTimeout(() => {
          if (!fundingDataMethods.isWebSocketConnected()) {
            logger.info('Спроба переподключення WebSocket...');
            fundingDataMethods.reconnectWebSocket();
          }
        }, 1000);
      }
    };

    // Переподключення при поверненні на вкладку
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fundingDataMethods]);

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
      
      {/* Індикатор статусу WebSocket */}
      <ConnectionStatus position="bottom-right" />
      
      {/* Debug панель тільки в dev режимі */}
      {import.meta.env.DEV && (
        <div className="debug-panel">
          <details className="debug-details">
            <summary>🛠️ Debug Info</summary>
            <div className="debug-content">
              <div className="debug-item">
                <strong>Environment:</strong> {import.meta.env.MODE}
              </div>
              <div className="debug-item">
                <strong>Version:</strong> {APP_VERSION}
              </div>
              <div className="debug-item">
                <strong>Socket URL:</strong> {import.meta.env.VITE_SOCKET_URL || 'localhost:3001'}
              </div>
              <div className="debug-item">
                <strong>API URL:</strong> {import.meta.env.VITE_API_URL || 'Default'}
              </div>
              <div className="debug-item">
                <strong>Has API Key:</strong> {import.meta.env.VITE_S_API_KEY ? '✅' : '❌'}
              </div>
              {fundingDataMethods.sendTestMessage && (
                <button 
                  className="debug-button"
                  onClick={() => fundingDataMethods.sendTestMessage('Test from React')}
                >
                  📤 Send Test Message
                </button>
              )}
            </div>
          </details>
        </div>
      )}
    </div>
  );
}

export default App;