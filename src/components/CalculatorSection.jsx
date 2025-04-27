import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import CalculatorForm from './CalculatorForm';
import CalculationResults from './CalculationResults';

function CalculatorSection({ selectedToken }) {
  const [calculationData, setCalculationData] = useState(null);
  const [formValues, setFormValues] = useState({
    entryPrice: '',
    leverage: '',
    positionSize: '',
    openFee: '0.04',
    closeFee: '0.04',
    fundingRate: '',
  });

  useEffect(() => {
    if (selectedToken) {
      setFormValues(prev => ({
        ...prev,
        entryPrice: selectedToken.indexPrice || '',
        fundingRate: selectedToken.fundingRate 
          ? (selectedToken.fundingRate * 100).toFixed(3)
          : '',
      }));
    }
  }, [selectedToken]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormValues(prev => ({ ...prev, [id]: value }));
  };

  const handleCalculate = (e) => {
    e.preventDefault();
    
    const entryPrice = parseFloat(formValues.entryPrice);
    const leverage = parseFloat(formValues.leverage);
    const positionSize = parseFloat(formValues.positionSize);
    const openFee = parseFloat(formValues.openFee) / 100;
    const closeFee = parseFloat(formValues.closeFee) / 100;
    const fundingRate = parseFloat(formValues.fundingRate) / 100;
    
    const initialMargin = positionSize / leverage;
    const recommendedMargin = initialMargin * 2;
    const liquidationPrice = entryPrice * (1 + 1 / leverage);
    const liquidationMove = ((liquidationPrice / entryPrice) - 1) * 100;
    const totalFees = (openFee + closeFee) * positionSize;
    const estimatedFundingProfit = fundingRate * positionSize;
    
    setCalculationData({
      initialMargin,
      recommendedMargin,
      liquidationPrice,
      liquidationMove,
      totalFees,
      estimatedFundingProfit,
      selectedSymbol: selectedToken?.symbol || null,
    });
  };

  return (
    <div className="card animate-fade">
      <div className="p-6 border-b border-[rgb(var(--border))]">
        <h2 className="text-xl font-semibold">Position Calculator</h2>
      </div>
      
      <div className="p-6 space-y-6">
        <CalculatorForm 
          formValues={formValues}
          onChange={handleInputChange}
          onSubmit={handleCalculate}
        />
        
        {calculationData && (
          <div className="pt-6 border-t border-[rgb(var(--border))]">
            <CalculationResults data={calculationData} />
          </div>
        )}
      </div>
    </div>
  );
}

CalculatorSection.propTypes = {
  selectedToken: PropTypes.shape({
    symbol: PropTypes.string,
    indexPrice: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    fundingRate: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
};

export default CalculatorSection;