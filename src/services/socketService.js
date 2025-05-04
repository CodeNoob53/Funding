// src/services/socketService.js
import { io } from 'socket.io-client';
import logger from './logger';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }
  
  // Ініціалізація з'єднання
  connect() {
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
    const apiKey = import.meta.env.VITE_S_API_KEY;
    
    if (!apiKey) {
      logger.error('API Key не визначено. Встановіть VITE_S_API_KEY у .env');
      return this;
    }

    logger.info('Ініціалізація WebSocket підключення', { url: SOCKET_URL });
    
    this.socket = io(SOCKET_URL, {
      auth: { apiKey },
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000
    });
    
    this.socket.on('connect', () => {
      this.connected = true;
      this.reconnectAttempts = 0;
      logger.info('WebSocket підключено', { id: this.socket.id });
      this._notifyListeners('connect');
    });
    
    this.socket.on('disconnect', (reason) => {
      this.connected = false;
      logger.warn('WebSocket відключено', { reason });
      this._notifyListeners('disconnect', reason);
    });
    
    this.socket.on('connect_error', (error) => {
      logger.error('Помилка підключення WebSocket', error);
      this._notifyListeners('error', error.message);
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        logger.error('Досягнуто максимальну кількість спроб підключення WebSocket');
        this.disconnect();
      }
      this.reconnectAttempts++;
    });
    
    this.socket.on('initialData', (data) => {
      logger.info('Отримано початкові дані WebSocket');
      this._notifyListeners('initialData', data);
    });
    
    this.socket.on('dataUpdate', (data) => {
      logger.debug('Отримано оновлення даних WebSocket');
      this._notifyListeners('dataUpdate', data);
    });
    
    return this;
  }
  
  // Підписка на події
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    return this;
  }
  
  // Відписка від подій
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }
    return this;
  }
  
  // Відправка події на сервер
  emit(event, data) {
    if (!this.socket || !this.connected) {
      logger.warn('Спроба відправити подію при відключеному WebSocket', { event });
      return false;
    }
    this.socket.emit(event, data);
    return true;
  }
  
  // Відключення
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      logger.info('WebSocket відключено вручну');
    }
    return this;
  }
  
  // Приватний метод для сповіщення слухачів
  _notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          logger.error('Помилка в обробнику події WebSocket', { event, error });
        }
      });
    }
  }
  
  // Перевірка стану підключення
  isConnected() {
    return this.connected;
  }
}

// Створюємо і експортуємо сінглтон
const socketService = new SocketService();
export default socketService;