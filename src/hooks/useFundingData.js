// src/hooks/useFundingData.js
import { useEffect, useRef, useCallback } from 'react';
import { fetchFundingRates } from '../services/api';
import socketService from '../services/socketService';
import logger from '../services/logger';
import useAppStore from '../store/appStore';

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

  // Функція ініціалізації WebSocket
  const initializeWebSocket = useCallback(() => {
    if (wsInitialized.current) return;

    logger.info("Ініціалізація WebSocket з'єднання");
    
    // === ОБРОБКА ПОЧАТКОВИХ ДАНИХ ===
    socketService.on('initialData', (data) => {
      logger.info('Отримано початкові дані через WebSocket');
      
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
      
      const currentData = fundingData || [];
      
      if (!Array.isArray(currentData)) {
        logger.warn('[dataUpdate] currentData не є масивом при оновленні WebSocket:', currentData);
        setFundingData([]);
        return;
      }

      try {
        const updatedData = [...currentData];
        let hasChanges = false;
        
        update.data.forEach((updatedSymbol) => {
          if (!updatedSymbol || typeof updatedSymbol !== 'object') {
            logger.warn('[dataUpdate] Невалідний символ у оновленні:', updatedSymbol);
            return;
          }

          const index = updatedData.findIndex(item => item.symbol === updatedSymbol.symbol);
          
          if (index !== -1) {
            const currentSymbol = updatedData[index];
            const newSymbol = { ...currentSymbol };
            
            if (updatedSymbol.uMarginList && Array.isArray(updatedSymbol.uMarginList)) {
              newSymbol.stablecoin_margin_list = [...(newSymbol.stablecoin_margin_list || [])];
              updatedSymbol.uMarginList.forEach(updatedExchange => {
                if (!updatedExchange || typeof updatedExchange !== 'object') {
                  logger.warn('[dataUpdate] Невалідний обмін у uMarginList:', updatedExchange);
                  return;
                }

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
            
            if (updatedSymbol.cMarginList && Array.isArray(updatedSymbol.cMarginList)) {
              newSymbol.token_margin_list = [...(newSymbol.token_margin_list || [])];
              updatedSymbol.cMarginList.forEach(updatedExchange => {
                if (!updatedExchange || typeof updatedExchange !== 'object') {
                  logger.warn('[dataUpdate] Невалідний обмін у cMarginList:', updatedExchange);
                  return;
                }

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
          } else {
            logger.warn('[dataUpdate] Пропущено невалідний новий символ:', updatedSymbol);
          }
        });
        
        if (hasChanges) {
          lastUpdateTime.current = Date.now();
          logger.debug('[dataUpdate] Дані успішно оновлено через WebSocket:', { 
            count: updatedData.length,
            updatedSymbols: update.data.map(s => s.symbol).join(', ')
          });
          setFundingData(updatedData);
        }
      } catch (error) {
        logger.error('[dataUpdate] Помилка при обробці оновлення WebSocket:', error);
      }
    });

    // === ОБРОБКА СТАТУСУ З'ЄДНАННЯ ===
    socketService.on('connect', () => {
      logger.info('✅ WebSocket підключено успішно');
      setError(null);
      
      // Підписуємося на оновлення при підключенні
      setTimeout(() => {
        if (socketService.isConnected()) {
          socketService.emit('subscribe');
        }
      }, 100);
    });

    socketService.on('disconnect', (reason) => {
      logger.warn(`❌ WebSocket відключено: ${reason}`);
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
  }, [setFundingData, setError, fundingData]);

  // Функція завантаження початкових даних
  const loadFundingData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      logger.info('[loadFundingData] Початок завантаження даних про фандинг');
      const data = await fetchFundingRates();
      
      if (!Array.isArray(data)) {
        logger.warn('[loadFundingData] Отримано невалідні дані з API:', data);
        setFundingData([]);
        return;
      }
      
      logger.debug('[loadFundingData] Встановлюємо нові дані:', { count: data.length });
      setFundingData(data);
      lastUpdateTime.current = Date.now();
      
      logger.info(`[loadFundingData] Дані про фандинг успішно завантажено: ${data.length} записів`);
      
      // Ініціалізуємо WebSocket тільки після успішного отримання даних
      initializeWebSocket();
      
    } catch (err) {
      const errorMessage = 'Не вдалося завантажити дані про фандинг';
      setError(errorMessage);
      logger.error('[loadFundingData] ' + errorMessage, err);
      
      // При помилці API, все одно намагаємося підключити WebSocket
      if (!wsInitialized.current) {
        initializeWebSocket();
      }
    } finally {
      setIsLoading(false);
    }
  }, [setFundingData, setIsLoading, setError, initializeWebSocket]);

  useEffect(() => {
    loadFundingData();

    return () => {
      if (wsInitialized.current) {
        logger.info('Очищення WebSocket при демонтуванні');
        socketService.disconnect();
        wsInitialized.current = false;
      }
    };
  }, []);

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