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
    this.subscribed = false;
    this.connectionStats = null;
    this.lastPingTime = null;
    this.latency = null;
    this.isConnecting = false;
    this.reconnectTimer = null;
    this.connectionPromise = null;
    this.subscriptionPromise = null;
  }
  
  // Ініціалізація з'єднання
  connect() {
    // Якщо вже є активне підключення або процес підключення
    if (this.socket?.connected) {
      logger.debug('WebSocket вже підключено');
      return Promise.resolve(this);
    }

    if (this.isConnecting) {
      logger.debug('WebSocket підключення в процесі');
      return this.connectionPromise;
    }

    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
    const apiKey = import.meta.env.VITE_S_API_KEY;
    
    if (!apiKey) {
      logger.error('API Key не визначено. Встановіть VITE_S_API_KEY у .env');
      this._notifyListeners('error', 'API Key не визначено');
      return Promise.reject(new Error('API Key не визначено'));
    }

    this.isConnecting = true;
    logger.info('Ініціалізація WebSocket підключення', { url: SOCKET_URL });
    
    this.connectionPromise = new Promise((resolve, reject) => {
      this.socket = io(SOCKET_URL, {
        auth: { apiKey },
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
        transports: ['websocket', 'polling']
      });
      
      this.setupEventHandlers();
      
      // Додаємо обробники для Promise
      this.socket.once('connect', () => {
        resolve(this);
      });
      
      this.socket.once('connect_error', (error) => {
        this.isConnecting = false;
        this.connectionPromise = null;
        reject(error);
      });
    });
    
    return this.connectionPromise;
  }

  setupEventHandlers() {
    // === ОСНОВНІ ПОДІЇ ===
    this.socket.on('connect', () => {
      this.connected = true;
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      logger.info('WebSocket підключено', { id: this.socket.id });
      this._notifyListeners('connect');
      
      // Автоматична підписка при підключенні
      this.subscribe();
    });
    
    this.socket.on('disconnect', (reason) => {
      this.connected = false;
      this.isConnecting = false;
      this.latency = null;
      logger.warn('WebSocket відключено', { reason });
      this._notifyListeners('disconnect', reason);
    });
    
    this.socket.on('connect_error', (error) => {
      this.isConnecting = false;
      logger.error('Помилка підключення WebSocket', { 
        error: error.message,
        attempts: this.reconnectAttempts + 1
      });
      this._notifyListeners('error', error.message);
      
      // Перевірка на помилку API ключа
      if (error.message.includes('API Key')) {
        logger.error('Помилка автентифікації: неправильний API ключ');
        this.disconnect();
        return;
      }
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        logger.error('Досягнуто максимальну кількість спроб підключення WebSocket');
        this.disconnect();
      }
      this.reconnectAttempts++;
    });

    // === ДАНІ ===
    this.socket.on('initialData', (data) => {
      logger.info('Отримано початкові дані WebSocket');
      this._notifyListeners('initialData', data);
    });
    
    this.socket.on('dataUpdate', (data) => {
      logger.debug('Отримано оновлення даних WebSocket');
      this._notifyListeners('dataUpdate', data);
    });

    // === HEARTBEAT ===
    this.socket.on('ping', (data) => {
      // Відповідаємо на ping серверу
      this.socket.emit('pong', data);
      
      // Розраховуємо затримку
      if (data && data.timestamp) {
        this.latency = Date.now() - data.timestamp;
        logger.debug(`Heartbeat: ping-pong, затримка ${this.latency}ms`);
      }
    });

    this.socket.on('connectionStats', (stats) => {
      this.connectionStats = stats;
      logger.debug('Отримано статистику з\'єднання:', stats);
      this._notifyListeners('connectionStats', stats);
    });

    // === ТЕСТУВАННЯ (тільки для розробки) ===
    this.socket.on('testMessage', (data) => {
      logger.info('Отримано тестове повідомлення:', data);
      this._notifyListeners('testMessage', data);
    });

    // === ЗАГАЛЬНІ ПОМИЛКИ ===
    this.socket.on('error', (error) => {
      logger.error('Помилка WebSocket', error);
      this._notifyListeners('error', error);
    });

    // Регістрація всіх існуючих listeners
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach(callback => {
        this.socket.on(event, callback);
      });
    });
  }
  
  // Підписка на події
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    
    // Якщо сокет вже існує, підписуємося одразу
    if (this.socket) {
      this.socket.on(event, callback);
    }
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
    
    if (this.socket) {
      this.socket.off(event, callback);
    }
    return this;
  }
  
  // Відправка події на сервер
  emit(event, data) {
    if (!this.socket || !this.connected) {
      // Не показуємо попередження для деяких автоматичних подій
      const silentEvents = ['getConnectionStats', 'subscribe', 'unsubscribe'];
      if (!silentEvents.includes(event)) {
        logger.warn('WebSocket недоступний для відправки події', { event, connected: this.connected });
      } else {
        logger.debug('Спроба відправити подію при відключеному WebSocket', { event });
      }
      return false;
    }

    if (event === 'subscribe') {
      return this.subscribe();
    } else if (event === 'unsubscribe') {
      return this.unsubscribe();
    }

    try {
      this.socket.emit(event, data);
      return true;
    } catch (error) {
      logger.error(`Помилка при відправці події ${event}:`, error);
      return false;
    }
  }
  
  // Запит статистики з'єднання
  requestConnectionStats() {
    if (!this.connected || !this.socket) {
      logger.debug('Не можна запросити статистику: WebSocket не підключено');
      return false;
    }
    
    return this.emit('getConnectionStats');
  }

  // Відключення
  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.isConnecting = false;
      this.subscribed = false;
      this.connectionStats = null;
      this.latency = null;
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
  
  // Геттери для статусу
  isConnected() {
    return this.connected && this.socket?.connected;
  }

  getLatency() {
    return this.latency;
  }

  getConnectionStats() {
    return this.connectionStats;
  }

  getSocketId() {
    return this.socket?.id || null;
  }

  // Метод для тестування (тільки для розробки)
  sendTestMessage(message) {
    if (import.meta.env.DEV) {
      this.emit('testMessage', { message, timestamp: Date.now() });
    }
  }

  // Метод для примусового переподключення
  reconnect() {
    logger.info('Примусове переподключення WebSocket...');
    this.disconnect();
    setTimeout(() => {
      this.connect();
    }, 1000);
  }

  // Перевірка стану підписки
  isSubscribed() {
    return this.subscribed;
  }

  // Підписка на оновлення
  subscribe() {
    if (this.subscriptionPromise) {
      return this.subscriptionPromise;
    }

    if (this.subscribed) {
      return Promise.resolve();
    }

    this.subscriptionPromise = new Promise((resolve) => {
      if (!this.socket || !this.connected) {
        logger.warn('Не можна підписатися: WebSocket не підключено');
        this.subscriptionPromise = null;
        resolve(false);
        return;
      }

      this.socket.emit('subscribe');
      this.subscribed = true;
      logger.info('Підписка на оновлення даних');
      this.subscriptionPromise = null;
      resolve(true);
    });

    return this.subscriptionPromise;
  }

  // Відписка від оновлень
  unsubscribe() {
    if (!this.socket || !this.connected) {
      logger.warn('Не можна відписатися: WebSocket не підключено');
      return false;
    }

    this.socket.emit('unsubscribe');
    this.subscribed = false;
    logger.info('Відписка від оновлень даних');
    return true;
  }
}

// Створюємо і експортуємо сінглтон
const socketService = new SocketService();
export default socketService;