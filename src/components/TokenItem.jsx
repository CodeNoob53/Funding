// src/components/TokenItem.jsx
import PropTypes from 'prop-types';
import { memo } from 'react';
import CryptoIcon from './CryptoIcon';
import './TokenItem.css';
import dayjs from 'dayjs';

const TokenItem = memo(function TokenItem({ token, exchanges, marginType, onClick, onRateClick }) {
  const formatRate = (rate) => {
    if (rate === undefined || rate === null || isNaN(rate)) return '—';
    return `${(parseFloat(rate) * 100).toFixed(3)}%`;
  };

  const formatHoursFromNow = (timestamp) => {
    if (!timestamp) return '';
    const now = dayjs();
    const target = dayjs(Number(timestamp));
    const diffMinutes = target.diff(now, 'minute');
    if (diffMinutes <= 0) return '';
    if (diffMinutes < 60) {
      return `${diffMinutes}хв`;
    }
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return minutes === 0
      ? `${hours}г`
      : `${hours}г ${minutes}хв`;
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
    <tr onClick={() => onClick(token)} className="token-row">
      <td className="token-cell">
        <div className="token-info">
          {token.symbolLogo ? (
            <img src={token.symbolLogo} alt={token.symbol} className="token-icon" />
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
            <td key={exchange} className="exchange-cell">
              <span className="rate-empty">—</span>
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
            className="exchange-cell"
            onClick={(e) => {
              e.stopPropagation();
              if (data) {
                onRateClick({ token, exchange, ...data });
              }
            }}
          >
            {rate !== undefined && rate !== null ? (
              <div className="rate-container">
                <span className={`rate-value ${isPositive ? 'rate-positive' : isNegative ? 'rate-negative' : 'rate-neutral'} ${isPredicted ? 'rate-predicted-style' : ''}`}>
                  {formatRate(rate)}{isPredicted ? '*' : ''}
                </span>
                {predictedRate !== undefined && predictedRate !== null && predictedRate !== rate && !isPredicted && (
                  <span className={`rate-predicted ${predictedRate > 0 ? 'rate-positive' : predictedRate < 0 ? 'rate-negative' : 'rate-neutral'}`}>
                    Прогноз: {formatRate(predictedRate)}
                  </span>
                )}
                {(interval || nextIn) && (
                  <span className="rate-interval">
                    {interval ? `${interval}г` : ''}{interval && nextIn ? ' • ' : ''}{nextIn}
                  </span>
                )}
              </div>
            ) : (
              <span className="rate-empty">—</span>
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