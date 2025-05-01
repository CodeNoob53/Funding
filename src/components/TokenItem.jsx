// src/components/TokenItem.jsx
import PropTypes from 'prop-types';
import { memo } from 'react';
import CryptoIcon from './CryptoIcon';

const TokenItem = memo(function TokenItem({ token, exchanges, marginType, onClick, onRateClick }) {
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
            predicted_rate: entry.predicted_rate,
            price: entry.price,
            exchange_logo: entry.exchange_logo,
            status: entry.status
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
          {/* Використовуємо іконку з сервера, якщо вона доступна */}
          {token.symbolLogo ? (
            <img src={token.symbolLogo} alt={token.symbol} className="w-6 h-6 rounded-full object-contain" />
          ) : (
            <CryptoIcon symbol={token.symbol} size={4} />
          )}
          <span>{token.symbol}</span>
        </div>
      </td>

      {exchanges.map((exchange) => {
        const data = exchangeData[exchange];
        if (!data) {
          return (
            <td key={exchange} className="text-center text-sm py-4 px-6">
              <span className="text-[rgb(var(--foreground))/30]">—</span>
            </td>
          );
        }

        const rate = data.funding_rate;
        const predictedRate = data.predicted_rate;
        const interval = data.funding_rate_interval;
        const nextTime = data.next_funding_time;
        const nextIn = formatHoursFromNow(nextTime);
        const isPredicted = data.status === 2;

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
                  } ${isPredicted ? 'italic' : ''}`}
                >
                  {formatRate(rate)}{isPredicted ? '*' : ''}
                </span>
                {predictedRate !== undefined && predictedRate !== null && predictedRate !== rate && !isPredicted && (
                  <span
                    className={`text-xs font-medium ${
                      predictedRate > 0 ? 'text-green-400' : predictedRate < 0 ? 'text-red-400' : 'text-[rgb(var(--foreground))/50]'
                    }`}
                  >
                    Прогноз: {formatRate(predictedRate)}
                  </span>
                )}
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
});

TokenItem.propTypes = {
  token: PropTypes.shape({
    symbol: PropTypes.string.isRequired,
    symbolLogo: PropTypes.string,
    stablecoin_margin_list: PropTypes.arrayOf(PropTypes.object),
    token_margin_list: PropTypes.arrayOf(PropTypes.object),
  }).isRequired,
  exchanges: PropTypes.arrayOf(PropTypes.string).isRequired,
  marginType: PropTypes.oneOf(['stablecoin', 'token']).isRequired,
  onClick: PropTypes.func.isRequired,
  onRateClick: PropTypes.func.isRequired,
};

export default TokenItem;