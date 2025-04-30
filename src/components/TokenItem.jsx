import PropTypes from 'prop-types';
import CryptoIcon from './CryptoIcon';

function TokenItem({ token, exchanges, marginType, onClick, onRateClick }) {
  const formatRate = (rate) => {
    if (rate === undefined || rate === null || isNaN(rate)) return '—';
    return `${(parseFloat(rate) * 100).toFixed(3)}%`;
  };

  const formatHoursFromNow = (timestamp) => {
    if (!timestamp) return '';
    const diffMs = timestamp - Date.now();
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours > 0 ? `${diffHours.toFixed(1)}г` : '';
  };

  // Отримуємо список даних залежно від marginType
  const marginList = marginType === 'stablecoin' ? token.stablecoin_margin_list : token.token_margin_list;

  // Створюємо мапу бірж для швидкого доступу до даних
  const exchangeData = Array.isArray(marginList)
    ? marginList.reduce((acc, entry) => {
        if (entry.exchange) {
          acc[entry.exchange.toLowerCase()] = {
            funding_rate: entry.funding_rate,
            funding_rate_interval: entry.funding_rate_interval,
            next_funding_time: entry.next_funding_time,
          };
        }
        return acc;
      }, {})
    : {};

  return (
    <tr
      onClick={() => onClick(token)}
      className="hover:bg-[rgb(var(--foreground))/5] cursor-pointer transition-colors"
    >
      <td className="py-4 px-6 text-left font-semibold text-sm text-[rgb(var(--foreground))]">
        <div className="flex items-center gap-3">
          <CryptoIcon symbol={token.symbol} size={4} />
          <span>{token.symbol}</span>
        </div>
      </td>

      {exchanges.map((exchange) => {
        const data = exchangeData[exchange];
        const rate = data?.funding_rate;
        const interval = data?.funding_rate_interval;
        const nextTime = data?.next_funding_time;
        const nextIn = formatHoursFromNow(nextTime);

        const isPositive = rate > 0;
        const isNegative = rate < 0;

        return (
          <td
            key={exchange}
            className="text-center text-sm py-4 px-6"
            onClick={(e) => {
              e.stopPropagation(); // Запобігаємо виклику onClick(token)
              if (data) {
                onRateClick({ token, exchange, ...data });
              }
            }}
          >
            {rate !== undefined && rate !== null ? (
              <div className="flex flex-col items-center gap-1">
                <span
                  className={`font-semibold ${
                    isPositive ? 'text-green-500' : isNegative ? 'text-red-500' : 'text-[rgb(var(--foreground))/70]'
                  }`}
                >
                  {formatRate(rate)}
                </span>
                {(interval || nextIn) && (
                  <span className="text-xs text-[rgb(var(--foreground))/50]">
                    {interval ? `${interval}г` : ''}{interval && nextIn ? ' • ' : ''}{nextIn}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-[rgb(var(--foreground))/30]">—</span>
            )}
          </td>
        );
      })}
    </tr>
  );
}

TokenItem.propTypes = {
  token: PropTypes.shape({
    symbol: PropTypes.string.isRequired,
    stablecoin_margin_list: PropTypes.arrayOf(PropTypes.object),
    token_margin_list: PropTypes.arrayOf(PropTypes.object),
  }).isRequired,
  exchanges: PropTypes.arrayOf(PropTypes.string).isRequired,
  marginType: PropTypes.oneOf(['stablecoin', 'token']).isRequired,
  onClick: PropTypes.func.isRequired,
  onRateClick: PropTypes.func.isRequired,
};

export default TokenItem;