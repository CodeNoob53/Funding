// src/services/socketService.js
import { io } from 'socket.io-client';
import logger from './logger';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Початкова затримка 1 секунда
    this.maxReconnectDelay = 30000; // Максимальна затримка 30 секунд
    this.reconnectTimer = null;
    this.connectionTimeout = null;
    this.eventHandlers = new Map();
  }

  connect() {
    if (this.socket?.connected || this.isConnecting) {
      logger.debug('WebSocket вже підключено або підключення в процесі');
      return;
    }

    const apiKey = import.meta.env.VITE_S_API_KEY;
    if (!apiKey) {
      logger.error('API Key не визначено. Встановіть VITE_S_API_KEY у .env');
      this.emit('error', 'API Key не визначено');
      return;
    }

    this.isConnecting = true;
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

    try {
      logger.info('Ініціалізація WebSocket підключення...');
      
      this.socket = io(socketUrl, {
        transports: ['websocket'],
        reconnection: false, // Вимикаємо автоматичне перепідключення
        timeout: 10000, // 10 секунд таймаут
        forceNew: true,
        autoConnect: false,
        auth: {
          apiKey: apiKey
        }
      });

      // Встановлюємо таймаут на підключення
      this.connectionTimeout = setTimeout(() => {
        if (!this.socket?.connected) {
          logger.error('Таймаут підключення WebSocket');
          this.handleConnectionError('timeout');
        }
      }, 10000);

      this.socket.on('connect', () => {
        clearTimeout(this.connectionTimeout);
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        logger.info('✅ WebSocket підключено успішно');
        this.emit('connectionStats', { status: 'connected' });
      });

      this.socket.on('connect_error', (error) => {
        if (error.message?.includes('API Key')) {
          logger.error('Помилка автентифікації WebSocket: Неправильний або відсутній API Key');
          this.emit('error', 'auth_failed');
          this.disconnect();
          return;
        }
        this.handleConnectionError(error);
      });

      this.socket.on('disconnect', (reason) => {
        this.handleDisconnect(reason);
      });

      this.socket.on('error', (error) => {
        logger.error('❌ Помилка WebSocket:', error);
        this.emit('error', error);
      });

      // Підключаємо сокет
      this.socket.connect();

    } catch (error) {
      this.handleConnectionError(error);
    }
  }

  handleConnectionError(error) {
    clearTimeout(this.connectionTimeout);
    this.isConnecting = false;

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), this.maxReconnectDelay);
      
      logger.warn(`Спроба перепідключення WebSocket (${this.reconnectAttempts}/${this.maxReconnectAttempts}) через ${delay}ms`);
      
      this.reconnectTimer = setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      logger.error('Досягнуто максимальну кількість спроб підключення WebSocket');
      this.emit('error', 'max_attempts_reached');
    }
  }

  handleDisconnect(reason) {
    logger.warn(`WebSocket відключено: ${reason}`);
    this.emit('disconnect', reason);

    // Очищаємо всі таймери
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
    }

    // Скидаємо стан
    this.isConnecting = false;
    this.socket = null;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    
    // Очищаємо всі таймери
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
    }
  }

  emit(event, data) {
    if (!this.socket?.connected) {
      logger.warn(`Спроба emit події ${event} при відключеному WebSocket`);
      return;
    }
    try {
      this.socket.emit(event, data);
    } catch (error) {
      logger.error(`Помилка при emit події ${event}:`, error);
    }
  }

  on(event, callback) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event).add(callback);

    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).delete(callback);
    }
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  isConnected() {
    return this.socket?.connected || false;
  }

  getLatency() {
    return this.socket?.io?.engine?.pingTimeout || null;
  }

  getConnectionStats() {
    return {
      connected: this.isConnected(),
      reconnectAttempts: this.reconnectAttempts,
      isConnecting: this.isConnecting
    };
  }

  requestConnectionStats() {
    if (this.isConnected()) {
      this.emit('requestStats');
    }
  }
}

// Експортуємо єдиний екземпляр сервісу
const socketService = new SocketService();
export default socketService;