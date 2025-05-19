// src/hooks/useFundingData.js
import { useEffect, useRef, useCallback } from 'react';
import { fetchFundingRates } from '../services/api';
import socketService from '../services/socketService';
import logger from '../services/logger';
import useAppStore from '../store/appStore';

// Глобальний кеш для запитів
const requestCache = {
  promise: null,
  timestamp: null,
  data: null,
  CACHE_DURATION: 5000, // 5 секунд
  // Функція для оновлення кешу з урахуванням часткових оновлень
  updateCache: function(partialUpdate) {
    if (!this.data) return false;
    
    try {
      const updatedData = [...this.data];
      let hasChanges = false;

      partialUpdate.forEach((updatedSymbol) => {
        if (!updatedSymbol || typeof updatedSymbol !== 'object') return;

        const index = updatedData.findIndex(item => item.symbol === updatedSymbol.symbol);
        
        if (index !== -1) {
          const currentSymbol = updatedData[index];
          const newSymbol = { ...currentSymbol };
          
          // Оновлення stablecoin_margin_list
          if (updatedSymbol.uMarginList && Array.isArray(updatedSymbol.uMarginList)) {
            newSymbol.stablecoin_margin_list = [...(newSymbol.stablecoin_margin_list || [])];
            updatedSymbol.uMarginList.forEach(updatedExchange => {
              if (!updatedExchange || typeof updatedExchange !== 'object') return;

              const exchangeIndex = newSymbol.stablecoin_margin_list.findIndex(
                ex => ex.exchange === updatedExchange.exchangeName
              );
              
              const newExchangeData = {
                exchange: updatedExchange.exchangeName,
                funding_rate: updatedExchange.rate,
                funding_rate_interval: updatedExchange.fundingIntervalHours,
                next_funding_time: updatedExchange.nextFundingTime,
                predicted_rate: updatedExchange.predictedRate,
                price: updatedExchange.price,
                exchange_logo: updatedExchange.exchangeLogo,
                status: updatedExchange.status,
              };
              
              if (exchangeIndex !== -1) {
                newSymbol.stablecoin_margin_list[exchangeIndex] = {
                  ...newSymbol.stablecoin_margin_list[exchangeIndex],
                  ...newExchangeData
                };
              } else {
                newSymbol.stablecoin_margin_list.push(newExchangeData);
              }
              hasChanges = true;
            });
          }
          
          // Оновлення token_margin_list
          if (updatedSymbol.cMarginList && Array.isArray(updatedSymbol.cMarginList)) {
            newSymbol.token_margin_list = [...(newSymbol.token_margin_list || [])];
            updatedSymbol.cMarginList.forEach(updatedExchange => {
              if (!updatedExchange || typeof updatedExchange !== 'object') return;

              const exchangeIndex = newSymbol.token_margin_list.findIndex(
                ex => ex.exchange === updatedExchange.exchangeName
              );
              
              const newExchangeData = {
                exchange: updatedExchange.exchangeName,
                funding_rate: updatedExchange.rate,
                funding_rate_interval: updatedExchange.fundingIntervalHours,
                next_funding_time: updatedExchange.nextFundingTime,
                predicted_rate: updatedExchange.predictedRate,
                price: updatedExchange.price,
                exchange_logo: updatedExchange.exchangeLogo,
                status: updatedExchange.status,
              };
              
              if (exchangeIndex !== -1) {
                newSymbol.token_margin_list[exchangeIndex] = {
                  ...newSymbol.token_margin_list[exchangeIndex],
                  ...newExchangeData
                };
              } else {
                newSymbol.token_margin_list.push(newExchangeData);
              }
              hasChanges = true;
            });
          }
          
          if (updatedSymbol.uIndexPrice !== undefined) {
            newSymbol.indexPrice = updatedSymbol.uIndexPrice;
            hasChanges = true;
          }
          
          if (hasChanges) {
            updatedData[index] = newSymbol;
          }
        } else if (updatedSymbol.symbol && (updatedSymbol.uMarginList || updatedSymbol.cMarginList)) {
          const formattedSymbol = {
            symbol: updatedSymbol.symbol,
            symbolLogo: updatedSymbol.symbolLogo,
            stablecoin_margin_list: Array.isArray(updatedSymbol.uMarginList) ? 
              updatedSymbol.uMarginList.map(ex => ({
                exchange: ex.exchangeName,
                funding_rate: ex.rate,
                funding_rate_interval: ex.fundingIntervalHours,
                next_funding_time: ex.nextFundingTime,
                predicted_rate: ex.predictedRate,
                price: ex.price,
                exchange_logo: ex.exchangeLogo,
                status: ex.status,
              })) : [],
            token_margin_list: Array.isArray(updatedSymbol.cMarginList) ? 
              updatedSymbol.cMarginList.map(ex => ({
                exchange: ex.exchangeName,
                funding_rate: ex.rate,
                funding_rate_interval: ex.fundingIntervalHours,
                next_funding_time: ex.nextFundingTime,
                predicted_rate: ex.predictedRate,
                price: ex.price,
                exchange_logo: ex.exchangeLogo,
                status: ex.status,
              })) : [],
            indexPrice: updatedSymbol.uIndexPrice,
            fundingRate: 0
          };
          updatedData.push(formattedSymbol);
          hasChanges = true;
        }
      });

      if (hasChanges) {
        this.data = updatedData;
        this.timestamp = Date.now();
        return true;
      }
      return false;
    } catch (error) {
      logger.error('[updateCache] Помилка при оновленні кешу:', error);
      return false;
    }
  }
};

export function useFundingData() {
  const { 
    setFundingData, 
    setIsLoading, 
    setError,
    fundingData
  } = useAppStore(state => ({
    setFundingData: state.setFundingData,
    setIsLoading: state.setIsLoading,
    setError: state.setError,
    fundingData: state.fundingData
  }));

  const wsInitialized = useRef(false);
  const lastUpdateTime = useRef(null);
  const initPromise = useRef(null);
  const isFirstRender = useRef(true);

  // Функція завантаження початкових даних з дедуплікацією
  const loadFundingData = useCallback(async () => {
    try {
      // Перевіряємо кеш
      const now = Date.now();
      if (requestCache.promise) {
        logger.debug('Використовуємо активний запит з кешу');
        return requestCache.promise;
      }

      if (requestCache.data && requestCache.timestamp && 
          now - requestCache.timestamp < requestCache.CACHE_DURATION) {
        logger.debug('Використовуємо дані з кешу');
        setFundingData(requestCache.data);
        return requestCache.data;
      }

      setIsLoading(true);
      setError(null);
      
      logger.info('[loadFundingData] Початок завантаження даних про фандинг');
      
      // Створюємо новий запит
      requestCache.promise = fetchFundingRates().then(data => {
        if (!Array.isArray(data)) {
          logger.warn('[loadFundingData] Отримано невалідні дані з API:', data);
          setFundingData([]);
          return [];
        }
        
        logger.debug('[loadFundingData] Встановлюємо нові дані:', { count: data.length });
        setFundingData(data);
        lastUpdateTime.current = now;
        
        // Оновлюємо кеш
        requestCache.data = data;
        requestCache.timestamp = now;
        
        logger.info(`[loadFundingData] Дані про фандинг успішно завантажено: ${data.length} записів`);
        return data;
      }).finally(() => {
        requestCache.promise = null;
        setIsLoading(false);
      });

      return requestCache.promise;
      
    } catch (err) {
      const errorMessage = 'Не вдалося завантажити дані про фандинг';
      setError(errorMessage);
      logger.error('[loadFundingData] ' + errorMessage, err);
      throw err;
    }
  }, [setFundingData, setIsLoading, setError]);

  // Функція ініціалізації WebSocket
  const initializeWebSocket = useCallback(() => {
    if (wsInitialized.current) {
      logger.debug('WebSocket вже ініціалізовано');
      return Promise.resolve();
    }

    if (initPromise.current) {
      logger.debug('Ініціалізація WebSocket вже в процесі');
      return initPromise.current;
    }

    logger.debug("Ініціалізація WebSocket з'єднання");
    
    initPromise.current = new Promise((resolve) => {
      // === ОБРОБКА ПОЧАТКОВИХ ДАНИХ ===
      socketService.on('initialData', (data) => {
        logger.debug('Отримано початкові дані через WebSocket');
        
        if (!data) {
          logger.warn('[initialData] Отримано порожні дані через WebSocket');
          setFundingData([]);
          return;
        }

        let processedData = [];
        
        if (data.data && Array.isArray(data.data)) {
          processedData = data.data.map(item => {
            if (!item || typeof item !== 'object') {
              logger.warn('[initialData] Невалідний елемент у даних WebSocket:', item);
              return null;
            }

            return {
              symbol: item.symbol,
              symbolLogo: item.symbolLogo,
              stablecoin_margin_list: Array.isArray(item.uMarginList) ? 
                item.uMarginList.map(ex => ({
                  exchange: ex.exchangeName,
                  funding_rate: ex.rate,
                  funding_rate_interval: ex.fundingIntervalHours,
                  next_funding_time: ex.nextFundingTime,
                  predicted_rate: ex.predictedRate,
                  price: ex.price,
                  exchange_logo: ex.exchangeLogo,
                  status: ex.status,
                })) : [],
              token_margin_list: Array.isArray(item.cMarginList) ? 
                item.cMarginList.map(ex => ({
                  exchange: ex.exchangeName,
                  funding_rate: ex.rate,
                  funding_rate_interval: ex.fundingIntervalHours,
                  next_funding_time: ex.nextFundingTime,
                  predicted_rate: ex.predictedRate,
                  price: ex.price,
                  exchange_logo: ex.exchangeLogo,
                  status: ex.status,
                })) : [],
              indexPrice: item.uIndexPrice,
              fundingRate: 0
            };
          }).filter(Boolean);
        } else if (Array.isArray(data)) {
          processedData = data;
        } else {
          logger.warn('[initialData] Неочікуваний формат даних WebSocket:', data);
          setFundingData([]);
          return;
        }

        if (processedData.length > 0) {
          const timestamp = Date.now();
          if (!lastUpdateTime.current || timestamp - lastUpdateTime.current > 1000) {
            logger.debug('[initialData] Встановлюємо нові дані:', { count: processedData.length });
            setFundingData(processedData);
            lastUpdateTime.current = timestamp;
          }
        } else {
          logger.warn('[initialData] Немає валідних даних для оновлення');
          setFundingData([]);
        }
      });

      // === ОБРОБКА ОНОВЛЕНЬ ДАНИХ ===
      socketService.on('dataUpdate', (update) => {
        if (!update?.data?.length) {
          logger.debug('[dataUpdate] Отримано порожнє оновлення WebSocket');
          return;
        }
        
        logger.debug(`[dataUpdate] Отримано оновлення через WebSocket: ${update.data.length} змін`);
        
        // Оновлюємо кеш
        const cacheUpdated = requestCache.updateCache(update.data);
        
        if (cacheUpdated) {
          // Оновлюємо стан додатку тільки якщо кеш був успішно оновлений
          setFundingData(requestCache.data);
          lastUpdateTime.current = Date.now();
          logger.debug('[dataUpdate] Дані успішно оновлено через WebSocket:', { 
            count: requestCache.data.length,
            updatedSymbols: update.data.map(s => s.symbol).join(', ')
          });
        }
      });

      // === ОБРОБКА СТАТУСУ З'ЄДНАННЯ ===
      socketService.on('connect', () => {
        logger.debug('WebSocket підключено');
        setError(null);
      });

      socketService.on('disconnect', (reason) => {
        logger.debug(`WebSocket відключено: ${reason}`);
      });

      socketService.on('error', (error) => {
        logger.error('❌ Помилка WebSocket:', error);
        if (error.includes('API Key')) {
          setError('Помилка автентифікації WebSocket. Перевірте API ключ.');
        }
      });

      // === HEARTBEAT ПОДІЇ ===
      socketService.on('connectionStats', (stats) => {
        logger.debug('📊 Статистика WebSocket:', {
          latency: stats.currentLatency ? `${stats.currentLatency}ms` : 'N/A',
          session: `${stats.sessionDuration}s`,
          pings: `${stats.pongCount}/${stats.pingCount}`
        });
      });

      wsInitialized.current = true;
      socketService.connect();
      resolve();
    });

    return initPromise.current;
  }, [setFundingData, setError]);

  useEffect(() => {
    // Завантажуємо дані тільки при першому рендері
    if (isFirstRender.current) {
      isFirstRender.current = false;
      loadFundingData().then(() => {
        // Ініціалізуємо WebSocket тільки після успішного отримання даних
        initializeWebSocket();
      }).catch(() => {
        // При помилці API, все одно намагаємося підключити WebSocket
        if (!wsInitialized.current) {
          initializeWebSocket();
        }
      });
    }

    return () => {
      if (wsInitialized.current) {
        logger.info('Очищення WebSocket при демонтуванні');
        socketService.disconnect();
        wsInitialized.current = false;
      }
    };
  }, [loadFundingData, initializeWebSocket]);

  return {
    isWebSocketConnected: useCallback(() => socketService.isConnected(), []),
    getWebSocketLatency: useCallback(() => socketService.getLatency(), []),
    getConnectionStats: useCallback(() => socketService.getConnectionStats(), []),
    reconnectWebSocket: useCallback(() => {
      if (!socketService.isConnected()) {
        socketService.connect();
      }
    }, []),
    requestConnectionStats: useCallback(() => socketService.requestConnectionStats(), [])
  };
}