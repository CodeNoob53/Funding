// src/components/ExchangeIcon.jsx
import PropTypes from 'prop-types';
import * as simpleIcons from 'simple-icons/icons';

function ExchangeIcon({ exchange, size = 32, color = 'currentColor' }) {
  const normalizedExchange = exchange.toLowerCase().replace(/\s+/g, '');

  // Спроба знайти іконку
  const icon = Object.values(simpleIcons).find((icon) => 
    icon.slug === normalizedExchange || icon.title.toLowerCase() === exchange.toLowerCase()
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
          background: '#ccc',
          borderRadius: '50%',
          fontSize: size * 0.4,
          color: '#fff'
        }}
        title={exchange}
      >
        ?
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
        <title>{icon.title}</title>
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
