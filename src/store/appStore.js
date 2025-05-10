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
      
      updateExchangeVisibility: (exchange, isVisible) => {
        logger.debug(`Оновлено видимість біржі ${exchange}: ${isVisible}`);
        set((state) => ({
          filters: {
            ...state.filters,
            selectedExchanges: {
              ...state.filters.selectedExchanges,
              [exchange]: isVisible
            }
          }
        }));
      },
      
      // Методи для роботи з доступними біржами
      setAvailableExchanges: (exchanges) => {
        set({ availableExchanges: exchanges });
        
        // Оновлюємо selectedExchanges, додаючи нові біржі
        const currentSelected = get().filters.selectedExchanges;
        const updatedSelected = { ...currentSelected };
        
        let hasChanges = false;
        Object.keys(exchanges).forEach((key) => {
          if (updatedSelected[key] === undefined) {
            updatedSelected[key] = true;
            hasChanges = true;
          }
        });
        
        if (hasChanges) {
          set((state) => ({
            filters: {
              ...state.filters,
              selectedExchanges: updatedSelected
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