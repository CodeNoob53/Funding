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

  return (
    <div className="space-y-3 animate-slide">
      {data.selectedSymbol && (
        <h3 className="text-lg font-semibold mb-4">
          Результати для {data.selectedSymbol}
        </h3>
      )}
      
      <ResultRow 
        label="📊 Початкова маржа"
        value={`$${data.initialMargin.toFixed(2)}`}
        info="Мінімальна сума для відкриття позиції"
      />
      
      <ResultRow 
        label="🛡️ Рекомендована маржа"
        value={`$${data.recommendedMargin.toFixed(2)}`}
        info="Рекомендована сума для безпечної торгівлі"
      />
      
      <ResultRow 
        label="🚨 Ціна ліквідації"
        value={`$${data.liquidationPrice.toFixed(2)}`}
        info="Ціна, при якій позиція буде ліквідована"
      />
      
      <ResultRow 
        label="📉 Відсоток до ліквідації"
        value={`${data.liquidationMove.toFixed(2)}%`}
        info="Необхідна зміна ціни для ліквідації"
      />
      
      <ResultRow 
        label="💸 Загальні комісії"
        value={`$${data.totalFees.toFixed(2)}`}
        info="Сума комісій за відкриття та закриття"
      />
      
      <div className="pt-3 border-t border-[rgb(var(--border))]">
        <h4 className="text-md font-semibold mb-3">Прибуток від фандингу</h4>
        
        <ResultRow 
          label="🪙 За 8 годин"
          value={`$${data.estimatedFundingProfit.toFixed(2)}`}
          isHighlight={true}
        />
        
        <ResultRow 
          label="🪙 За день"
          value={`$${data.estimatedDailyFundingProfit.toFixed(2)}`}
        />
        
        <ResultRow 
          label="🪙 За місяць"
          value={`$${data.estimatedMonthlyFundingProfit.toFixed(2)}`}
        />
        
        <ResultRow 
          label="🪙 За рік"
          value={`$${data.estimatedYearlyFundingProfit.toFixed(2)}`}
        />
        
        <ResultRow 
          label="📈 Річна дохідність (APR)"
          value={`${data.fundingApr.toFixed(2)}%`}
          isHighlight={true}
          info="Річна процентна ставка від фандингу"
        />
      </div>
    </div>
  );
}

CalculationResults.propTypes = {
  data: PropTypes.shape({
    selectedSymbol: PropTypes.string,
    initialMargin: PropTypes.number.isRequired,
    recommendedMargin: PropTypes.number.isRequired,
    liquidationPrice: PropTypes.number.isRequired,
    liquidationMove: PropTypes.number.isRequired,
    totalFees: PropTypes.number.isRequired,
    estimatedFundingProfit: PropTypes.number.isRequired,
    estimatedDailyFundingProfit: PropTypes.number.isRequired,
    estimatedMonthlyFundingProfit: PropTypes.number.isRequired,
    estimatedYearlyFundingProfit: PropTypes.number.isRequired,
    fundingApr: PropTypes.number.isRequired
  }).isRequired,
};

export default CalculationResults;