// src/components/ExchangeIcon.jsx
import PropTypes from 'prop-types';
import * as simpleIcons from 'simple-icons/icons';

function ExchangeIcon({ exchange, size = 32, color = 'currentColor' }) {
  // Маппінг назв бірж до їх назв у simple-icons
  const exchangeMappings = {
    'Binance': 'Binance',
    'OKX': 'OKX',
    'Bybit': 'Bybit',
    'Gate.io': 'Gateio', // У simple-icons немає крапки
    'MEXC': 'MEXC',
  };
  
  // Отримуємо назву іконки з маппінгу або використовуємо оригінальну назву
  const iconName = exchangeMappings[exchange] || exchange;
  const normalizedName = iconName.toLowerCase().replace(/\s+/g, '');
  
  // Шукаємо іконку за різними шляхами
  const icon = 
    simpleIcons[`si${iconName.charAt(0).toUpperCase() + normalizedName.slice(1).toLowerCase()}`] ||
    Object.values(simpleIcons).find(icon => 
      icon.slug === normalizedName || 
      icon.title.toLowerCase().replace(/\s+/g, '') === normalizedName
    );

  if (!icon) {
    // Якщо біржа не знайдена — рендеримо заглушку
    return (
      <div
        style={{
          width: size,
          height: size,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgb(var(--foreground))',
          opacity: 0.2,
          borderRadius: '50%',
          fontSize: size * 0.4,
          color: 'rgb(var(--background))',
          fontWeight: 'bold'
        }}
        title={exchange}
      >
        {exchange.slice(0, 1)}
      </div>
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      title={exchange}
    >
      <svg
        role="img"
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill={color}
        xmlns="http://www.w3.org/2000/svg"
      >
        <title>{exchange}</title>
        <path d={icon.path} />
      </svg>
    </div>
  );
}

ExchangeIcon.propTypes = {
  exchange: PropTypes.string.isRequired,
  size: PropTypes.number,
  color: PropTypes.string,
};

export default ExchangeIcon;