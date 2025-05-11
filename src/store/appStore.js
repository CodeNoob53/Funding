// src/store/appStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_SETTINGS, STORAGE_KEYS } from '../config/appConfig';
import logger from '../services/logger';

const useAppStore = create(
  persist(
    (set, get) => ({
      fundingData: [],
      isLoading: false,
      error: null,
      selectedToken: null,
      isFilterPanelOpen: false,
      filters: DEFAULT_SETTINGS.filters,
      availableExchanges: {},
      sortedExchangeKeys: [],

      setFundingData: (data) => set({ fundingData: data }),
      setIsLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      setSelectedToken: (token) => {
        logger.debug(`Вибрано токен: ${token?.symbol}`);
        set({ selectedToken: token });
      },
      selectRate: (data) => {
        const { token, exchange, funding_rate } = data;
        logger.debug(`Вибрано ставку: ${token.symbol} на ${exchange} (${funding_rate})`);
        set({ selectedToken: { ...token, selectedExchange: exchange, selectedRate: funding_rate } });
      },
      toggleFilterPanel: () => {
        const newState = !get().isFilterPanelOpen;
        logger.debug(`Панель фільтрів: ${newState ? 'відкрита' : 'закрита'}`);
        set({ isFilterPanelOpen: newState });
      },
      updateFilter: (key, value) => {
        logger.debug(`Оновлено фільтр: ${key} = ${value}`);
        set((state) => ({
          filters: { ...state.filters, [key]: value },
        }));
      },
      updateExchangeVisibility: (exchange, isVisible, marginType = 'stablecoin') => {
        logger.debug(`Оновлення видимості біржі ${exchange} для ${marginType}: ${isVisible}`);
        const exchangeTypeKey = marginType === 'stablecoin' ? 'stablecoinExchanges' : 'tokenExchanges';
        set((state) => {
          const currentFilters = state.filters;
          const updatedExchanges = {
            ...currentFilters[exchangeTypeKey],
            [exchange]: isVisible,
          };
          const otherTypeKey = marginType === 'stablecoin' ? 'tokenExchanges' : 'stablecoinExchanges';
          const selectedExchanges = {
            ...currentFilters.selectedExchanges,
            [exchange]: updatedExchanges[exchange] || currentFilters[otherTypeKey][exchange] || false,
          };
          logger.debug(`Новий стан для ${exchange}:`, {
            [exchangeTypeKey]: updatedExchanges,
            selectedExchanges,
          });
          return {
            filters: {
              ...currentFilters,
              [exchangeTypeKey]: updatedExchanges,
              selectedExchanges,
            },
          };
        });
      },
      resetTabFilters: (tabType) => {
        logger.debug(`Скидання фільтрів для вкладки: ${tabType}`);
        set((state) => {
          const newFilters = { ...state.filters };
          if (tabType === 'filter') {
            newFilters.enabled = DEFAULT_SETTINGS.filters.enabled;
            newFilters.minFundingRate = DEFAULT_SETTINGS.filters.minFundingRate;
            newFilters.rateSignFilter = DEFAULT_SETTINGS.filters.rateSignFilter;
            newFilters.displayMode = DEFAULT_SETTINGS.filters.displayMode;
          } else if (tabType === 'sorting') {
            newFilters.fundingInterval = DEFAULT_SETTINGS.filters.fundingInterval;
            newFilters.statusFilter = DEFAULT_SETTINGS.filters.statusFilter;
            newFilters.sortBy = DEFAULT_SETTINGS.filters.sortBy;
            newFilters.sortOrder = DEFAULT_SETTINGS.filters.sortOrder;
            newFilters.exchangeSortBy = DEFAULT_SETTINGS.filters.exchangeSortBy;
            newFilters.exchangeSortOrder = DEFAULT_SETTINGS.filters.exchangeSortOrder;
          } else if (tabType === 'display') {
            newFilters.stablecoinExchanges = { ...DEFAULT_SETTINGS.filters.stablecoinExchanges };
            newFilters.tokenExchanges = { ...DEFAULT_SETTINGS.filters.tokenExchanges };
            newFilters.selectedExchanges = Object.keys({
              ...DEFAULT_SETTINGS.filters.stablecoinExchanges,
              ...DEFAULT_SETTINGS.filters.tokenExchanges,
            }).reduce((acc, key) => ({
              ...acc,
              [key]:
                DEFAULT_SETTINGS.filters.stablecoinExchanges[key] ||
                DEFAULT_SETTINGS.filters.tokenExchanges[key],
            }), {});
          }
          return { filters: newFilters };
        });
      },
      setAvailableExchanges: (exchanges, sortBy, sortOrder) => {
        const sortedKeys = Object.keys(exchanges)
          .map((key) => ({ key, ...exchanges[key] }))
          .sort((a, b) => {
            const multiplier = sortOrder === 'asc' ? 1 : -1;
            if (sortBy === 'name') return multiplier * a.displayName.localeCompare(b.displayName);
            if (sortBy === 'tokens') return multiplier * (a.activeCount - b.activeCount);
            if (sortBy === 'bestFR') return multiplier * ((b.bestFR || 0) - (a.bestFR || 0));
            return 0;
          })
          .map((exchange) => exchange.key);

        set({ availableExchanges: exchanges, sortedExchangeKeys: sortedKeys });

        const currentStablecoin = get().filters.stablecoinExchanges || {};
        const currentToken = get().filters.tokenExchanges || {};
        const updatedStablecoin = { ...currentStablecoin };
        const updatedToken = { ...currentToken };
        let hasChanges = false;
        Object.keys(exchanges).forEach((key) => {
          if (updatedStablecoin[key] === undefined) {
            updatedStablecoin[key] = true;
            hasChanges = true;
          }
          if (updatedToken[key] === undefined) {
            updatedToken[key] = true;
            hasChanges = true;
          }
        });
        if (hasChanges) {
          set((state) => ({
            filters: {
              ...state.filters,
              stablecoinExchanges: updatedStablecoin,
              tokenExchanges: updatedToken,
              selectedExchanges: Object.keys(exchanges).reduce(
                (acc, key) => ({
                  ...acc,
                  [key]: updatedStablecoin[key] || updatedToken[key],
                }),
                {}
              ),
            },
          }));
        }
      },
    }),
    {
      name: STORAGE_KEYS.USER_PREFERENCES,
      partialize: (state) => ({
        filters: state.filters,
      }),
    }
  )
);

export default useAppStore;