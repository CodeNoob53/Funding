import { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import TokenItem from './TokenItem';
import './FundingSection.css';
import { IoFilter } from 'react-icons/io5';
import { Tooltip } from 'react-tippy';
import 'react-tippy/dist/tippy.css';
import ExchangeCap from '../assets/cap/ExchangeCap.avif';

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
  const [filtersEnabled, setFiltersEnabled] = useState(() => {
    return localStorage.getItem('filtersEnabled') === 'true' || false;
  });

  useEffect(() => {
    localStorage.setItem('minFundingRate', minFundingRate);
    localStorage.setItem('rateSignFilter', rateSignFilter);
    localStorage.setItem('displayMode', displayMode);
    localStorage.setItem('filtersEnabled', filtersEnabled);
  }, [minFundingRate, rateSignFilter, displayMode, filtersEnabled]);

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
            let shouldCount = true;

            if (filtersEnabled) {
              const meetsMinRate = Math.abs(entry.funding_rate) >= minFundingRate;
              const meetsRateSign = rateSignFilter === 'all' ||
                (rateSignFilter === 'long' && entry.funding_rate > 0) ||
                (rateSignFilter === 'short' && entry.funding_rate < 0);
              shouldCount = meetsMinRate && meetsRateSign;
            }

            if (shouldCount) {
              exchangeCounts.set(exchange, (exchangeCounts.get(exchange) || 0) + 1);
              if (entry.exchange_logo && !logoMap.has(exchange)) {
                const logo = entry.exchange_logo === 'https://cdn.coinglasscdn.com/static/blank.png'
                  ? ExchangeCap
                  : entry.exchange_logo;
                logoMap.set(exchange, logo);
              }
            }
          }
        });
      }
    });

    return Array.from(exchangeCounts)
      .map(([exchange, count]) => ({
        key: exchange,
        displayName: exchange.charAt(0).toUpperCase() + exchange.slice(1),
        logoUrl: logoMap.get(exchange) || ExchangeCap,
        activeCount: count,
      }))
      .sort((a, b) => b.activeCount - a.activeCount)
      .filter(ex => ex.activeCount > 0);
  }, [fundingData, activeTab, minFundingRate, rateSignFilter, filtersEnabled]);

  const filteredTokens = useMemo(() => {
    if (!fundingData?.length) return [];
  
    return fundingData
      .filter((token) => {
        const matchesSearch = token.symbol?.toLowerCase().includes(searchQuery.toLowerCase()) || !searchQuery;
        const marginList = activeTab === 'stablecoin' ? token.stablecoin_margin_list : token.token_margin_list;
        const hasMarginList = Array.isArray(marginList) && marginList.length > 0;
  
        if (!hasMarginList || !matchesSearch) return false;
        if (!filtersEnabled) return true;
  
        // apply rateSignFilter before checking minFundingRate
        const filteredBySign = marginList.filter((entry) => {
          const rate = entry.funding_rate;
          if (rate === undefined || rate === null) return false;
  
          return (
            rateSignFilter === 'all' ||
            (rateSignFilter === 'long' && rate > 0) ||
            (rateSignFilter === 'short' && rate < 0)
          );
        });
  
        return filteredBySign.some(entry => Math.abs(entry.funding_rate) >= minFundingRate);
      })
      .map((token) => {
        const marginList = activeTab === 'stablecoin' ? token.stablecoin_margin_list : token.token_margin_list;
  
        const filteredExchanges = availableExchanges
          .map((ex) => {
            const entry = marginList.find((e) => e.exchange?.toLowerCase() === ex.key);
            if (!entry || entry.funding_rate == null) return null;
  
            const meetsRateSign =
              rateSignFilter === 'all' ||
              (rateSignFilter === 'long' && entry.funding_rate > 0) ||
              (rateSignFilter === 'short' && entry.funding_rate < 0);
  
            if (!meetsRateSign) return null;
  
            if (displayMode === 'option2') {
              const meetsMinRate = Math.abs(entry.funding_rate) >= minFundingRate;
              if (!meetsMinRate) return null;
            }
  
            return { ...ex, data: entry };
          })
          .filter(Boolean);
  
        return {
          ...token,
          filteredExchanges,
          activeExchangesCount: filteredExchanges.length,
        };
      })
      .filter((token) => token.filteredExchanges.length > 0)
      .sort((a, b) => b.filteredExchanges.length - a.filteredExchanges.length);
  }, [fundingData, searchQuery, activeTab, minFundingRate, rateSignFilter, filtersEnabled, availableExchanges, displayMode]);  

  const handleScroll = useCallback(
    (e) => {
      const { scrollTop, scrollHeight, clientHeight } = e.target;
      if (scrollHeight - scrollTop <= clientHeight * 1.5 && visibleCount < filteredTokens.length) {
        setVisibleCount((prev) => Math.min(prev + 20, filteredTokens.length));
      }
    },
    [filteredTokens.length, visibleCount]
  );

  useEffect(() => {
    setVisibleCount(50);
  }, [searchQuery, activeTab, minFundingRate, rateSignFilter, filtersEnabled]);

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
        </div>
      </div>

      <div className="funding-tabs">
        <Tooltip
          title="Показати ставки для Stablecoin Margin"
          position="top"
          trigger="mouseenter"
          theme="light"
          arrow
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
        >
          <button
            onClick={() => setActiveTab('token')}
            className={`tab-button ${activeTab === 'token' ? 'tab-button-active' : 'tab-button-inactive'}`}
          >
            Token Margin
          </button>
        </Tooltip>
        <Tooltip
          title="Відкрити налаштування фільтрів"
          position="top"
          trigger="mouseenter"
          theme="light"
          arrow
        >
          <button
            className="filter-button"
            onClick={() => setShowFilters(!showFilters)}
          >
            <IoFilter size={20} />
          </button>
        </Tooltip>
      </div>

      {showFilters && (
        <div className="filter-panel">
          <div className="filter-group">
            <label>
              Minimum Funding Rate
              <div className="radio-group">
                <label>
                  <input
                    type="radio"
                    name="filtersEnabled"
                    value="off"
                    checked={!filtersEnabled}
                    onChange={() => setFiltersEnabled(false)}
                  />
                  Off
                </label>
                <label>
                  <input
                    type="radio"
                    name="filtersEnabled"
                    value="on"
                    checked={filtersEnabled}
                    onChange={() => setFiltersEnabled(true)}
                  />
                  On
                </label>
              </div>
            </label>
          </div>
          <div className="filter-group">
            <label>
              Фільтр за мінімальною ставкою (наприклад, 0.096 = 0.096%)
            </label>
            <input
              type="number"
              value={minFundingRate}
              onChange={(e) => setMinFundingRate(parseFloat(e.target.value) || 0)}
              step="0.01"
              min="0"
              className="filter-input"
              disabled={!filtersEnabled}
            />
          </div>
          <div className="filter-group">
            <label>
              Фільтр за типом ставки
            </label>
            <select
              value={rateSignFilter}
              onChange={(e) => setRateSignFilter(e.target.value)}
              className="filter-select"
              disabled={!filtersEnabled}
            >
              <option value="all">усі</option>
              <option value="long">long</option>
              <option value="short">short</option>
            </select>
          </div>
          <div className="filter-group">
            <label>
              Режим відображення:
              <select
                value={displayMode}
                onChange={(e) => setDisplayMode(e.target.value)}
                className="filter-select filter-select-wide"
                disabled={!filtersEnabled}
              >
                <option value="option1">Всі біржі (якщо ≥ на одній)</option>
                <option value="option2">Тільки біржі ≥ значення</option>
              </select>
            </label>
          </div>
        </div>
      )}

      <div className="funding-info">Знайдено токенів: {filteredTokens.length}</div>

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
                      <span className="exchange-header-content">
                        <img src={ex.logoUrl} alt={`${ex.displayName} logo`} className="exchange-header-logo" />
                        <span className="exchange-header-name">{ex.displayName}</span>
                      </span>
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