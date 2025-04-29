import { useState, useEffect } from 'react';
import Header from './components/Header';
import FundingSection from './components/FundingSection';
import CalculatorSection from './components/CalculatorSection';
import Footer from './components/Footer';
import { fetchFundingRates } from './services/api';
import useThemeStore from './store/themeStore';

function App() {
  const [fundingData, setFundingData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedToken, setSelectedToken] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const loadFundingData = async () => {
      try {
        setIsLoading(true);
        setError(null); // Обнуляємо помилку перед новим запитом
        
        console.log(`Завантаження даних про фандинг (спроба ${retryCount + 1})...`);
        const data = await fetchFundingRates();
        
        if (!data || data.length === 0) {
          console.error('Отримано порожні дані від API');
          throw new Error('Не вдалося завантажити дані про фандинг');
        }
        
        setFundingData(data);
        setLastUpdated(new Date());
        setError(null);
        console.log(`Успішно завантажено ${data.length} записів про фандинг`);
      } catch (err) {
        console.error('Помилка завантаження даних про фандинг:', err);
        
        // Встановлюємо дружнє повідомлення про помилку
        let errorMessage = 'Не вдалося завантажити дані про фандинг';
        
        // Можемо змінити повідомлення для конкретних помилок
        if (err.message.includes('API-ключ не надано')) {
          errorMessage = 'Потрібен API-ключ для доступу до даних';
        } else if (err.message.includes('Network Error')) {
          errorMessage = 'Проблема з\'єднання з сервером. Перевірте інтернет.';
        } else if (err.response && err.response.status === 401) {
          errorMessage = 'Невірний API-ключ або помилка авторизації';
        } else if (err.response && err.response.status === 429) {
          errorMessage = 'Перевищено ліміт запитів до API';
        }
        
        setError(errorMessage);
        
        // Якщо це не помилка API-ключа і не перевищення ліміту, 
        // можна спробувати перезавантажити дані автоматично
        if (!err.message.includes('API-ключ') && 
            (!err.response || (err.response && err.response.status !== 429))) {
          setRetryCount(prev => prev + 1);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadFundingData();
    
    // Якщо дані не завантажились, спробуємо повторити запит кілька разів
    // але не більше 3 спроб, з інтервалом у 3 секунди
    if (retryCount > 0 && retryCount < 3) {
      const timer = setTimeout(() => {
        loadFundingData();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
    
    // Оновлюємо дані кожні 15 хвилин
    const intervalId = setInterval(loadFundingData, 15 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [retryCount]);

  const handleSelectToken = (token) => {
    setSelectedToken(token);
    console.log('Token selected in App:', token);
  };

  const handleSelectRate = (token, exchange, rate) => {
    console.log(`App: Selected token - ${token.symbol}, Exchange: ${exchange}, Rate: ${rate}`);

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

  // Функція для ручного оновлення даних
  const handleRefreshData = () => {
    setRetryCount(0); // Обнуляємо лічильник спроб
    setLastUpdated(null); // Обнуляємо час останнього оновлення
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        {lastUpdated && (
          <div className="mb-4 text-sm text-[rgb(var(--foreground))/60] flex justify-between items-center">
            <div></div> {/* Порожній елемент для вирівнювання */}
            <div className="flex items-center gap-4">
              <button 
                onClick={handleRefreshData}
                disabled={isLoading}
                className="text-sm flex items-center gap-1 text-[rgb(var(--primary))] hover:underline"
              >
                {isLoading ? (
                  <span className="inline-block w-3 h-3 border-2 border-[rgb(var(--primary))] border-t-transparent rounded-full animate-spin mr-1"></span>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                    <path d="M21 3v5h-5" />
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                    <path d="M8 16H3v5" />
                  </svg>
                )}
                {isLoading ? 'Оновлення...' : 'Оновити дані'}
              </button>
              <span>Останнє оновлення: {formatUpdateTime(lastUpdated)}</span>
            </div>
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