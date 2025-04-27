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
      const newValues = {
        ...formValues,
        entryPrice: selectedToken.indexPrice || '',
        fundingRate: selectedToken.fundingRate 
          ? (selectedToken.fundingRate * 100).toFixed(4)
          : '',
      };
      setFormValues(newValues);
      
      // Автоматично розраховуємо, якщо всі необхідні поля заповнені
      if (
        selectedToken.indexPrice && 
        selectedToken.fundingRate && 
        formValues.leverage && 
        formValues.positionSize
      ) {
        // Симулюємо форму з оновленими значеннями
        handleCalculateWithValues(newValues);
      }
    }
  }, [selectedToken]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormValues(prev => ({ ...prev, [id]: value }));
  };
  
  // Допоміжна функція для розрахунку з конкретними значеннями
  const handleCalculateWithValues = (values) => {
    const entryPrice = parseFloat(values.entryPrice);
    const leverage = parseFloat(values.leverage);
    const positionSize = parseFloat(values.positionSize);
    const openFee = parseFloat(values.openFee) / 100;
    const closeFee = parseFloat(values.closeFee) / 100;
    const fundingRate = parseFloat(values.fundingRate) / 100;
    
    calculateResults(entryPrice, leverage, positionSize, openFee, closeFee, fundingRate);
  };

  const handleCalculate = (e) => {
    e.preventDefault();
    
    const entryPrice = parseFloat(formValues.entryPrice);
    const leverage = parseFloat(formValues.leverage);
    const positionSize = parseFloat(formValues.positionSize);
    const openFee = parseFloat(formValues.openFee) / 100;
    const closeFee = parseFloat(formValues.closeFee) / 100;
    const fundingRate = parseFloat(formValues.fundingRate) / 100;
    
    calculateResults(entryPrice, leverage, positionSize, openFee, closeFee, fundingRate);
  };
  
  // Виділена функція розрахунку результатів
  const calculateResults = (entryPrice, leverage, positionSize, openFee, closeFee, fundingRate) => {
    const initialMargin = positionSize / leverage;
    const recommendedMargin = initialMargin * 1.5; // Рекомендуємо 150% від мінімальної маржі
    const liquidationPrice = entryPrice * (1 - (1 / leverage)); // Коректна формула для Long позиції
    const liquidationMove = ((liquidationPrice / entryPrice) - 1) * 100;
    const totalFees = (openFee + closeFee) * positionSize;
    
    // Розрахунок прибутку від фандингу
    const estimatedFundingProfit = fundingRate * positionSize;
    const estimatedDailyFundingProfit = estimatedFundingProfit * 3; // 3 рази на день
    const estimatedMonthlyFundingProfit = estimatedDailyFundingProfit * 30; // 30 днів
    const estimatedYearlyFundingProfit = estimatedDailyFundingProfit * 365; // 365 днів
    
    // Розрахунок APR (Annual Percentage Rate)
    const fundingApr = fundingRate * 3 * 365 * 100; // 3 рази на день, 365 днів
    
    setCalculationData({
      initialMargin,
      recommendedMargin,
      liquidationPrice,
      liquidationMove,
      totalFees,
      estimatedFundingProfit,
      estimatedDailyFundingProfit,
      estimatedMonthlyFundingProfit,
      estimatedYearlyFundingProfit,
      fundingApr,
      selectedSymbol: selectedToken?.symbol || null,
    });
  };

  return (
    <div className="card animate-fade">
      <div className="p-6 border-b border-[rgb(var(--border))]">
        <h2 className="text-xl font-semibold">Калькулятор позиції</h2>
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