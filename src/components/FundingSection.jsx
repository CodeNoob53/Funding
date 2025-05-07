import { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import TokenItem from './TokenItem';
import FilterPanel from './FilterPanel';
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
  const [sortBy, setSortBy] = useState(() => localStorage.getItem('sortBy') || 'exchanges');
  const [sortOrder, setSortOrder] = useState(() => localStorage.getItem('sortOrder') || 'desc');
  const [exchangeSortBy, setExchangeSortBy] = useState(() => localStorage.getItem('exchangeSortBy') || 'name');
  const [exchangeSortOrder, setExchangeSortOrder] = useState(() => localStorage.getItem('exchangeSortOrder') || 'asc');

  const availableExchanges = useMemo(() => {
    if (!fundingData?.length) return {};

    const exchangeMap = {};
    fundingData.forEach((item) => {
      const list = activeTab === 'stablecoin' ? item.stablecoin_margin_list : item.token_margin_list;
      if (Array.isArray(list) && list.length > 0) {
        list.forEach((entry) => {
          if (entry.exchange && entry.funding_rate !== undefined && entry.funding_rate !== null) {
            const exchange = entry.exchange.toLowerCase();
            if (!exchangeMap[exchange]) {
              exchangeMap[exchange] = {
                displayName: exchange.charAt(0).toUpperCase() + exchange.slice(1),
                logoUrl: entry.exchange_logo === 'https://cdn.coinglasscdn.com/static/blank.png' ? ExchangeCap : entry.exchange_logo,
                activeCount: 0,
                bestFR: entry.funding_rate,
              };
            }
            exchangeMap[exchange].activeCount += 1;
            exchangeMap[exchange].bestFR = Math.max(Math.abs(exchangeMap[exchange].bestFR || 0), Math.abs(entry.funding_rate));
          }
        });
      }
    });

    // Сортування бірж
    const sortedExchanges = Object.keys(exchangeMap)
      .map((key) => ({ key, ...exchangeMap[key] }))
      .sort((a, b) => {
        const multiplier = exchangeSortOrder === 'asc' ? 1 : -1;
        if (exchangeSortBy === 'name') {
          return multiplier * a.displayName.localeCompare(b.displayName);
        } else if (exchangeSortBy === 'tokens') {
          return multiplier * (a.activeCount - b.activeCount);
        } else if (exchangeSortBy === 'bestFR') {
          return multiplier * ((b.bestFR || 0) - (a.bestFR || 0));
        }
        return 0;
      })
      .reduce((acc, exchange) => {
        acc[exchange.key] = {
          displayName: exchange.displayName,
          logoUrl: exchange.logoUrl,
          activeCount: exchange.activeCount,
          bestFR: exchange.bestFR,
        };
        return acc;
      }, {});

    return sortedExchanges;
  }, [fundingData, activeTab, exchangeSortBy, exchangeSortOrder]);

  const [displayedExchanges, setDisplayedExchanges] = useState(() => {
    const saved = localStorage.getItem('displayedExchanges');
    return saved ? JSON.parse(saved) : {};
  });

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
  const [fundingInterval, setFundingInterval] = useState(() => {
    return localStorage.getItem('fundingInterval') || 'all';
  });
  const [statusFilter, setStatusFilter] = useState(() => {
    return localStorage.getItem('statusFilter') || 'all';
  });

  // Обробка Esc для закриття панелі
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape' && showFilters) {
        setShowFilters(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showFilters]);

  useEffect(() => {
    setDisplayedExchanges((prevDisplayedExchanges) => {
      const newDisplayedExchanges = { ...prevDisplayedExchanges };
      Object.keys(availableExchanges).forEach((key) => {
        if (newDisplayedExchanges[key] === undefined) {
          newDisplayedExchanges[key] = true;
        }
      });
      return newDisplayedExchanges;
    });
  }, [availableExchanges]);

  useEffect(() => {
    localStorage.setItem('minFundingRate', minFundingRate);
    localStorage.setItem('rateSignFilter', rateSignFilter);
    localStorage.setItem('displayMode', displayMode);
    localStorage.setItem('filtersEnabled', filtersEnabled);
    localStorage.setItem('displayedExchanges', JSON.stringify(displayedExchanges));
    localStorage.setItem('fundingInterval', fundingInterval);
    localStorage.setItem('statusFilter', statusFilter);
    localStorage.setItem('sortBy', sortBy);
    localStorage.setItem('sortOrder', sortOrder);
    localStorage.setItem('exchangeSortBy', exchangeSortBy);
    localStorage.setItem('exchangeSortOrder', exchangeSortOrder);
  }, [
    minFundingRate,
    rateSignFilter,
    displayMode,
    filtersEnabled,
    displayedExchanges,
    fundingInterval,
    statusFilter,
    sortBy,
    sortOrder,
    exchangeSortBy,
    exchangeSortOrder,
  ]);

  const filteredTokens = useMemo(() => {
    if (!fundingData?.length) return [];

    return fundingData
      .filter((token) => {
        const matchesSearch = token.symbol?.toLowerCase().includes(searchQuery.toLowerCase()) || !searchQuery;
        const marginList = activeTab === 'stablecoin' ? token.stablecoin_margin_list : token.token_margin_list;
        const hasMarginList = Array.isArray(marginList) && marginList.length > 0;

        if (!hasMarginList || !matchesSearch) return false;
        if (!filtersEnabled) return true;

        return marginList.some((entry) => {
          const rate = entry.funding_rate;
          const interval = entry.funding_rate_interval;
          const status = entry.status;
          const exchange = entry.exchange.toLowerCase();

          if (rate === undefined || rate === null || !displayedExchanges[exchange]) return false;

          const matchesRateSign =
            rateSignFilter === 'all' ||
            (rateSignFilter === 'long' && rate > 0) ||
            (rateSignFilter === 'short' && rate < 0);

          const matchesInterval =
            fundingInterval === 'all' ||
            (fundingInterval !== 'all' && interval === parseInt(fundingInterval));

          const matchesStatus =
            statusFilter === 'all' ||
            (statusFilter === 'active' && status === 1) ||
            (statusFilter === 'predicted' && status === 2);

          return matchesRateSign && Math.abs(rate) >= minFundingRate && matchesInterval && matchesStatus;
        });
      })
      .map((token) => {
        const marginList = activeTab === 'stablecoin' ? token.stablecoin_margin_list : token.token_margin_list;

        const filteredExchanges = Object.keys(availableExchanges)
          .map((key) => {
            const entry = marginList.find((e) => e.exchange?.toLowerCase() === key);
            if (!entry || entry.funding_rate == null || !displayedExchanges[key]) return null;

            const meetsRateSign =
              rateSignFilter === 'all' ||
              (rateSignFilter === 'long' && entry.funding_rate > 0) ||
              (rateSignFilter === 'short' && entry.funding_rate < 0);

            const meetsInterval =
              fundingInterval === 'all' ||
              (fundingInterval !== 'all' && entry.funding_rate_interval === parseInt(fundingInterval));

            const meetsStatus =
              statusFilter === 'all' ||
              (statusFilter === 'active' && entry.status === 1) ||
              (statusFilter === 'predicted' && entry.status === 2);

            if (!meetsRateSign || !meetsInterval || !meetsStatus) return null;

            if (displayMode === 'option2') {
              const meetsMinRate = Math.abs(entry.funding_rate) >= minFundingRate;
              if (!meetsMinRate) return null;
            }

            return { ...availableExchanges[key], data: entry, key };
          })
          .filter(Boolean);

        const bestFR = marginList.reduce((max, entry) => {
          return entry.funding_rate !== undefined && entry.funding_rate !== null
            ? Math.max(max, Math.abs(entry.funding_rate))
            : max;
        }, 0);

        return {
          ...token,
          filteredExchanges,
          activeExchangesCount: filteredExchanges.length,
          bestFR,
        };
      })
      .filter((token) => token.filteredExchanges.length > 0)
      .sort((a, b) => {
        const multiplier = sortOrder === 'asc' ? 1 : -1;
        if (sortBy === 'symbol') {
          return multiplier * a.symbol.localeCompare(b.symbol);
        } else if (sortBy === 'fundingRate') {
          return multiplier * (a.fundingRate - b.fundingRate);
        } else if (sortBy === 'bestFR') {
          return multiplier * (b.bestFR - a.bestFR);
        } else {
          return multiplier * (b.activeExchangesCount - a.activeExchangesCount);
        }
      });
  }, [
    fundingData,
    searchQuery,
    activeTab,
    minFundingRate,
    rateSignFilter,
    filtersEnabled,
    availableExchanges,
    displayMode,
    displayedExchanges,
    fundingInterval,
    statusFilter,
    sortBy,
    sortOrder,
  ]);

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
  }, [searchQuery, activeTab, minFundingRate, rateSignFilter, filtersEnabled, fundingInterval, statusFilter, sortBy, sortOrder]);

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
    <div className={`funding-section-wrapper ${showFilters ? 'with-filter-panel' : ''}`}>
      <section className="funding-section card">
        <div className="container">
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
              title="Відкрити фільтри"
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
                    {Object.keys(availableExchanges).length === 0 ? (
                      <th className="exchange-header">Немає доступних бірж</th>
                    ) : (
                      Object.keys(availableExchanges)
                        .filter((key) => displayedExchanges[key] !== false)
                        .map((key) => (
                          <th key={key} className="exchange-header">
                            <span className="exchange-header-content">
                              <img
                                src={availableExchanges[key].logoUrl}
                                alt={`${availableExchanges[key].displayName} logo`}
                                className="exchange-header-logo"
                              />
                              <span className="exchange-header-name">
                                {availableExchanges[key].displayName}
                              </span>
                            </span>
                          </th>
                        ))
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredTokens.slice(0, visibleCount).map((token) => (
                    <TokenItem
                      key={`${token.symbol}-${activeTab}`}
                      token={token}
                      marginType={activeTab}
                      availableExchanges={availableExchanges}
                      displayedExchanges={displayedExchanges}
                      onClick={handleTokenClick}
                      onRateClick={handleRateClick}
                    />
                  ))}
                  {!isLoading && filteredTokens.length === 0 && (
                    <tr>
                      <td
                        colSpan={
                          Object.keys(availableExchanges).length > 0
                            ? Object.keys(availableExchanges).filter((key) => displayedExchanges[key] !== false).length + 1
                            : 2
                        }
                        className="empty-message"
                      >
                        Нічого не знайдено
                      </td>
                    </tr>
                  )}
                  {filteredTokens.length > visibleCount && (
                    <tr>
                      <td
                        colSpan={
                          Object.keys(availableExchanges).length > 0
                            ? Object.keys(availableExchanges).filter((key) => displayedExchanges[key] !== false).length + 1
                            : 2
                        }
                        className="load-more-message"
                      >
                        Прокрутіть вниз, щоб завантажити більше...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
      {showFilters && (
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
          selectedExchanges={displayedExchanges}
          setSelectedExchanges={setDisplayedExchanges}
          availableExchanges={availableExchanges}
          onClose={() => setShowFilters(false)}
        />
      )}
    </div>
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