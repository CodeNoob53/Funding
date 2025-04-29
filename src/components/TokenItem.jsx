import PropTypes from 'prop-types';
import CryptoIcon from './CryptoIcon';

function TokenItem({ token, exchanges, onClick, onRateClick }) {
  // Функція для форматування та відображення ставки фандингу
  const formatRate = (rate, exchange) => {
    if (rate === undefined || rate === null || rate === '-') return '-';
    
    const value = (parseFloat(rate) * 100).toFixed(4);
    const isPositive = parseFloat(value) > 0;
    const isHighValue = Math.abs(parseFloat(value)) >= 0.15;
    
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRateClick(token, exchange, rate);
        }}
        className={`
          px-2 py-1 rounded-md transition-colors duration-200 w-full
          ${isPositive ? 'text-green-500 hover:bg-green-500/10' : 'text-red-500 hover:bg-red-500/10'} 
          ${isHighValue ? 'font-bold' : ''}
          hover:shadow-sm
        `}
        title={`Використати ${exchange} фандинг для калькулятора`}
      >
        <span>{value}%</span>
      </button>
    );
  };

  // Функція для обчислення річної прибутковості (APR) на основі ставки фандингу
  const calculateApr = (rate) => {
    if (rate === undefined || rate === null || rate === '-') return null;
    const annualizedRate = parseFloat(rate) * 3 * 365; // 3 рази на день, 365 днів
    return (annualizedRate * 100).toFixed(2);
  };

  const apr = calculateApr(token.fundingRate);

  // Функція для отримання наступного часу фандингу (якщо є)
  const getNextFundingTime = (exchangeName) => {
    const nextFundingKey = `${exchangeName}NextFundingTime`;
    return token[nextFundingKey];
  };

  // Функція для отримання значення фандингу для конкретної біржі
  const getExchangeFunding = (exchangeName) => {
    // Використовуємо ключ біржі безпосередньо, оскільки він вже у нижньому регістрі
    return token[exchangeName];
  };

  // Функція для форматування часу
  const formatTime = (timestamp) => {
    if (!timestamp) return null;
    
    try {
      const date = new Date(parseInt(timestamp));
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch (e) {
      console.error('Error formatting time:', e);
      return null;
    }
  };

  return (
    <tr 
      className="table-row-hover transition-all duration-200 hover:shadow-md hover:bg-[rgb(var(--foreground))/5]"
      onClick={() => onClick(token)}
    >
      <td className="table-cell font-medium py-4 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <CryptoIcon symbol={token.symbol} size={6} />
          <div className="flex flex-col">
            <div className="text-sm sm:text-base font-medium">{token.symbol}</div>
            {apr && (
              <div className="text-xs opacity-60">
                APR: {apr}%
              </div>
            )}
          </div>
        </div>
      </td>
      
      {/* Динамічно відображаємо стовпці для всіх бірж */}
      {exchanges.map(exchange => {
        const fundingRate = getExchangeFunding(exchange);
        const nextFundingTime = getNextFundingTime(exchange);
        const formattedTime = formatTime(nextFundingTime);
        
        return (
          <td key={exchange} className="table-cell text-right py-4 px-4 sm:px-6">
            <div className="flex flex-col items-end gap-1">
              {formatRate(fundingRate, exchange)}
              
              {formattedTime && (
                <div className="text-xs opacity-50">
                  {formattedTime}
                </div>
              )}
            </div>
          </td>
        );
      })}
    </tr>
  );
}

TokenItem.propTypes = {
  token: PropTypes.shape({
    symbol: PropTypes.string.isRequired,
    fundingRate: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    // Динамічні властивості для бірж не описуємо в PropTypes
  }).isRequired,
  exchanges: PropTypes.arrayOf(PropTypes.string).isRequired,
  onClick: PropTypes.func.isRequired,
  onRateClick: PropTypes.func.isRequired,
};

export default TokenItem;