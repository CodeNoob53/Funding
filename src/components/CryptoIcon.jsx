import PropTypes from 'prop-types';

function CryptoIcon({ symbol, size }) {
  const iconPath = `/node_modules/cryptocurrency-icons/svg/color/${symbol.toLowerCase()}.svg`;
  const fallbackIconPath = '/node_modules/cryptocurrency-icons/svg/color/generic.svg';

  return (
    <img
      src={iconPath}
      alt={`${symbol} icon`}
      className="crypto-icon"
      style={{
        width: `${size * 6}px`, // Наприклад, size=6 → 24px
        height: `${size * 6}px`,
        objectFit: 'contain', // Масштабуємо пропорційно
      }}
      onError={(e) => {
        e.target.src = fallbackIconPath;
      }}
    />
  );
}

CryptoIcon.propTypes = {
  symbol: PropTypes.string.isRequired,
  size: PropTypes.number.isRequired,
};

export default CryptoIcon;