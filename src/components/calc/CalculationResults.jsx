// src/components/calc/CalculationResults.jsx
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import './CalculationResults.css';

function CalculationResults({ data }) {
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    if (data) {
      setShowAnimation(true);
      const timer = setTimeout(() => setShowAnimation(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [data]);

  if (!data) {
    return (
      <div className="results-placeholder">
        <p className="placeholder-text">
          Заповніть форму і натисніть розрахувати, щоб побачити результати
        </p>
      </div>
    );
  }

  return (
    <div className={`results-container ${showAnimation ? 'animate-slide-up' : ''}`}>
      <h3 className="results-title">
        {data.selectedSymbol
          ? `Результати для ${data.selectedSymbol}`
          : 'Результати розрахунку'}
      </h3>

      <div className="results-list">
        <div className="result-item">
          <span className="result-label">📈 Початкова маржа:</span>
          <span className="result-value">${data.initialMargin.toFixed(2)}</span>
        </div>

        <div className="result-item">
          <span className="result-label">🛡️ Рекомендована маржа:</span>
          <span className="result-value">${data.recommendedMargin.toFixed(2)}</span>
        </div>

        <div className="result-item">
          <span className="result-label">🚨 Ціна ліквідації {data.positionType === 'short' ? '(для шорту)' : ''}:</span>
          <span className="result-value result-value-error">
            ${data.liquidationPrice.toFixed(2)}
          </span>
        </div>

        <div className="result-item">
          <span className="result-label">📉 Рух ціни до ліквідації:</span>
          <span className="result-value">{data.liquidationMove.toFixed(2)}%</span>
        </div>

        <div className="result-item">
          <span className="result-label">💸 Загальні комісії:</span>
          <span className="result-value">${data.totalFees.toFixed(2)}</span>
        </div>

        <div className="result-item result-item-highlight">
          <span className="result-label">🪙 Прибуток від фандингу (8 год):</span>
          <span className={`result-value ${data.estimatedFundingProfit >= 0 ? 'result-value-positive' : 'result-value-negative'}`}>
            ${data.estimatedFundingProfit.toFixed(2)}
          </span>
        </div>

        <div className="result-item">
          <span className="result-label">📆 Щоденний прибуток (фандинг):</span>
          <span className="result-value">${data.estimatedDailyFundingProfit.toFixed(2)}</span>
        </div>

        <div className="result-item">
          <span className="result-label">📅 Місячний прибуток (фандинг):</span>
          <span className="result-value">${data.estimatedMonthlyFundingProfit.toFixed(2)}</span>
        </div>

        <div className="result-item">
          <span className="result-label">📈 Річна прибутковість (APR):</span>
          <span className="result-value">{data.fundingAPR.toFixed(2)}%</span>
        </div>

        <div className="result-item result-item-net-profit">
          <span className="result-label">💰 Чистий прибуток (фандинг - комісії):</span>
          <span className={`result-value ${data.netProfit >= 0 ? 'result-value-positive' : 'result-value-negative'}`}>
            ${data.netProfit.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}

CalculationResults.propTypes = {
  data: PropTypes.shape({
    selectedSymbol: PropTypes.string,
    initialMargin: PropTypes.number,
    recommendedMargin: PropTypes.number,
    liquidationPrice: PropTypes.number,
    liquidationMove: PropTypes.number,
    totalFees: PropTypes.number,
    estimatedFundingProfit: PropTypes.number,
    estimatedDailyFundingProfit: PropTypes.number,
    estimatedMonthlyFundingProfit: PropTypes.number,
    fundingAPR: PropTypes.number,
    netProfit: PropTypes.number,
    positionType: PropTypes.oneOf(['long', 'short']),
  }),
};

export default CalculationResults;