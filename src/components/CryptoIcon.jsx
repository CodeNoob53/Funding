import PropTypes from 'prop-types';
import * as simpleIcons from 'simple-icons/icons';

function CryptoIcon({ symbol, size }) {
  // Мапа для криптовалют з іншими назвами в simple-icons
  const iconMappings = {
    'BTC': 'Bitcoin',
    'ETH': 'Ethereum',
    'SOL': 'Solana',
    'DOGE': 'Dogecoin',
    'XRP': 'Xrp',
    'ADA': 'Cardano',
    'AVAX': 'Avalanche',
    'MATIC': 'Polygon',
    // Для PEPE та APT ймовірно треба додати плейсхолдер
  };
  
  // Отримуємо назву іконки з маппінгу або використовуємо оригінальний символ
  const iconName = iconMappings[symbol] || symbol;
  const normalizedName = iconName.toLowerCase();
  
  // Шукаємо іконку за різними шляхами
  const icon = 
    simpleIcons[`si${iconName.charAt(0).toUpperCase() + normalizedName.slice(1)}`] ||
    Object.values(simpleIcons).find(icon => 
      icon.slug === normalizedName || 
      icon.title.toLowerCase() === iconName.toLowerCase()
    );

  if (!icon) {
    // Якщо іконку не знайдено, показуємо плейсхолдер із символом
    return (
      <div
        style={{
          width: `${size * 6}px`,
          height: `${size * 6}px`,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgb(var(--foreground))',
          opacity: 0.2,
          borderRadius: '50%',
          fontSize: `${size * 2}px`,
          color: 'rgb(var(--background))',
          fontWeight: 'bold'
        }}
        title={symbol}
      >
        {symbol.slice(0, 2)}
      </div>
    );
  }

  return (
    <div
      style={{
        width: `${size * 6}px`,
        height: `${size * 6}px`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      title={symbol}
    >
      <svg
        role="img"
        viewBox="0 0 24 24"
        width={`${size * 6}px`}
        height={`${size * 6}px`}
        fill={`#${icon.hex}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <title>{symbol}</title>
        <path d={icon.path} />
      </svg>
    </div>
  );
}

CryptoIcon.propTypes = {
  symbol: PropTypes.string.isRequired,
  size: PropTypes.number.isRequired,
};

export default CryptoIcon;