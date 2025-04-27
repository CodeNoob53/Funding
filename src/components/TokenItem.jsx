import PropTypes from 'prop-types';

function TokenItem({ token, onClick }) {
  // Функція для форматування ставки фандингу
  const formatRate = (rate) => {
    if (rate === undefined || rate === null || rate === '-') return '-';
    
    const value = (parseFloat(rate) * 100).toFixed(4);
    const isPositive = parseFloat(value) > 0;
    const isHighValue = Math.abs(parseFloat(value)) >= 0.15;
    
    return (
      <span className={`
        ${isPositive ? 'text-green-500' : 'text-red-500'} 
        ${isHighValue ? 'font-bold' : ''}
      `}>
        {value}%
      </span>
    );
  };

  // Обчислення APR (Annual Percentage Rate) з урахуванням того, що фандинг стягується кожні 8 годин
  const calculateApr = (rate) => {
    if (rate === undefined || rate === null || rate === '-') return null;
    
    // 3 рази на день * 365 днів
    const annualizedRate = parseFloat(rate) * 3 * 365;
    return (annualizedRate * 100).toFixed(2);
  };

  // Отримуємо APR для потенційного відображення
  const apr = calculateApr(token.fundingRate);

  return (
    <tr className="table-row-hover" onClick={() => onClick(token)}>
      <td className="table-cell font-medium flex items-center gap-2">
        <img 
          src={`https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/32/color/${token.symbol.toLowerCase()}@2x.png`}
          alt={token.symbol}
          className="w-6 h-6"
          onError={(e) => {
            e.target.src = 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/32/color/generic@2x.png';
          }}
        />
        <div>
          <div>{token.symbol}</div>
          {apr && (
            <div className="text-xs opacity-60">
              APR: {apr}%
            </div>
          )}
        </div>
      </td>
      <td className="table-cell text-right">{formatRate(token.binanceFunding)}</td>
      <td className="table-cell text-right">{formatRate(token.okexFunding)}</td>
      <td className="table-cell text-right">{formatRate(token.bybitFunding)}</td>
      <td className="table-cell text-right">{formatRate(token.gateFunding)}</td>
      <td className="table-cell text-right">{formatRate(token.mexcFunding)}</td>
    </tr>
  );
}

TokenItem.propTypes = {
  token: PropTypes.shape({
    symbol: PropTypes.string.isRequired,
    fundingRate: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    binanceFunding: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    okexFunding: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    bybitFunding: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    gateFunding: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    mexcFunding: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }).isRequired,
  onClick: PropTypes.func.isRequired,
};

export default TokenItem;