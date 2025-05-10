// src/hooks/useFundingData.js
import { useEffect } from 'react';
import { fetchFundingRates } from '../services/api';
import socketService from '../services/socketService';
import logger from '../services/logger';
import useAppStore from '../store/appStore';
import { API_CONFIG } from '../config/appConfig';

// Змінено з 'const useFundingData' на 'export function useFundingData'
export function useFundingData() {
  const { 
    setFundingData, 
    setIsLoading, 
    setError,
    isLoading
  } = useAppStore(state => ({
    setFundingData: state.setFundingData,
    setIsLoading: state.setIsLoading,
    setError: state.setError,
    isLoading: state.isLoading
  }));

  useEffect(() => {
    const loadFundingData = async () => {
      try {
        setIsLoading(true);
        logger.info('Початок завантаження даних про фандинг');
        const data = await fetchFundingRates();
        setFundingData(data);
        logger.info(`Дані про фандинг успішно завантажено (${data.length} записів)`);
        setError(null);
      } catch (err) {
        const errorMessage = 'Не вдалося завантажити дані про фандинг';
        setError(errorMessage);
        logger.error(errorMessage, err);
      } finally {
        setIsLoading(false);
      }
    };

    // Початкове завантаження
    loadFundingData();
    
    // Інтервал оновлення
    const intervalId = setInterval(() => {
      if (!document.hidden && !isLoading) { // Перевіряємо чи вкладка активна
        loadFundingData();
      } else {
        logger.debug('Пропускаємо оновлення: вкладка неактивна або попереднє оновлення ще виконується');
      }
    }, API_CONFIG.CACHE_EXPIRY.FUNDING_DATA);

    // Ініціалізація WebSocket
    socketService.connect();
    socketService.on('dataUpdate', (data) => {
      if (data?.length) {
        logger.info(`Отримано оновлення даних через WebSocket (${data.length} записів)`);
        setFundingData(data);
      }
    });

    return () => {
      logger.debug('Очищення інтервалу оновлення даних');
      clearInterval(intervalId);
      socketService.disconnect();
    };
  }, []); // Запускаємо тільки один раз при монтуванні
}