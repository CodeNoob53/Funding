// src/components/CalculationResults.jsx
import PropTypes from 'prop-types';

function CalculationResults({ data }) {
  const ResultRow = ({ label, value, isHighlight = false, info = null }) => (
    <div className={`flex justify-between items-center p-3 rounded-lg
                    ${isHighlight ? 'bg-[rgb(var(--primary))/10] border border-[rgb(var(--primary))/20]' 
                                  : 'bg-[rgb(var(--foreground))/5]'}`
    }>
      <div className="flex flex-col">
        <span className="font-medium">{label}</span>
        {info && <span className="text-xs text-[rgb(var(--foreground))/60]">{info}</span>}
      </div>
      <span className="font-semibold">{value}</span>
    </div>
  );

  ResultRow.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    isHighlight: PropTypes.bool,
    info: PropTypes.string
  };

  // Функція для безпечного форматування чисел
  const safeFormat = (num, prefix = '', suffix = '', decimals = 2) => {
    if (num === undefined || num === null) return `${prefix}0${suffix}`;
    return `${prefix}${parseFloat(num).toFixed(decimals)}${suffix}`;
  };

  return (
    <div className="space-y-3 animate-slide">
      {data.selectedSymbol && (
        <h3 className="text-lg font-semibold mb-4">
          Результати для {data.selectedSymbol}
        </h3>
      )}
      
      <ResultRow 
        label="📊 Початкова маржа"
        value={safeFormat(data.initialMargin, '$')}
        info="Мінімальна сума для відкриття позиції"
      />
      
      <ResultRow 
        label="🛡️ Рекомендована маржа"
        value={safeFormat(data.recommendedMargin, '$')}
        info="Рекомендована сума для безпечної торгівлі"
      />
      
      <ResultRow 
        label="🚨 Ціна ліквідації"
        value={safeFormat(data.liquidationPrice, '$')}
        info="Ціна, при якій позиція буде ліквідована"
      />
      
      <ResultRow 
        label="📉 Відсоток до ліквідації"
        value={safeFormat(data.liquidationMove, '', '%')}
        info="Необхідна зміна ціни для ліквідації"
      />
      
      <ResultRow 
        label="💸 Загальні комісії"
        value={safeFormat(data.totalFees, '$')}
        info="Сума комісій за відкриття та закриття"
      />
      
      <div className="pt-3 border-t border-[rgb(var(--border))]">
        <h4 className="text-md font-semibold mb-3">Прибуток від фандингу</h4>
        
        <ResultRow 
          label="🪙 За 8 годин"
          value={safeFormat(data.estimatedFundingProfit, '$')}
          isHighlight={true}
        />
        
        <ResultRow 
          label="🪙 За день"
          value={safeFormat(data.estimatedDailyFundingProfit, '$')}
        />
        
        <ResultRow 
          label="🪙 За місяць"
          value={safeFormat(data.estimatedMonthlyFundingProfit, '$')}
        />
        
        <ResultRow 
          label="🪙 За рік"
          value={safeFormat(data.estimatedYearlyFundingProfit, '$')}
        />
        
        <ResultRow 
          label="📈 Річна дохідність (APR)"
          value={safeFormat(data.fundingApr, '', '%')}
          isHighlight={true}
          info="Річна процентна ставка від фандингу"
        />
      </div>
    </div>
  );
}

// Оновлені PropTypes - зробимо всі властивості необов'язковими, оскільки 
// ми додали захисне форматування для уникнення помилок
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
    estimatedYearlyFundingProfit: PropTypes.number,
    fundingApr: PropTypes.number
  }).isRequired,
};

export default CalculationResults;