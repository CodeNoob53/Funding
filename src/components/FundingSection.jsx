import { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import TokenItem from './TokenItem';
import ExchangeIcon from './ExchangeIcon';

function FundingSection({ fundingData, isLoading, error, onSelectToken, onSelectRate }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('stablecoin'); // Вкладки: stablecoin або token
  const [visibleCount, setVisibleCount] = useState(50); // Кількість видимих рядків

  // Функція для пошуку URL логотипу біржі

  // Оптимізація за допомогою useMemo для обчислення доступних бірж
  const availableExchanges = useMemo(() => {
    if (!fundingData?.length) return [];
    
    const exchanges = new Set();
    const logoMap = new Map(); // Зберігаємо відповідність між назвою біржі та логотипом
    
    fundingData.forEach((item) => {
      const list = activeTab === 'stablecoin' ? item.stablecoin_margin_list : item.token_margin_list;
      if (Array.isArray(list) && list.length > 0) {
        list.forEach((entry) => {
          if (entry.exchange) {
            exchanges.add(entry.exchange);
            
            // Зберігаємо логотип, якщо він доступний
            if (entry.exchange_logo && !logoMap.has(entry.exchange)) {
              logoMap.set(entry.exchange, entry.exchange_logo);
            }
          }
        });
      }
    });

    return Array.from(exchanges).map((exchange) => ({
      key: exchange.toLowerCase(),
      displayName: exchange,
      logoUrl: logoMap.get(exchange) || null
    }));
  }, [fundingData, activeTab]);

  // Оптимізація за допомогою useMemo для фільтрації та сортування токенів
  const filteredTokens = useMemo(() => {
    if (!fundingData?.length) return [];
    
    const filtered = fundingData.filter((token) => {
      const matchesSearch = token.symbol?.toLowerCase().includes(searchQuery.toLowerCase()) || !searchQuery;
      const hasMarginList = Array.isArray(
        activeTab === 'stablecoin' ? token.stablecoin_margin_list : token.token_margin_list
      ) && (activeTab === 'stablecoin' ? token.stablecoin_margin_list : token.token_margin_list).length > 0;
      return matchesSearch && hasMarginList;
    });
    
    // Сортуємо за абсолютною величиною fundingRate від більшого до меншого
    return filtered.sort((a, b) => Math.abs(b.fundingRate || 0) - Math.abs(a.fundingRate || 0));
  }, [fundingData, searchQuery, activeTab]);

  // Завантаження більше рядків при прокрутці
  const handleScroll = useCallback((e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    if (scrollHeight - scrollTop <= clientHeight * 1.5 && visibleCount < filteredTokens.length) {
      setVisibleCount(prev => Math.min(prev + 20, filteredTokens.length));
    }
  }, [filteredTokens.length, visibleCount]);

  // Скидаємо лічильник видимих рядків при зміні фільтра або вкладки
  useEffect(() => {
    setVisibleCount(50);
  }, [searchQuery, activeTab]);

  // Оптимізація обробників подій з useCallback
  const handleTokenClick = useCallback((token) => {
    onSelectToken(token);
  }, [onSelectToken]);

  const handleRateClick = useCallback((data) => {
    onSelectRate(data);
  }, [onSelectRate]);

  return (
    <section className="bg-[rgb(var(--card))] rounded-xl shadow-lg overflow-hidden">
      {/* Заголовок і пошук */}
      <div className="p-6 border-b border-[rgb(var(--border))] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-[rgb(var(--foreground))] flex items-center gap-3">
          Ставки фінансування
          {isLoading && (
            <div className="w-5 h-5 border-2 border-[rgb(var(--primary))] border-t-transparent rounded-full animate-spin" />
          )}
        </h2>
        <input
          type="text"
          placeholder="Пошук токена..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:w-64 py-2 px-4 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))] text-[rgb(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))/50] transition"
        />
      </div>

      {/* Вкладки */}
      <div className="px-6 py-4 border-b border-[rgb(var(--border))]">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('stablecoin')}
            className={`py-2 px-4 rounded-lg font-semibold transition-colors ${
              activeTab === 'stablecoin'
                ? 'bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))]'
                : 'bg-[rgb(var(--foreground))/5] text-[rgb(var(--foreground))/70] hover:bg-[rgb(var(--foreground))/10]'
            }`}
          >
            Stablecoin Margin
          </button>
          <button
            onClick={() => setActiveTab('token')}
            className={`py-2 px-4 rounded-lg font-semibold transition-colors ${
              activeTab === 'token'
                ? 'bg-[rgb(var(--primary))] text-[rgb(var(--primary-foreground))]'
                : 'bg-[rgb(var(--foreground))/5] text-[rgb(var(--foreground))/70] hover:bg-[rgb(var(--foreground))/10]'
            }`}
          >
            Token Margin
          </button>
        </div>
      </div>

      {/* Інформація про кількість токенів */}
      <div className="px-6 py-2 text-sm text-[rgb(var(--foreground))/60]">
        Знайдено токенів: {filteredTokens.length}
      </div>

      {/* Помилка або таблиця */}
      {error ? (
        <div className="p-6">
          <div className="p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg text-red-600 dark:text-red-400">
            {error}
          </div>
        </div>
      ) : filteredTokens.length === 0 && !isLoading ? (
        <div className="p-6 text-center text-[rgb(var(--foreground))/50]">
          Немає даних для відображення. Перевірте вкладку або пошуковий запит.
        </div>
      ) : (
        <div className="max-h-[70vh] overflow-x-auto overflow-y-auto" onScroll={handleScroll}>
          <table className="w-full min-w-max table-fixed">
            <thead>
              <tr className="sticky top-0 z-10 bg-[rgb(var(--card))/90] backdrop-blur-sm border-b border-[rgb(var(--border))]">
                <th className="py-4 px-6 text-left font-semibold text-[rgb(var(--foreground))/70] w-40">
                  Монета
                </th>
                {availableExchanges.length > 0 ? (
                  availableExchanges.map((ex) => (
                    <th
                      key={ex.key}
                      className="py-4 px-6 text-center font-semibold text-[rgb(var(--foreground))/70]"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <ExchangeIcon 
                          exchange={ex.displayName} 
                          size={20} 
                          logoUrl={ex.logoUrl}
                        />
                        <span>{ex.displayName}</span>
                      </div>
                    </th>
                  ))
                ) : (
                  <th className="py-4 px-6 text-center font-semibold text-[rgb(var(--foreground))/70]">
                    Немає доступних бірж
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgb(var(--border))]">
              {filteredTokens.slice(0, visibleCount).map((token) => (
                <TokenItem
                  key={`${token.symbol}-${activeTab}`}
                  token={token}
                  exchanges={availableExchanges.map((e) => e.key)}
                  marginType={activeTab}
                  onClick={handleTokenClick}
                  onRateClick={handleRateClick}
                />
              ))}
              {!isLoading && filteredTokens.length === 0 && (
                <tr>
                  <td
                    colSpan={availableExchanges.length + 1 || 2}
                    className="text-center py-12 text-[rgb(var(--foreground))/50]"
                  >
                    Нічого не знайдено
                  </td>
                </tr>
              )}
              {filteredTokens.length > visibleCount && (
                <tr>
                  <td
                    colSpan={availableExchanges.length + 1}
                    className="text-center py-4 text-[rgb(var(--foreground))/50] italic"
                  >
                    Прокрутіть вниз, щоб завантажити більше...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

FundingSection.propTypes = {
  fundingData: PropTypes.arrayOf(
    PropTypes.shape({
      symbol: PropTypes.string.isRequired,
      symbolLogo: PropTypes.string,
      stablecoin_margin_list: PropTypes.arrayOf(
        PropTypes.shape({
          exchange: PropTypes.string,
          exchange_logo: PropTypes.string,
          funding_rate: PropTypes.number,
          funding_rate_interval: PropTypes.number,
          next_funding_time: PropTypes.number,
          predicted_rate: PropTypes.number,
          price: PropTypes.number,
          status: PropTypes.number,
        })
      ),
      token_margin_list: PropTypes.arrayOf(
        PropTypes.shape({
          exchange: PropTypes.string,
          exchange_logo: PropTypes.string,
          funding_rate: PropTypes.number,
          funding_rate_interval: PropTypes.number,
          next_funding_time: PropTypes.number,
          predicted_rate: PropTypes.number,
          price: PropTypes.number,
          status: PropTypes.number,
        })
      ),
    })
  ).isRequired,
  isLoading: PropTypes.bool.isRequired,
  error: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  onSelectToken: PropTypes.func.isRequired,
  onSelectRate: PropTypes.func.isRequired,
};

export default FundingSection;