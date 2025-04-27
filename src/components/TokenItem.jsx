import PropTypes from 'prop-types';
import CryptoIcon from './CryptoIcon';

function TokenItem({ token, onClick, onRateClick }) {
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

  const calculateApr = (rate) => {
    if (rate === undefined || rate === null || rate === '-') return null;
    const annualizedRate = parseFloat(rate) * 3 * 365;
    return (annualizedRate * 100).toFixed(2);
  };

  const apr = calculateApr(token.fundingRate);

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
      <td className="table-cell text-right py-4 px-4 sm:px-6">{formatRate(token.binanceFunding, 'Binance')}</td>
      <td className="table-cell text-right py-4 px-4 sm:px-6">{formatRate(token.okexFunding, 'OKX')}</td>
      <td className="table-cell text-right py-4 px-4 sm:px-6">{formatRate(token.bybitFunding, 'Bybit')}</td>
      <td className="table-cell text-right py-4 px-4 sm:px-6">{formatRate(token.gateFunding, 'Gate.io')}</td>
      <td className="table-cell text-right py-4 px-4 sm:px-6">{formatRate(token.mexcFunding, 'MEXC')}</td>
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