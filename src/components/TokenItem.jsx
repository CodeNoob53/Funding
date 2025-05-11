// src/components/TokenItem.jsx
import PropTypes from 'prop-types';
import { memo } from 'react';
import './TokenItem.css';
import dayjs from 'dayjs';
import TokenCap from '../assets/cap/TokenCap.avif';
import useAppStore from '../store/appStore';

const TokenItem = memo(function TokenItem({ token, marginType, onClick, onRateClick }) {
  const { sortedExchangeKeys, filters } = useAppStore((state) => ({
    sortedExchangeKeys: state.sortedExchangeKeys,
    filters: state.filters,
  }));

  const { stablecoinExchanges, tokenExchanges } = filters;

  const formatRate = (rate) => {
    if (rate === undefined || rate === null || isNaN(rate)) return '—';
    return `${parseFloat(rate).toFixed(4)}%`;
  };

  const formatHoursFromNow = (timestamp) => {
    if (!timestamp) return '';
    const now = dayjs();
    const target = dayjs(Number(timestamp));
    const diffMinutes = target.diff(now, 'minute');
    if (diffMinutes <= 0) return '';
    if (diffMinutes < 60) return `${diffMinutes}хв`;
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return minutes === 0 ? `${hours}г` : `${hours}г ${minutes}хв`;
  };

  const marginList = marginType === 'stablecoin' ? token.stablecoin_margin_list : token.token_margin_list;

  const exchangeData = Array.isArray(marginList)
    ? marginList.reduce((acc, entry) => {
        if (entry.exchange) {
          acc[entry.exchange.toLowerCase()] = {
            funding_rate: entry.funding_rate,
            funding_rate_interval: entry.funding_rate_interval,
            next_funding_time: entry.next_funding_time,
            predicted_rate: entry.predicted_rate,
            price: entry.price,
            exchange_logo: entry.exchange_logo || 'https://via.placeholder.com/20',
            status: entry.status,
          };
        }
        return acc;
      }, {})
    : {};

  const tokenLogoSrc =
    token.symbolLogo && token.symbolLogo !== 'https://cdn.coinglasscdn.com/static/blank.png'
      ? token.symbolLogo
      : TokenCap;

  return (
    <tr onClick={() => onClick(token)} className="token-row">
      <td className="token-cell">
        <div className="token-info">
          <img
            src={tokenLogoSrc}
            alt={token.symbol}
            className="token-icon"
            onError={(e) => (e.target.src = TokenCap)}
          />
          <span>{token.symbol}</span>
        </div>
      </td>
      {sortedExchangeKeys
        .filter((key) =>
          marginType === 'stablecoin' ? stablecoinExchanges[key] !== false : tokenExchanges[key] !== false
        )
        .map((exchangeKey) => {
          const data = exchangeData[exchangeKey];
          if (!data) {
            return (
              <td key={exchangeKey} className="exchange-cell">
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
              key={exchangeKey}
              className="exchange-cell"
              onClick={(e) => {
                e.stopPropagation();
                if (data) {
                  onRateClick({ token, exchange: exchangeKey, ...data });
                }
              }}
            >
              {rate !== undefined && rate !== null ? (
                <div className="rate-container">
                  <span
                    className={`rate-value ${
                      isPositive ? 'rate-positive' : isNegative ? 'rate-negative' : 'rate-neutral'
                    } ${isPredicted ? 'rate-predicted-style' : ''}`}
                  >
                    {formatRate(rate)}
                    {isPredicted ? '*' : ''}
                  </span>
                  {predictedRate !== undefined &&
                    predictedRate !== null &&
                    predictedRate !== rate &&
                    !isPredicted && (
                      <span
                        className={`rate-predicted ${
                          predictedRate > 0 ? 'rate-positive' : predictedRate < 0 ? 'rate-negative' : 'rate-neutral'
                        }`}
                      >
                        Прогноз: {formatRate(predictedRate)}
                      </span>
                    )}
                  {(interval || nextIn) && (
                    <span className="rate-interval">
                      {interval ? `${interval}г` : ''}
                      {interval && nextIn ? ' • ' : ''}
                      {nextIn}
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
  marginType: PropTypes.oneOf(['stablecoin', 'token']).isRequired,
  onClick: PropTypes.func.isRequired,
  onRateClick: PropTypes.func.isRequired,
};

export default TokenItem;