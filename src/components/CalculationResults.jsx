import PropTypes from 'prop-types';
function CalculationResults({ data }) {
  const ResultRow = ({ label, value, isHighlight = false }) => (
    <div className={`flex justify-between items-center p-3 rounded-lg
                    ${isHighlight ? 'bg-[rgb(var(--primary))/10] border border-[rgb(var(--primary))/20]' 
                                  : 'bg-[rgb(var(--foreground))/5]'}`
    }>
      <span className="font-medium">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );

  ResultRow.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    isHighlight: PropTypes.bool,
  };

  return (
    <div className="space-y-3 animate-slide">
      {data.selectedSymbol && (
        <h3 className="text-lg font-semibold mb-4">
          Results for {data.selectedSymbol}
        </h3>
      )}
      
      <ResultRow 
        label="📈 Initial Margin"
        value={`$${data.initialMargin.toFixed(2)}`}
      />
      
      <ResultRow 
        label="🛡️ Recommended Margin"
        value={`$${data.recommendedMargin.toFixed(2)}`}
      />
      
      <ResultRow 
        label="🚨 Liquidation Price"
        value={`$${data.liquidationPrice.toFixed(2)}`}
      />
      
      <ResultRow 
        label="📉 Price Move to Liquidation"
        value={`${data.liquidationMove.toFixed(2)}%`}
      />
      
      <ResultRow 
        label="💸 Total Fees"
        value={`$${data.totalFees.toFixed(2)}`}
      />
      
      <ResultRow 
        label="🪙 Est. Funding Profit (8h)"
        value={`$${data.estimatedFundingProfit.toFixed(2)}`}
        isHighlight
      />
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
    estimatedFundingProfit: PropTypes.number.isRequired
  }).isRequired,
};

export default CalculationResults;