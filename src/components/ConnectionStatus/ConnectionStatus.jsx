// src/components/ConnectionStatus/ConnectionStatus.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import './ConnectionStatus.css';
import { useFundingData } from '../../hooks/useFundingData';
import logger from '../../services/logger';

// Типи сповіщень
const NOTIFICATION_TYPES = {
  CONNECTION_LOST: 'connection_lost',
  CONNECTION_RESTORED: 'connection_restored',
  HIGH_LATENCY: 'high_latency',
  AUTH_ERROR: 'auth_error'
};

const ConnectionStatus = ({ position = 'bottom-right', showNotifications = true }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [stats, setStats] = useState(null);
  const [notification, setNotification] = useState(null);
  const [connectionHistory, setConnectionHistory] = useState([]);
  
  // Refs для отслеживания состояний
  const wasConnected = useRef(true);
  const lastLatency = useRef(null);
  const notificationTimeout = useRef(null);
  const lastNotificationTime = useRef(null);
  
  const {
    isWebSocketConnected,
    getWebSocketLatency,
    getConnectionStats,
    requestConnectionStats,
    reconnectWebSocket
  } = useFundingData();

  const isConnected = isWebSocketConnected();
  const latency = getWebSocketLatency();

  // Функция для добавления уведомления
  const showNotification = useCallback((type, customMessage = null, duration = 5000) => {
    if (!showNotifications) return;

    // Предотвращаем спам уведомлений
    const now = Date.now();
    if (lastNotificationTime.current && now - lastNotificationTime.current < 2000) {
      return;
    }
    lastNotificationTime.current = now;

    const getCurrentLatency = () => getWebSocketLatency();

    const notifications = {
      [NOTIFICATION_TYPES.CONNECTION_LOST]: {
        icon: '🔴',
        title: 'З\'єднання втрачено',
        message: customMessage || 'WebSocket відключено. Спробуємо переподключитися...',
        type: 'error',
        action: 'Переподключити',
        persistent: true
      },
      [NOTIFICATION_TYPES.CONNECTION_RESTORED]: {
        icon: '🟢',
        title: 'З\'єднання відновлено',
        message: customMessage || 'WebSocket успішно переподключено',
        type: 'success',
        action: null,
        persistent: false
      },
      [NOTIFICATION_TYPES.HIGH_LATENCY]: {
        icon: '🟡',
        title: 'Повільне з\'єднання',
        message: customMessage || `Висока затримка: ${getCurrentLatency()}ms`,
        type: 'warning',
        action: null,
        persistent: false
      },
      [NOTIFICATION_TYPES.AUTH_ERROR]: {
        icon: '🔑',
        title: 'Помилка автентифікації',
        message: customMessage || 'Неправильний API ключ',
        type: 'error',
        action: 'Оновити сторінку',
        persistent: true
      }
    };

    const notificationData = notifications[type];
    if (!notificationData) return;

    setNotification({
      ...notificationData,
      id: Date.now(),
      createdAt: now
    });

    logger.info(`Сповіщення WebSocket: ${notificationData.title}`, {
      type: notificationData.type,
      message: notificationData.message
    });

    // Автоматическое скрытие для непостоянных уведомлений
    if (!notificationData.persistent && duration > 0) {
      if (notificationTimeout.current) {
        clearTimeout(notificationTimeout.current);
      }
      notificationTimeout.current = setTimeout(() => {
        setNotification(null);
      }, duration);
    }
  }, [showNotifications, getWebSocketLatency]); // Убрали latency из зависимостей

  // Закрытие уведомления
  const closeNotification = () => {
    setNotification(null);
    if (notificationTimeout.current) {
      clearTimeout(notificationTimeout.current);
      notificationTimeout.current = null;
    }
  };

  // Обработка действий уведомления
  const handleNotificationAction = () => {
    if (!notification) return;

    if (notification.action === 'Переподключити') {
      reconnectWebSocket();
      closeNotification();
    } else if (notification.action === 'Оновити сторінку') {
      window.location.reload();
    }
  };

  // Мониторинг состояния WebSocket  
  useEffect(() => {
    const checkConnection = () => {
      // Проверка изменения состояния подключения
      if (isConnected !== wasConnected.current) {
        if (isConnected) {
          if (showNotifications) {
            showNotification(NOTIFICATION_TYPES.CONNECTION_RESTORED);
          }
          // Добавляем в историю
          setConnectionHistory(prev => [{
            time: new Date(),
            type: 'connected',
            latency: latency
          }, ...prev.slice(0, 9)]); // Храним последние 10 записей
        } else {
          if (showNotifications) {
            showNotification(NOTIFICATION_TYPES.CONNECTION_LOST);
          }
          setConnectionHistory(prev => [{
            time: new Date(),
            type: 'disconnected'
          }, ...prev.slice(0, 9)]);
        }
        wasConnected.current = isConnected;
      }

      // Проверка высокой задержки
      if (isConnected && latency !== null) {
        const isHighLatency = latency > 1000;
        const wasHighLatency = lastLatency.current && lastLatency.current > 1000;
        
        if (isHighLatency && !wasHighLatency && showNotifications) {
          showNotification(NOTIFICATION_TYPES.HIGH_LATENCY, 
            `Виявлено високу затримку: ${latency}ms. Перевірте інтернет-з'єднання.`);
        }
        lastLatency.current = latency;
      }
    };

    const interval = setInterval(checkConnection, 2000);
    return () => clearInterval(interval);
  }, [isConnected, latency, showNotification, showNotifications]);

  // Обновление статистики
  useEffect(() => {
    if (!isConnected) return;

    const updateStats = () => {
      const currentStats = getConnectionStats();
      setStats(currentStats);
      
      // Запрашиваем новую статистику каждые 30 секунд
      if (Date.now() % 30000 < 5000) {
        requestConnectionStats();
      }
    };

    const interval = setInterval(updateStats, 5000);
    updateStats(); // Начальное обновление

    return () => clearInterval(interval);
  }, [isConnected]); // Только isConnected в зависимостях

  const getStatusColor = () => {
    if (!isConnected) return 'red';
    if (latency === null) return 'yellow';
    if (latency < 100) return 'green';
    if (latency < 300) return 'yellow';
    return 'orange';
  };

  const getStatusText = () => {
    if (!isConnected) return 'Відключено';
    if (latency === null) return 'Підключено';
    return `${latency}ms`;
  };

  const formatUptime = (seconds) => {
    if (!seconds) return 'N/A';
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('uk-UA', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit' 
    });
  };

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded && isConnected) {
      // Запитуємо статистику тільки якщо підключено
      setTimeout(() => {
        if (isWebSocketConnected()) {
          requestConnectionStats();
        }
      }, 100);
    }
  };

  return (
    <>
      {/* Главный индикатор */}
      <div className={`connection-status ${position} ${isExpanded ? 'expanded' : ''}`}>
        <div 
          className="connection-indicator"
          onClick={handleToggle}
          title={isConnected ? `WebSocket: ${getStatusText()}` : 'WebSocket відключено'}
        >
          <div className={`status-dot ${getStatusColor()}`}></div>
          <span className="status-text">{getStatusText()}</span>
          {!isConnected && (
            <button
              className="reconnect-button"
              onClick={(e) => {
                e.stopPropagation();
                reconnectWebSocket();
              }}
              title="Переподключити"
            >
              🔄
            </button>
          )}
        </div>
        
        {isExpanded && (
          <div className="connection-details">
            <div className="details-header">
              <h4>Статус WebSocket</h4>
              <button 
                className="close-button"
                onClick={() => setIsExpanded(false)}
                aria-label="Закрити"
              >
                ×
              </button>
            </div>
            
            <div className="details-content">
              <div className="detail-section">
                <h5>Поточний стан</h5>
                <div className="detail-row">
                  <span className="detail-label">Статус:</span>
                  <span className={`detail-value status-${getStatusColor()}`}>
                    {isConnected ? '🟢 Підключено' : '🔴 Відключено'}
                  </span>
                </div>
                
                {latency !== null && (
                  <div className="detail-row">
                    <span className="detail-label">Затримка:</span>
                    <span className="detail-value">{latency}ms</span>
                  </div>
                )}
              </div>

              {stats && (
                <div className="detail-section">
                  <h5>Статистика сесії</h5>
                  <div className="detail-row">
                    <span className="detail-label">Тривалість:</span>
                    <span className="detail-value">{formatUptime(stats.sessionDuration)}</span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="detail-label">Ping/Pong:</span>
                    <span className="detail-value">
                      {stats.pongCount}/{stats.pingCount}
                    </span>
                  </div>
                  
                  {stats.averageLatency && (
                    <div className="detail-row">
                      <span className="detail-label">Середня затримка:</span>
                      <span className="detail-value">{Math.round(stats.averageLatency)}ms</span>
                    </div>
                  )}
                  
                  <div className="detail-row">
                    <span className="detail-label">Підписка:</span>
                    <span className="detail-value">
                      {stats.isSubscribed ? '✅ Активна' : '❌ Неактивна'}
                    </span>
                  </div>
                  
                  {stats.missedPongs > 0 && (
                    <div className="detail-row">
                      <span className="detail-label">Пропущено pong:</span>
                      <span className="detail-value warning">{stats.missedPongs}</span>
                    </div>
                  )}
                </div>
              )}

              {connectionHistory.length > 0 && (
                <div className="detail-section">
                  <h5>Історія з'єднань</h5>
                  <div className="connection-history">
                    {connectionHistory.map((entry, index) => (
                      <div key={index} className="history-item">
                        <span className={`history-status ${entry.type}`}>
                          {entry.type === 'connected' ? '🟢' : '🔴'}
                        </span>
                        <span className="history-time">{formatTime(entry.time)}</span>
                        {entry.latency && (
                          <span className="history-latency">{entry.latency}ms</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {import.meta.env.DEV && (
                <div className="detail-section">
                  <h5>Debug</h5>
                  <div className="detail-row">
                    <span className="detail-label">Режим:</span>
                    <span className="detail-value">🛠️ Development</span>
                  </div>
                  <button 
                    className="debug-action-button"
                    onClick={() => reconnectWebSocket()}
                  >
                    🔄 Тест переподключення
                  </button>
                </div>
              )}
            </div>
            
            <div className="details-footer">
              <small>Автоматичне оновлення кожні 5 секунд</small>
            </div>
          </div>
        )}
      </div>

      {/* Уведомления */}
      {notification && showNotifications && (
        <div className={`connection-notification notification-${notification.type}`}>
          <div className="notification-content">
            <div className="notification-header">
              <span className="notification-icon">{notification.icon}</span>
              <span className="notification-title">{notification.title}</span>
              <button
                className="notification-close"
                onClick={closeNotification}
                aria-label="Закрити сповіщення"
              >
                ×
              </button>
            </div>
            
            <div className="notification-message">
              {notification.message}
            </div>
            
            {notification.action && (
              <div className="notification-actions">
                <button
                  className="notification-action-button"
                  onClick={handleNotificationAction}
                >
                  {notification.action}
                </button>
              </div>
            )}
          </div>
          
          {!notification.persistent && (
            <div className="notification-progress" />
          )}
        </div>
      )}
    </>
  );
};

ConnectionStatus.propTypes = {
  position: PropTypes.oneOf([
    'top-left', 'top-right', 
    'bottom-left', 'bottom-right'
  ]),
  showNotifications: PropTypes.bool
};

export default ConnectionStatus;