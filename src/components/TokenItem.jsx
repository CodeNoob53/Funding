import PropTypes from 'prop-types';
import CryptoIcon from './CryptoIcon';

function TokenItem({ token, onClick, onRateClick }) {
  const formatRate = (rate, exchange) => {
    if (rate === undefined || rate === null || rate === '-') return '-';
    
    const value = (parseFloat(rate) * 100).toFixed(4);
    const isPositive = parseFloat(value) > 0;
    const isHighValue = Math.abs(parseFloat(value)) >= 0.15;
    
    return (
      <span
        onClick={(e) => {
          e.stopPropagation(); // Зупиняємо bubbling, щоб клік на рядок не спрацьовував
          console.log(`Clicked on ${exchange} rate: ${rate}`); // Дебаг-логування
          onRateClick(token, exchange, rate);
        }}
        className={`
          cursor-pointer px-2 py-1 rounded-md transition-colors duration-200
          ${isPositive ? 'text-green-500' : 'text-red-500'} 
          ${isHighValue ? 'font-bold' : ''}
          hover:bg-gray-200 dark:hover:bg-gray-700 hover:shadow-sm !important
        `}
      >
        {value}%
      </span>
    );
  };

  const calculateApr = (rate) => {
    if (rate === undefined || rate === null || rate === '-') return null;
    const annualizedRate = parseFloat(rate) * 3 * 365;
    return (annualizedRate * 100).toFixed(2);
  };

  const apr = calculateApr(token.fundingRate);

  return (
    <tr className="table-row-hover" onClick={() => onClick(token)}>
      <td className="table-cell font-medium flex items-center gap-2">
        <CryptoIcon symbol={token.symbol} size={6} />
        <div>
          <div>{token.symbol}</div>
          {apr && (
            <div className="text-xs opacity-60">
              APR: {apr}%
            </div>
          )}
        </div>
      </td>
      <td className="table-cell text-right">{formatRate(token.binanceFunding, 'Binance')}</td>
      <td className="table-cell text-right">{formatRate(token.okexFunding, 'OKX')}</td>
      <td className="table-cell text-right">{formatRate(token.bybitFunding, 'Bybit')}</td>
      <td className="table-cell text-right">{formatRate(token.gateFunding, 'Gate.io')}</td>
      <td className="table-cell text-right">{formatRate(token.mexcFunding, 'MEXC')}</td>
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
  onRateClick: PropTypes.func.isRequired,
};

export default TokenItem;