// src/hooks/useFundingData.js
import { useEffect, useRef } from 'react';
import { fetchFundingRates } from '../services/api';
import socketService from '../services/socketService';
import logger from '../services/logger';
import useAppStore from '../store/appStore';

// Змінено з 'const useFundingData' на 'export function useFundingData'
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
    isLoading: state.isLoading,
    fundingData: state.fundingData
  }));

  // Використовуємо ref для відстеження стану WebSocket
  const wsInitialized = useRef(false);

  useEffect(() => {
    const loadFundingData = async () => {
      try {
        setIsLoading(true);
        logger.info('Початок завантаження даних про фандинг');
        const data = await fetchFundingRates();
        setFundingData(data);
        logger.info(`Дані про фандинг успішно завантажено (${data.length} записів)`);
        setError(null);

        // Ініціалізуємо WebSocket тільки після успішного отримання початкових даних
        if (!wsInitialized.current) {
          initializeWebSocket();
          wsInitialized.current = true;
        }
      } catch (err) {
        const errorMessage = 'Не вдалося завантажити дані про фандинг';
        setError(errorMessage);
        logger.error(errorMessage, err);
      } finally {
        setIsLoading(false);
      }
    };

    // Функція ініціалізації WebSocket
    const initializeWebSocket = () => {
      logger.info('Ініціалізація WebSocket підключення');
      socketService.connect();
      
      // Обробка оновлень
      socketService.on('dataUpdate', (update) => {
        if (!update?.data?.length) return;
        
        logger.debug(`Отримано оновлення даних через WebSocket (${update.data.length} записів)`);
        
        // Оновлюємо тільки змінені дані
        const updatedData = [...fundingData];
        update.data.forEach((newItem) => {
          const index = updatedData.findIndex(item => item.symbol === newItem.symbol);
          if (index !== -1) {
            updatedData[index] = newItem;
          } else {
            updatedData.push(newItem);
          }
        });
        
        setFundingData(updatedData);
      });

      // Підписка на оновлення
      socketService.emit('subscribe');
    };

    // Початкове завантаження
    loadFundingData();

    return () => {
      if (wsInitialized.current) {
        socketService.disconnect();
        wsInitialized.current = false;
      }
    };
  }, []); // Запускаємо тільки один раз при монтуванні
}