// src/store/appStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_SETTINGS, STORAGE_KEYS } from '../config/appConfig';
import logger from '../services/logger';

const useAppStore = create(
  persist(
    (set, get) => ({
      // Стани
      fundingData: [],
      isLoading: false,
      error: null,
      selectedToken: null,
      isFilterPanelOpen: false,
      
      // Налаштування фільтрів
      filters: DEFAULT_SETTINGS.filters,
      
      // Налаштування біржі та доступні біржі
      availableExchanges: {},
      
      // Методи для роботи з даними фандингу
      setFundingData: (data) => set({ fundingData: data }),
      setIsLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      
      // Методи для роботи з токенами
      setSelectedToken: (token) => {
        logger.debug(`Вибрано токен: ${token?.symbol}`);
        set({ selectedToken: token });
      },
      
      selectRate: (data) => {
        const { token, exchange, funding_rate } = data;
        logger.debug(`Вибрано ставку: ${token.symbol} на ${exchange} (${funding_rate})`);
        
        const updatedToken = {
          ...token,
          selectedExchange: exchange,
          selectedRate: funding_rate,
        };
        
        set({ selectedToken: updatedToken });
      },
      
      // Методи для роботи з панеллю фільтрів
      toggleFilterPanel: () => {
        const newState = !get().isFilterPanelOpen;
        logger.debug(`Панель фільтрів: ${newState ? 'відкрита' : 'закрита'}`);
        set({ isFilterPanelOpen: newState });
      },
      
      // Методи для налаштування фільтрів
      updateFilter: (key, value) => {
        logger.debug(`Оновлено фільтр: ${key} = ${value}`);
        set((state) => ({
          filters: {
            ...state.filters,
            [key]: value
          }
        }));
      },
      
      // Оновлення видимості біржі для конкретного типу маржі
      updateExchangeVisibility: (exchange, isVisible, marginType = 'stablecoin') => {
        logger.debug(`Оновлено видимість біржі ${exchange} для ${marginType}: ${isVisible}`);
        
        const exchangeTypeKey = marginType === 'stablecoin' ? 'stablecoinExchanges' : 'tokenExchanges';
        
        set((state) => ({
          filters: {
            ...state.filters,
            [exchangeTypeKey]: {
              ...state.filters[exchangeTypeKey],
              [exchange]: isVisible
            },
            // Для зворотної сумісності
            selectedExchanges: {
              ...state.filters.selectedExchanges,
              [exchange]: isVisible
            }
          }
        }));
      },
      
      // Скидання фільтрів для конкретної вкладки
      resetTabFilters: (tabType) => {
        logger.debug(`Скидання фільтрів для вкладки: ${tabType}`);
        
        set((state) => {
          const newFilters = { ...state.filters };
          
          if (tabType === 'filter') {
            newFilters.enabled = DEFAULT_SETTINGS.filters.enabled;
            newFilters.minFundingRate = DEFAULT_SETTINGS.filters.minFundingRate;
            newFilters.rateSignFilter = DEFAULT_SETTINGS.filters.rateSignFilter;
            newFilters.displayMode = DEFAULT_SETTINGS.filters.displayMode;
          } 
          else if (tabType === 'sorting') {
            newFilters.fundingInterval = DEFAULT_SETTINGS.filters.fundingInterval;
            newFilters.statusFilter = DEFAULT_SETTINGS.filters.statusFilter;
            newFilters.sortBy = DEFAULT_SETTINGS.filters.sortBy;
            newFilters.sortOrder = DEFAULT_SETTINGS.filters.sortOrder;
            newFilters.exchangeSortBy = DEFAULT_SETTINGS.filters.exchangeSortBy;
            newFilters.exchangeSortOrder = DEFAULT_SETTINGS.filters.exchangeSortOrder;
          } 
          else if (tabType === 'display') {
            newFilters.stablecoinExchanges = { ...DEFAULT_SETTINGS.filters.stablecoinExchanges };
            newFilters.tokenExchanges = { ...DEFAULT_SETTINGS.filters.tokenExchanges };
            // Для зворотної сумісності
            newFilters.selectedExchanges = { ...DEFAULT_SETTINGS.filters.selectedExchanges };
          }
          
          return { filters: newFilters };
        });
      },
      
      // Методи для роботи з доступними біржами
      setAvailableExchanges: (exchanges) => {
        set({ availableExchanges: exchanges });
        
        // Оновлюємо selectedExchanges, додаючи нові біржі для зворотної сумісності
        const currentSelected = get().filters.selectedExchanges;
        const currentStablecoin = get().filters.stablecoinExchanges || {};
        const currentToken = get().filters.tokenExchanges || {};
        
        const updatedSelected = { ...currentSelected };
        const updatedStablecoin = { ...currentStablecoin };
        const updatedToken = { ...currentToken };
        
        let hasChanges = false;
        Object.keys(exchanges).forEach((key) => {
          if (updatedSelected[key] === undefined) {
            updatedSelected[key] = true;
            hasChanges = true;
          }
          
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
              selectedExchanges: updatedSelected,
              stablecoinExchanges: updatedStablecoin,
              tokenExchanges: updatedToken
            }
          }));
        }
      }
    }),
    {
      name: STORAGE_KEYS.USER_PREFERENCES,
      partialize: (state) => ({
        filters: state.filters
      })
    }
  )
);

export default useAppStore;