// src/components/FundingSection.jsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import TokenItem from './TokenItem';
import ExchangeIcon from './ExchangeIcon';
import './FundingSection.css';

function FundingSection({ fundingData, isLoading, error, onSelectToken, onSelectRate }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('stablecoin');
  const [visibleCount, setVisibleCount] = useState(50);

  // Оптимізація для обчислення доступних бірж з сортуванням
  const availableExchanges = useMemo(() => {
    if (!fundingData?.length) return [];

    const exchangeCounts = new Map(); // Зберігаємо кількість активних монет для кожної біржі
    const logoMap = new Map(); // Зберігаємо логотипи бірж

    fundingData.forEach((item) => {
      const list = activeTab === 'stablecoin' ? item.stablecoin_margin_list : item.token_margin_list;
      if (Array.isArray(list) && list.length > 0) {
        list.forEach((entry) => {
          if (entry.exchange && entry.funding_rate !== undefined && entry.funding_rate !== null) {
            const exchange = entry.exchange.toLowerCase();
            exchangeCounts.set(exchange, (exchangeCounts.get(exchange) || 0) + 1);
            if (entry.exchange_logo && !logoMap.has(entry.exchange)) {
              logoMap.set(entry.exchange, entry.exchange_logo);
            }
          }
        });
      }
    });

    return Array.from(exchangeCounts)
      .map(([exchange, count]) => ({
        key: exchange,
        displayName: exchange.charAt(0).toUpperCase() + exchange.slice(1),
        logoUrl: logoMap.get(exchange.charAt(0).toUpperCase() + exchange.slice(1)) || null,
        activeCount: count,
      }))
      .sort((a, b) => b.activeCount - a.activeCount); // Сортуємо за спаданням кількості активних монет
  }, [fundingData, activeTab]);

  // Оптимізація для фільтрації та сортування токенів
  const filteredTokens = useMemo(() => {
    if (!fundingData?.length) return [];

    const filtered = fundingData
      .filter((token) => {
        const matchesSearch = token.symbol?.toLowerCase().includes(searchQuery.toLowerCase()) || !searchQuery;
        const marginList = activeTab === 'stablecoin' ? token.stablecoin_margin_list : token.token_margin_list;
        const hasMarginList = Array.isArray(marginList) && marginList.length > 0;
        return matchesSearch && hasMarginList;
      })
      .map((token) => {
        const marginList = activeTab === 'stablecoin' ? token.stablecoin_margin_list : token.token_margin_list;
        const activeExchangesCount = Array.isArray(marginList)
          ? marginList.filter(
              (entry) => entry.funding_rate !== undefined && entry.funding_rate !== null
            ).length
          : 0;
        return { ...token, activeExchangesCount };
      });

    // Сортуємо за кількістю бірж з активними funding rates
    return filtered.sort((a, b) => b.activeExchangesCount - a.activeExchangesCount);
  }, [fundingData, searchQuery, activeTab]);

  // Завантаження більше рядків при прокрутці
  const handleScroll = useCallback(
    (e) => {
      const { scrollTop, scrollHeight, clientHeight } = e.target;
      if (scrollHeight - scrollTop <= clientHeight * 1.5 && visibleCount < filteredTokens.length) {
        setVisibleCount((prev) => Math.min(prev + 20, filteredTokens.length));
      }
    },
    [filteredTokens.length, visibleCount]
  );

  // Скидаємо лічильник видимих рядків при зміні фільтра або вкладки
  useEffect(() => {
    setVisibleCount(50);
  }, [searchQuery, activeTab]);

  // Оптимізація обробників подій
  const handleTokenClick = useCallback(
    (token) => {
      onSelectToken(token);
    },
    [onSelectToken]
  );

  const handleRateClick = useCallback(
    (data) => {
      onSelectRate(data);
    },
    [onSelectRate]
  );

  return (
    <section className="funding-section card">
      {/* Заголовок і пошук */}
      <div className="funding-header">
        <h2 className="funding-title">
          Ставки фінансування
          {isLoading && <div className="loading-spinner"></div>}
        </h2>
        <input
          type="text"
          placeholder="Пошук токена..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="funding-search"
        />
      </div>

      {/* Вкладки */}
      <div className="funding-tabs">
        <button
          onClick={() => setActiveTab('stablecoin')}
          className={`tab-button ${activeTab === 'stablecoin' ? 'tab-button-active' : 'tab-button-inactive'}`}
        >
          Stablecoin Margin
        </button>
        <button
          onClick={() => setActiveTab('token')}
          className={`tab-button ${activeTab === 'token' ? 'tab-button-active' : 'tab-button-inactive'}`}
        >
          Token Margin
        </button>
      </div>

      {/* Інформація про кількість токенів */}
      <div className="funding-info">Знайдено токенів: {filteredTokens.length}</div>

      {/* Помилка або таблиця */}
      {error ? (
        <div className="funding-error">
          <div className="error-message">{error}</div>
        </div>
      ) : filteredTokens.length === 0 && !isLoading ? (
        <div className="funding-empty">
          Немає даних для відображення. Перевірте вкладку або пошуковий запит.
        </div>
      ) : (
        <div className="funding-table-container" onScroll={handleScroll}>
          <table className="funding-table">
            <thead className="funding-table-header">
              <tr className="funding-table-row">
                <th className="coin-header">Монета</th>
                {availableExchanges.length > 0 ? (
                  availableExchanges.map((ex) => (
                    <th key={ex.key} className="exchange-header">
                      <ExchangeIcon exchange={ex.displayName} size={20} logoUrl={ex.logoUrl} />
                      <span>{ex.displayName}</span>
                    </th>
                  ))
                ) : (
                  <th className="exchange-header">Немає доступних бірж</th>
                )}
              </tr>
            </thead>
            <tbody>
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
                  <td colSpan={availableExchanges.length + 1 || 2} className="empty-message">
                    Нічого не знайдено
                  </td>
                </tr>
              )}
              {filteredTokens.length > visibleCount && (
                <tr>
                  <td colSpan={availableExchanges.length + 1} className="load-more-message">
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