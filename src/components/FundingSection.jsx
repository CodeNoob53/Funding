// src/components/FundingSection.jsx
import { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import TokenItem from './TokenItem';
import ExchangeIcon from './ExchangeIcon';
import './FundingSection.css';
import { IoFilter } from 'react-icons/io5'; // Іконка для фільтра
import { Tooltip } from 'react-tippy'; // Імпорт Tooltip для підказок
import 'react-tippy/dist/tippy.css';

function FundingSection({ fundingData, isLoading, error, onSelectToken, onSelectRate }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('stablecoin');
  const [visibleCount, setVisibleCount] = useState(50);
  const [showFilters, setShowFilters] = useState(false);
  const [minFundingRate, setMinFundingRate] = useState(() => {
    return parseFloat(localStorage.getItem('minFundingRate')) || 0.15;
  });
  const [rateSignFilter, setRateSignFilter] = useState(() => {
    return localStorage.getItem('rateSignFilter') || 'all';
  });
  const [displayMode, setDisplayMode] = useState(() => {
    return localStorage.getItem('displayMode') || 'option1';
  });
  const [filtersEnabled, setFiltersEnabled] = useState({
    minRate: localStorage.getItem('filterMinRateEnabled') === 'true' || true,
    rateSign: localStorage.getItem('filterRateSignEnabled') === 'true' || true,
  });

  // Збереження налаштувань у localStorage
  useEffect(() => {
    localStorage.setItem('minFundingRate', minFundingRate);
    localStorage.setItem('rateSignFilter', rateSignFilter);
    localStorage.setItem('displayMode', displayMode);
    localStorage.setItem('filterMinRateEnabled', filtersEnabled.minRate);
    localStorage.setItem('filterRateSignEnabled', filtersEnabled.rateSign);
  }, [minFundingRate, rateSignFilter, displayMode, filtersEnabled]);

  // Оптимізація для обчислення доступних бірж з сортуванням
  const availableExchanges = useMemo(() => {
    if (!fundingData?.length) return [];

    const exchangeCounts = new Map();
    const logoMap = new Map();

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
      .sort((a, b) => b.activeCount - a.activeExchangesCount);
  }, [fundingData, activeTab]);

  // Оптимізація для фільтрації та сортування токенів
  const filteredTokens = useMemo(() => {
    if (!fundingData?.length) return [];

    return fundingData
      .filter((token) => {
        const matchesSearch = token.symbol?.toLowerCase().includes(searchQuery.toLowerCase()) || !searchQuery;
        const marginList = activeTab === 'stablecoin' ? token.stablecoin_margin_list : token.token_margin_list;
        const hasMarginList = Array.isArray(marginList) && marginList.length > 0;

        if (!hasMarginList || !matchesSearch) return false;

        // Фільтр за мінімальною ставкою, якщо увімкнено
        // minFundingRate і funding_rate обидва в процентах (наприклад, 0.096 і -0.0082)
        const hasHighFundingRate = marginList.some(
          (entry) => entry.funding_rate !== undefined && entry.funding_rate !== null && Math.abs(entry.funding_rate) >= minFundingRate
        );

        // Фільтр за знаком ставки, якщо увімкнено
        const matchesRateSign = marginList.some((entry) => {
          if (entry.funding_rate === undefined || entry.funding_rate === null) return false;
          if (!filtersEnabled.rateSign) return true;
          if (rateSignFilter === 'all') return true;
          if (rateSignFilter === 'positive') return entry.funding_rate > 0;
          if (rateSignFilter === 'negative') return entry.funding_rate < 0;
          return false;
        });

        // Застосування фільтрів лише якщо вони увімкнені
        const minRateCondition = !filtersEnabled.minRate || hasHighFundingRate;
        const signCondition = matchesRateSign;

        return minRateCondition && signCondition;
      })
      .map((token) => {
        const marginList = activeTab === 'stablecoin' ? token.stablecoin_margin_list : token.token_margin_list;
        const activeExchangesCount = Array.isArray(marginList)
          ? marginList.filter(
              (entry) => entry.funding_rate !== undefined && entry.funding_rate !== null
            ).length
          : 0;

        // Фільтрація бірж залежно від displayMode
        const filteredExchanges = displayMode === 'option2'
          ? availableExchanges
              .map((ex) => ({
                ...ex,
                data: marginList.find((entry) => entry.exchange?.toLowerCase() === ex.key),
              }))
              .filter((ex) => ex.data && Math.abs(ex.data.funding_rate) >= minFundingRate)
          : availableExchanges.map((ex) => ({
              ...ex,
              data: marginList.find((entry) => entry.exchange?.toLowerCase() === ex.key),
            }));

        return { ...token, activeExchangesCount, filteredExchanges };
      })
      .sort((a, b) => b.activeExchangesCount - a.activeExchangesCount);
  }, [fundingData, searchQuery, activeTab, minFundingRate, rateSignFilter, displayMode, filtersEnabled, availableExchanges]);

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
  }, [searchQuery, activeTab, minFundingRate, rateSignFilter, displayMode, filtersEnabled]);

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
        <div className="search-and-filters">
          <div className="search-wrapper">
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="funding-search"
            />
            <span className="search-icon"></span>
          </div>
          <Tooltip
            title="Відкрити налаштування фільтрів"
            position="top"
            trigger="mouseenter"
            theme="light"
            arrow
            data-theme="light" // Передача теми для стилів
          >
            <button
              className="filter-button"
              onClick={() => setShowFilters(!showFilters)}
            >
              <IoFilter size={20} />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Панель фільтрів */}
      {showFilters && (
        <div className="filter-panel">
          <div className="filter-group">
            <label>
              <input
                type="checkbox"
                checked={filtersEnabled.minRate}
                onChange={(e) => setFiltersEnabled((prev) => ({ ...prev, minRate: e.target.checked }))}
              />
              Фільтр за мінімальною ставкою (наприклад, 0.096 = 0.096%)
            </label>
            <input
              type="number"
              value={minFundingRate}
              onChange={(e) => setMinFundingRate(parseFloat(e.target.value) || 0)}
              step="0.01"
              min="0"
              className="filter-input"
              disabled={!filtersEnabled.minRate}
            />
          </div>
          <div className="filter-group">
            <label>
              <input
                type="checkbox"
                checked={filtersEnabled.rateSign}
                onChange={(e) => setFiltersEnabled((prev) => ({ ...prev, rateSign: e.target.checked }))}
              />
              Фільтр за типом ставки
            </label>
            <select
              value={rateSignFilter}
              onChange={(e) => setRateSignFilter(e.target.value)}
              className="filter-select"
              disabled={!filtersEnabled.rateSign}
            >
              <option value="all">Всі</option>
              <option value="positive">Позитивні</option>
              <option value="negative">Негативні</option>
            </select>
          </div>
          <div className="filter-group">
            <label>
              Режим відображення:
              <select
                value={displayMode}
                onChange={(e) => setDisplayMode(e.target.value)}
                className="filter-select"
              >
                <option value="option1">Всі біржі (якщо ≥ на одній)</option>
                <option value="option2">Тільки біржі ≥ значення</option>
              </select>
            </label>
          </div>
        </div>
      )}

      {/* Вкладки */}
      <div className="funding-tabs">
        <Tooltip
          title="Показати ставки для Stablecoin Margin"
          position="top"
          trigger="mouseenter"
          theme="light"
          arrow
          data-theme="light"
        >
          <button
            onClick={() => setActiveTab('stablecoin')}
            className={`tab-button ${activeTab === 'stablecoin' ? 'tab-button-active' : 'tab-button-inactive'}`}
          >
            Stablecoin Margin
          </button>
        </Tooltip>
        <Tooltip
          title="Показати ставки для Token Margin"
          position="top"
          trigger="mouseenter"
          theme="light"
          arrow
          data-theme="light"
        >
          <button
            onClick={() => setActiveTab('token')}
            className={`tab-button ${activeTab === 'token' ? 'tab-button-active' : 'tab-button-inactive'}`}
          >
            Token Margin
          </button>
        </Tooltip>
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
                  exchanges={token.filteredExchanges.map((e) => e.key)}
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