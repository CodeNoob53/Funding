import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';

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
      <div className="flex items-center justify-center h-full min-h-[300px] bg-gray-50 rounded-xl border border-gray-200">
        <p className="text-gray-500 italic">
          Заповніть форму і натисніть розрахувати, щоб побачити результати
        </p>
      </div>
    );
  }

  return (
    <div
      className={`bg-[rgb(var(--card))] rounded-xl p-6 border border-[rgb(var(--border))] 
              transition-all duration-500 
              ${showAnimation ? 'animate-slide-up' : ''}`}
    >
      <h3 className="text-xl font-semibold text-[rgb(var(--foreground))] mb-4">
        {data.selectedSymbol
          ? `Результати для ${data.selectedSymbol}`
          : 'Результати розрахунку'
        }
      </h3>

      <div className="space-y-4">
        <div className="flex justify-between items-center p-3 bg-[rgb(var(--card))/50] rounded-lg shadow-sm border border-[rgb(var(--border))]">
          <span className="font-medium">📈 Початкова маржа:</span>
          <span className="font-semibold text-lg">${data.initialMargin.toFixed(2)}</span>
        </div>

        <div className="flex justify-between items-center p-3 bg-[rgb(var(--card))/50] rounded-lg shadow-sm border border-[rgb(var(--border))]">
          <span className="font-medium">🛡️ Рекомендована маржа:</span>
          <span className="font-semibold text-lg">${data.recommendedMargin.toFixed(2)}</span>
        </div>

        <div className="flex justify-between items-center p-3 bg-[rgb(var(--card))/50] rounded-lg shadow-sm border border-[rgb(var(--border))]">
          <span className="font-medium">🚨 Ціна ліквідації {data.positionType === 'short' ? '(для шорту)' : ''}:</span>
          <span className="font-semibold text-lg text-error-500">
            ${data.liquidationPrice.toFixed(2)}
          </span>
        </div>

        <div className="flex justify-between items-center p-3 bg-[rgb(var(--card))/50] rounded-lg shadow-sm border border-[rgb(var(--border))]">
          <span className="font-medium">📉 Рух ціни до ліквідації:</span>
          <span className="font-semibold text-lg">
            {data.liquidationMove.toFixed(2)}%
          </span>
        </div>

        <div className="flex justify-between items-center p-3 bg-[rgb(var(--card))/50] rounded-lg shadow-sm border border-[rgb(var(--border))]">
          <span className="font-medium">💸 Загальні комісії:</span>
          <span className="font-semibold text-lg">${data.totalFees.toFixed(2)}</span>
        </div>

        <div className="flex justify-between items-center p-3 border-l-4 border-accent-500 rounded-lg shadow-sm bg-[rgb(var(--card))/50]">
          <span className="font-medium">🪙 Прибуток від фандингу (8 год):</span>
          <span className={`font-semibold text-lg ${data.estimatedFundingProfit >= 0 ? 'text-accent-500' : 'text-error-500'}`}>
            ${data.estimatedFundingProfit.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between items-center p-3 bg-[rgb(var(--card))/50] rounded-lg shadow-sm border border-[rgb(var(--border))]">
          <span className="font-medium">📆 Щоденний прибуток (фандинг):</span>
          <span className="font-semibold text-lg">
            ${data.estimatedDailyFundingProfit.toFixed(2)}
          </span>
        </div>

        <div className="flex justify-between items-center p-3 bg-[rgb(var(--card))/50] rounded-lg shadow-sm border border-[rgb(var(--border))]">
          <span className="font-medium">📅 Місячний прибуток (фандинг):</span>
          <span className="font-semibold text-lg">
            ${data.estimatedMonthlyFundingProfit.toFixed(2)}
          </span>
        </div>

        <div className="flex justify-between items-center p-3 bg-[rgb(var(--card))/50] rounded-lg shadow-sm border border-[rgb(var(--border))]">
          <span className="font-medium">📈 Річна прибутковість (APR):</span>
          <span className="font-semibold text-lg">
            {data.fundingAPR.toFixed(2)}%
          </span>
        </div>
        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-400">
          <span className="font-medium">💰 Чистий прибуток (фандинг - комісії):</span>
          <span className={`font-semibold text-lg ${data.netProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
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