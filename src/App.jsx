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
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const loadFundingData = async () => {
      try {
        setIsLoading(true);
        const data = await fetchFundingRates();
        setFundingData(data);
        setLastUpdated(new Date());
        setError(null);
      } catch (err) {
        setError('Не вдалося завантажити дані про фандинг');
        console.error('Помилка отримання даних про фандинг:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadFundingData();
    const intervalId = setInterval(loadFundingData, 15 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  const handleSelectToken = (token) => {
    setSelectedToken(token);
  };

  const handleSelectRate = (token, exchange, rate) => {
    console.log(`App: Selected token - ${token.symbol}, Exchange: ${exchange}, Rate: ${rate}`);
    setSelectedToken(token);
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
          <div className="mb-4 text-sm text-[rgb(var(--foreground))/60 flex justify-end">
            Останнє оновлення: {formatUpdateTime(lastUpdated)}
          </div>
        )}
        
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-3/4">
            <FundingSection 
              fundingData={fundingData} 
              isLoading={isLoading} 
              error={error}
              onSelectToken={handleSelectToken}
              onSelectRate={handleSelectRate}
            />
          </div>
          
          <div className="lg:w-1/4 lg:sticky lg:top-24 lg:self-start">
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