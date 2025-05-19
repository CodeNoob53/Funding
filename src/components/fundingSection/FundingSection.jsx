// src/components/fundingSection/FundingSection.jsx - Виправлена версія
import { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import TokenItem from './TokenItem';
import './FundingSection.css';
import { IoFilter } from 'react-icons/io5';
import { Tooltip } from 'react-tippy';
import 'react-tippy/dist/tippy.css';
import ExchangeCap from '../../assets/cap/ExchangeCap.avif';
import useAppStore from '../../store/appStore';
import { UI_CONFIG } from '../../config/appConfig';
import logger from '../../services/logger';

function FundingSection({ onToggleFilters }) {
  const {
    fundingData,
    isLoading,
    error,
    setSelectedToken,
    selectRate,
    availableExchanges,
    sortedExchangeKeys,
    setAvailableExchanges,
    filters,
  } = useAppStore((state) => ({
    fundingData: state.fundingData,
    isLoading: state.isLoading,
    error: state.error,
    setSelectedToken: state.setSelectedToken,
    selectRate: state.selectRate,
    availableExchanges: state.availableExchanges,
    sortedExchangeKeys: state.sortedExchangeKeys,
    setAvailableExchanges: state.setAvailableExchanges,
    filters: state.filters,
  }));

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('stablecoin');
  const [visibleCount, setVisibleCount] = useState(UI_CONFIG.MAX_VISIBLE_TOKENS);

  const {
    enabled: filtersEnabled,
    minFundingRate,
    rateSignFilter,
    displayMode,
    fundingInterval,
    statusFilter,
    sortBy,
    sortOrder,
    exchangeSortBy,
    exchangeSortOrder,
    stablecoinExchanges,
    tokenExchanges,
  } = filters;

  useEffect(() => {
    // Захисна перевірка на масив
    if (!Array.isArray(fundingData)) {
      logger.warn('fundingData не є масивом в FundingSection:', fundingData);
      return;
    }

    const newAvailableExchanges = {};
    if (fundingData.length) {
      fundingData.forEach((item) => {
        const list = activeTab === 'stablecoin' ? item.stablecoin_margin_list : item.token_margin_list;
        if (Array.isArray(list) && list.length > 0) {
          list.forEach((entry) => {
            if (entry.exchange && entry.funding_rate != null) {
              const exchange = entry.exchange.toLowerCase();
              if (!newAvailableExchanges[exchange]) {
                newAvailableExchanges[exchange] = {
                  displayName: exchange.charAt(0).toUpperCase() + exchange.slice(1),
                  logoUrl:
                    entry.exchange_logo === 'https://cdn.coinglasscdn.com/static/blank.png'
                      ? ExchangeCap
                      : entry.exchange_logo,
                  activeCount: 0,
                  bestFR: entry.funding_rate,
                };
              }
              newAvailableExchanges[exchange].activeCount += 1;
              newAvailableExchanges[exchange].bestFR = Math.max(
                Math.abs(newAvailableExchanges[exchange].bestFR || 0),
                Math.abs(entry.funding_rate)
              );
            }
          });
        }
      });

      setAvailableExchanges(newAvailableExchanges, exchangeSortBy, exchangeSortOrder);
    }
  }, [fundingData, activeTab, exchangeSortBy, exchangeSortOrder, setAvailableExchanges]);

  const filteredTokens = useMemo(() => {
    // Захисна перевірка: якщо fundingData не є масивом, повертаємо порожній масив
    if (!Array.isArray(fundingData)) {
      logger.warn('fundingData не є масивом у filteredTokens:', fundingData);
      return [];
    }

    if (!fundingData.length) return [];

    return fundingData
      .filter((token) => {
        // Додаткова перевірка на валідність токена
        if (!token || typeof token !== 'object') {
          logger.warn('Невалідний токен у fundingData:', token);
          return false;
        }

        const matchesSearch = token.symbol?.toLowerCase().includes(searchQuery.toLowerCase()) || !searchQuery;
        const marginList = activeTab === 'stablecoin' ? token.stablecoin_margin_list : token.token_margin_list;
        
        // Перевірка на валідність marginList
        if (!Array.isArray(marginList)) {
          logger.warn('marginList не є масивом для токена:', token.symbol);
          return false;
        }

        if (!marginList.length || !matchesSearch) return false;
        if (!filtersEnabled) return true;

        return marginList.some((entry) => {
          const rate = entry.funding_rate;
          const interval = entry.funding_rate_interval;
          const status = entry.status;
          const exchange = entry.exchange.toLowerCase();
          const isExchangeVisible =
            activeTab === 'stablecoin' ? stablecoinExchanges[exchange] !== false : tokenExchanges[exchange] !== false;

          if (rate == null || !isExchangeVisible) return false;

          const matchesRateSign =
            rateSignFilter === 'all' ||
            (rateSignFilter === 'long' && rate > 0) ||
            (rateSignFilter === 'short' && rate < 0);
          const matchesInterval =
            fundingInterval === 'all' || (fundingInterval !== 'all' && interval === parseInt(fundingInterval));
          const matchesStatus =
            statusFilter === 'all' ||
            (statusFilter === 'active' && status === 1) ||
            (statusFilter === 'predicted' && status === 2);

          return matchesRateSign && Math.abs(rate) >= minFundingRate && matchesInterval && matchesStatus;
        });
      })
      .map((token) => {
        const marginList = activeTab === 'stablecoin' ? token.stablecoin_margin_list : token.token_margin_list;
        const filteredExchanges = sortedExchangeKeys
          .filter((key) =>
            activeTab === 'stablecoin' ? stablecoinExchanges[key] !== false : tokenExchanges[key] !== false
          )
          .map((key) => {
            const entry = marginList.find((e) => e.exchange?.toLowerCase() === key);
            if (!entry || entry.funding_rate == null) return null;

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
            if (displayMode === 'option2' && Math.abs(entry.funding_rate) < minFundingRate) return null;

            return { ...availableExchanges[key], data: entry, key };
          })
          .filter(Boolean);

        const bestFR = marginList.reduce(
          (max, entry) => (entry.funding_rate != null ? Math.max(max, Math.abs(entry.funding_rate)) : max),
          0
        );

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
        if (sortBy === 'symbol') return multiplier * a.symbol.localeCompare(b.symbol);
        if (sortBy === 'fundingRate') return multiplier * (a.fundingRate - b.fundingRate);
        if (sortBy === 'bestFR') return multiplier * (b.bestFR - a.bestFR);
        return multiplier * (b.activeExchangesCount - a.activeExchangesCount);
      });
  }, [
    fundingData,
    searchQuery,
    activeTab,
    minFundingRate,
    rateSignFilter,
    filtersEnabled,
    availableExchanges,
    sortedExchangeKeys,
    displayMode,
    stablecoinExchanges,
    tokenExchanges,
    fundingInterval,
    statusFilter,
    sortBy,
    sortOrder,
  ]);

  const handleScroll = useCallback(
    (e) => {
      const { scrollTop, scrollHeight, clientHeight } = e.target;
      if (scrollHeight - scrollTop <= clientHeight * 1.5 && visibleCount < filteredTokens.length) {
        setVisibleCount((prev) => Math.min(prev + UI_CONFIG.TOKENS_LOAD_STEP, filteredTokens.length));
      }
    },
    [filteredTokens.length]
  );

  useEffect(() => {
    setVisibleCount(UI_CONFIG.MAX_VISIBLE_TOKENS);
  }, [searchQuery, activeTab, minFundingRate, rateSignFilter, filtersEnabled, fundingInterval, statusFilter, sortBy, sortOrder]);

  const handleTokenClick = useCallback((token) => setSelectedToken(token), [setSelectedToken]);
  const handleRateClick = useCallback((data) => selectRate(data), [selectRate]);

  // Обробка випадку коли fundingData не є масивом
  if (!Array.isArray(fundingData)) {
    return (
      <section className="funding-section card">
        <div className="container">
          <div className="funding-header">
            <h2 className="funding-title">Ставки фінансування</h2>
          </div>
          <div className="funding-error">
            <div className="error-message">
              Помилка формату даних. Очікується масив, отримано: {typeof fundingData}
            </div>
            <small>Перевірте консоль для деталей</small>
          </div>
        </div>
      </section>
    );
  }

  return (
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
          <Tooltip title="Показати ставки для Stablecoin Margin" position="top" trigger="mouseenter" theme="light" arrow>
            <button
              onClick={() => setActiveTab('stablecoin')}
              className={`tab-button ${activeTab === 'stablecoin' ? 'tab-button-active' : 'tab-button-inactive'}`}
            >
              Stablecoin Margin
            </button>
          </Tooltip>
          <Tooltip title="Показати ставки для Token Margin" position="top" trigger="mouseenter" theme="light" arrow>
            <button
              onClick={() => setActiveTab('token')}
              className={`tab-button ${activeTab === 'token' ? 'tab-button-active' : 'tab-button-inactive'}`}
            >
              Token Margin
            </button>
          </Tooltip>
          <Tooltip title="Відкрити фільтри" position="top" trigger="mouseenter" theme="light" arrow>
            <button className="filter-button" onClick={onToggleFilters}>
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
          <div className="funding-empty">Немає даних для відображення. Перевірте вкладку або пошуковий запит.</div>
        ) : (
          <div className="funding-table-container" onScroll={handleScroll}>
            <table className="funding-table">
              <thead className="funding-table-header">
                <tr className="funding-table-row">
                  <th className="coin-header">Монета</th>
                  {sortedExchangeKeys.length === 0 ? (
                    <th className="exchange-header">Немає доступних бірж</th>
                  ) : (
                    sortedExchangeKeys
                      .filter((key) =>
                        activeTab === 'stablecoin' ? stablecoinExchanges[key] !== false : tokenExchanges[key] !== false
                      )
                      .map((key) => (
                        <th key={key} className="exchange-header">
                          <span className="exchange-header-content">
                            <img
                              src={availableExchanges[key]?.logoUrl}
                              alt={`${availableExchanges[key]?.displayName} logo`}
                              className="exchange-header-logo"
                            />
                            <span className="exchange-header-name">{availableExchanges[key]?.displayName}</span>
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
                    onClick={handleTokenClick}
                    onRateClick={handleRateClick}
                  />
                ))}
                {!isLoading && filteredTokens.length === 0 && (
                  <tr>
                    <td
                      colSpan={sortedExchangeKeys.filter((key) =>
                        activeTab === 'stablecoin' ? stablecoinExchanges[key] !== false : tokenExchanges[key] !== false
                      ).length + 1}
                      className="empty-message"
                    >
                      Нічого не знайдено
                    </td>
                  </tr>
                )}
                {filteredTokens.length > visibleCount && (
                  <tr>
                    <td
                      colSpan={sortedExchangeKeys.filter((key) =>
                        activeTab === 'stablecoin' ? stablecoinExchanges[key] !== false : tokenExchanges[key] !== false
                      ).length + 1}
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
  );
}

FundingSection.propTypes = {
  onToggleFilters: PropTypes.func.isRequired,
};

export default FundingSection;