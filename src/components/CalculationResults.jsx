import PropTypes from 'prop-types';
import ExchangeIcon from './ExchangeIcon';

function CalculationResults({ data }) {
  const ResultRow = ({ label, value, isHighlight = false, info = null, icon = null }) => (
    <div className={`flex justify-between items-center p-3 rounded-lg
                    ${isHighlight ? 'bg-[rgb(var(--primary))/10] border border-[rgb(var(--primary))/20]' 
                                  : 'bg-[rgb(var(--foreground))/5]'}`
    }>
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium">{label}</span>
        </div>
        {info && <span className="text-xs text-[rgb(var(--foreground))/60] mt-1">{info}</span>}
      </div>
      <span className="font-semibold">{value}</span>
    </div>
  );

  ResultRow.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    isHighlight: PropTypes.bool,
    info: PropTypes.string,
    icon: PropTypes.node
  };

  // Функція для безпечного форматування чисел
  const safeFormat = (num, prefix = '', suffix = '', decimals = 2) => {
    if (num === undefined || num === null) return `${prefix}0${suffix}`;
    return `${prefix}${parseFloat(num).toFixed(decimals)}${suffix}`;
  };

  return (
    <div className="space-y-3 animate-slide">
      {data.selectedSymbol && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold">
            Результати для {data.selectedSymbol}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className={`px-2 py-1 rounded-md text-xs font-medium 
                            ${data.positionType === 'long' 
                            ? 'bg-green-500/10 text-green-500' 
                            : 'bg-red-500/10 text-red-500'}`}>
              {data.positionType === 'long' ? 'Long' : 'Short'}
            </span>
            {data.selectedExchange && (
              <div className="flex items-center gap-1 px-2 py-1 bg-[rgb(var(--foreground))/5 rounded-md text-xs">
                <ExchangeIcon exchange={data.selectedExchange} size={12} />
                <span>{data.selectedExchange}</span>
              </div>
            )}
          </div>
        </div>
      )}
      
      <ResultRow 
        label="Початкова маржа"
        value={safeFormat(data.initialMargin, '$')}
        info="Мінімальна сума для відкриття позиції"
        icon={<span role="img" aria-label="chart">📊</span>}
      />
      
      <ResultRow 
        label="Рекомендована маржа"
        value={safeFormat(data.recommendedMargin, '$')}
        info="Рекомендована сума для безпечної торгівлі"
        icon={<span role="img" aria-label="shield">🛡️</span>}
      />
      
      <ResultRow 
        label="Ціна ліквідації"
        value={safeFormat(data.liquidationPrice, '$', '', 6)}
        info="Ціна, при якій позиція буде ліквідована"
        icon={<span role="img" aria-label="alert">🚨</span>}
      />
      
      <ResultRow 
        label="Відсоток до ліквідації"
        value={safeFormat(data.liquidationMove, '', '%')}
        info="Необхідна зміна ціни для ліквідації"
        icon={<span role="img" aria-label="chart-down">📉</span>}
      />
      
      <ResultRow 
        label="Загальні комісії"
        value={safeFormat(data.totalFees, '$')}
        info="Сума комісій за відкриття та закриття"
        icon={<span role="img" aria-label="money">💸</span>}
      />
      
      <div className="pt-3 border-t border-[rgb(var(--border))]">
        <h4 className="text-md font-semibold mb-3 flex items-center gap-2">
          <span role="img" aria-label="coin">🪙</span>
          Прибуток від фандингу
        </h4>
        
        <ResultRow 
          label="За 8 годин"
          value={safeFormat(data.estimatedFundingProfit, '$')}
          isHighlight={true}
        />
        
        <ResultRow 
          label="За день"
          value={safeFormat(data.estimatedDailyFundingProfit, '$')}
        />
        
        <ResultRow 
          label="За тиждень"
          value={safeFormat(data.estimatedDailyFundingProfit * 7, '$')}
        />
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
    selectedExchange: PropTypes.string,
    positionType: PropTypes.oneOf(['long', 'short']),
  }).isRequired,
};

export default CalculationResults;