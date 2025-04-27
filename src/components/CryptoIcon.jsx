// src/components/CryptoIcon.jsx
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

function CryptoIcon({ symbol, size = 6, className = '' }) {
  const [iconSrc, setIconSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    let isMounted = true;
    
    const fetchIcon = async () => {
      if (!symbol) return;
      
      try {
        setIsLoading(true);
        
        // Використовуємо динамічний імпорт для завантаження іконок
        try {
          // Використовуємо нижній регістр для символу
          const normalizedSymbol = symbol.toLowerCase();
          // Динамічний імпорт SVG-файлу
          const iconModule = await import(`../assets/cryptoIcons/icons/${normalizedSymbol}.svg`);
          
          if (isMounted) {
            setIconSrc(iconModule.default);
            setHasError(false);
          }
        } catch {
          if (isMounted) {
            // Якщо іконка не знайдена, встановлюємо помилку
            setHasError(true);
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error(`Помилка завантаження іконки ${symbol}:`, error);
          setHasError(true);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    fetchIcon();
    
    return () => {
      isMounted = false;
    };
  }, [symbol]);
  
  // Функція для генерації кольору на основі символу
  const stringToColor = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    let color = '#';
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xFF;
      color += ('00' + value.toString(16)).substr(-2);
    }
    
    return color;
  };

  // Створення запасної іконки з першими літерами символу
  const renderFallbackIcon = () => {
    const backgroundColor = stringToColor(symbol);
    
    return (
      <div 
        className={`w-${size} h-${size} rounded-full flex items-center justify-center ${className}`}
        style={{ backgroundColor }}
      >
        <span className="text-white font-bold text-xs">
          {symbol.substring(0, 2).toUpperCase()}
        </span>
      </div>
    );
  };

  // Відображення скелетону під час завантаження
  if (isLoading) {
    return (
      <div className={`w-${size} h-${size} rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse ${className}`}></div>
    );
  }

  // Якщо була помилка або іконка не знайдена, показуємо запасний варіант
  if (hasError || !iconSrc) {
    return renderFallbackIcon();
  }

  // Інакше показуємо завантажену іконку
  return (
    <img 
      src={iconSrc} 
      alt={`${symbol} icon`}
      className={`w-${size} h-${size} ${className}`}
      onError={() => setHasError(true)} 
    />
  );
}

CryptoIcon.propTypes = {
  symbol: PropTypes.string.isRequired,
  size: PropTypes.number,
  className: PropTypes.string
};

export default CryptoIcon;