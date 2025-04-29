/**
 * Універсальний логер для виведення повідомлень та помилок
 * Працює як у браузері, так і на стороні сервера (Render.com)
 */

// Визначаємо, чи знаходимося ми в продакшн режимі
const isProd = import.meta.env.PROD || (typeof globalThis.process !== 'undefined' && globalThis.process.env.NODE_ENV === 'production');

// Рівні логування
const LogLevel = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
};

// Колір для кожного рівня логування (для консолі браузера)
const LogColors = {
  [LogLevel.DEBUG]: '#7986CB', // світло-синій
  [LogLevel.INFO]: '#4CAF50',  // зелений
  [LogLevel.WARN]: '#FF9800',  // помаранчевий
  [LogLevel.ERROR]: '#F44336', // червоний
};

/**
 * Основна функція логування
 * @param {string} level - Рівень логування (debug, info, warn, error)
 * @param {string} message - Основне повідомлення
 * @param {any} data - Додаткові дані (об'єкт, помилка, тощо)
 */
const log = (level, message, data = null) => {
  // У продакшн режимі виводимо лише warn та error
  if (isProd && ![LogLevel.WARN, LogLevel.ERROR].includes(level)) {
    return;
  }

  // Отримуємо поточний timestamp
  const timestamp = new Date().toISOString();
  
  // Форматуємо базове повідомлення
  const baseMsg = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  
  // Додаткові метадані для логування
  const meta = {
    timestamp,
    level,
    message,
  };

  if (data) {
    // Якщо дані є об'єктом помилки, обробляємо його спеціально
    if (data instanceof Error) {
      meta.error = {
        name: data.name,
        message: data.message,
        stack: data.stack,
      };
    } else {
      meta.data = data;
    }
  }

  // Визначаємо, яку функцію консолі використовувати
  const consoleMethod = console[level] || console.log;

  // Логування у браузері з кольорами
  if (typeof window !== 'undefined') {
    if (data) {
      consoleMethod(
        `%c${baseMsg}`, 
        `color: ${LogColors[level]}; font-weight: bold;`, 
        data instanceof Error ? { 
          message: data.message, 
          stack: data.stack,
          ...data
        } : data
      );
    } else {
      consoleMethod(`%c${baseMsg}`, `color: ${LogColors[level]}; font-weight: bold;`);
    }
  } 
  // Логування на сервері (Render.com)
  else {
    consoleMethod(JSON.stringify(meta));
  }
};

// Експортуємо функції для різних рівнів логування
const logger = {
  debug: (message, data) => log(LogLevel.DEBUG, message, data),
  info: (message, data) => log(LogLevel.INFO, message, data),
  warn: (message, data) => log(LogLevel.WARN, message, data),
  error: (message, data) => log(LogLevel.ERROR, message, data),
  
  // Утиліта для логування помилок API з додатковими метаданими
  apiError: (message, error, endpoint = '', params = {}) => {
    const data = {
      endpoint,
      params,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      responseData: error?.response?.data,
      error: error
    };
    
    log(LogLevel.ERROR, `API Error: ${message}`, data);
  }
};

export default logger;