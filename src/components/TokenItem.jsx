import PropTypes from 'prop-types';

function TokenItem({ token, onClick }) {
  const formatRate = (rate) => {
    if (!rate || rate === '-') return '-';
    const value = (parseFloat(rate) * 100).toFixed(4);
    const isPositive = parseFloat(value) > 0;
    return (
      <span className={isPositive ? 'text-green-500' : 'text-red-500'}>
        {value}%
      </span>
    );
  };

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
        {token.symbol}
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
    binanceFunding: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    okexFunding: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    bybitFunding: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    gateFunding: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    mexcFunding: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }).isRequired,
  onClick: PropTypes.func.isRequired,
};

export default TokenItem;