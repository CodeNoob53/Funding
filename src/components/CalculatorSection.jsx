import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import CalculatorForm from './CalculatorForm';
import CalculationResults from './CalculationResults';

function CalculatorSection({ selectedToken}) {
  const [calculationData, setCalculationData] = useState(null);
  const [positionType, setPositionType] = useState('long');
  const [selectedExchange, setSelectedExchange] = useState(null);
  const [formValues, setFormValues] = useState({
    entryPrice: '',
    leverage: '',
    positionSize: '',
    openFee: '0.04',
    closeFee: '0.04',
    fundingRate: '',
  });

  const getBestExchange = (token) => {
    if (!token) return { exchange: null, rate: 0 };

    const rates = [
      { exchange: 'Binance', rate: token.binanceFunding },
      { exchange: 'OKX', rate: token.okexFunding },
      { exchange: 'Bybit', rate: token.bybitFunding },
      { exchange: 'Gate.io', rate: token.gateFunding },
      { exchange: 'MEXC', rate: token.mexcFunding },
    ].filter(item => item.rate !== undefined && item.rate !== null && item.rate !== '-');

    if (rates.length === 0) return { exchange: null, rate: 0 };

    const best = rates.reduce((prev, curr) => 
      Math.abs(parseFloat(curr.rate)) > Math.abs(parseFloat(prev.rate)) ? curr : prev
    );

    return best;
  };

  const calculateResults = (entryPrice, leverage, positionSize, openFee, closeFee, fundingRate, positionType, exchange) => {
    const initialMargin = positionSize / leverage;
    const recommendedMargin = initialMargin * 1.5;
    
    const liquidationPrice = positionType === 'long'
      ? entryPrice * (1 - (1 / leverage))
      : entryPrice * (1 + (1 / leverage));
    
    const liquidationMove = Math.abs((liquidationPrice / entryPrice - 1) * 100);
    const totalFees = (openFee + closeFee) * positionSize;
    
    const effectiveFundingRate = positionType === 'long' && fundingRate < 0
      ? Math.abs(fundingRate)
      : positionType === 'short' && fundingRate > 0
      ? Math.abs(fundingRate)
      : fundingRate;

    const estimatedFundingProfit = effectiveFundingRate * positionSize;
    const estimatedDailyFundingProfit = estimatedFundingProfit * 3;

    setCalculationData({
      initialMargin,
      recommendedMargin,
      liquidationPrice,
      liquidationMove,
      totalFees,
      estimatedFundingProfit,
      estimatedDailyFundingProfit,
      selectedSymbol: selectedToken?.symbol || null,
      selectedExchange: exchange,
      positionType,
    });
  };

  useEffect(() => {
    if (selectedToken) {
      const bestExchange = getBestExchange(selectedToken);
      const fundingRate = bestExchange.rate 
        ? (parseFloat(bestExchange.rate) * 100).toFixed(4)
        : selectedToken.fundingRate 
        ? (selectedToken.fundingRate * 100).toFixed(4)
        : '';

      const newPositionType = parseFloat(fundingRate) < 0 ? 'long' : 'short';

      setPositionType(newPositionType);
      setSelectedExchange(bestExchange.exchange);

      setFormValues(prevValues => {
        console.log('Updating formValues from selectedToken:', { prevValues, fundingRate, entryPrice: selectedToken.indexPrice || '' });
        return {
          ...prevValues,
          entryPrice: selectedToken.indexPrice || '',
          fundingRate,
        };
      });
    }
  }, [selectedToken]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormValues(prev => ({ ...prev, [id]: value }));
  };

  const handleExchangeChange = (e) => {
    const exchange = e.target.value;
    setSelectedExchange(exchange);

    const rate = exchange === 'Binance' ? selectedToken.binanceFunding :
                exchange === 'OKX' ? selectedToken.okexFunding :
                exchange === 'Bybit' ? selectedToken.bybitFunding :
                exchange === 'Gate.io' ? selectedToken.gateFunding :
                exchange === 'MEXC' ? selectedToken.mexcFunding : 0;

    const fundingRate = rate ? (parseFloat(rate) * 100).toFixed(4) : '';
    const newPositionType = parseFloat(fundingRate) < 0 ? 'long' : 'short';
    setPositionType(newPositionType);

    setFormValues(prev => ({
      ...prev,
      fundingRate,
    }));
  };

  // Removed unused function handleRateClick

  const handleCalculate = (e) => {
    e.preventDefault();
    
    const entryPrice = parseFloat(formValues.entryPrice);
    const leverage = parseFloat(formValues.leverage);
    const positionSize = parseFloat(formValues.positionSize);
    const openFee = parseFloat(formValues.openFee) / 100;
    const closeFee = parseFloat(formValues.closeFee) / 100;
    const fundingRate = parseFloat(formValues.fundingRate) / 100;
    
    calculateResults(entryPrice, leverage, positionSize, openFee, closeFee, fundingRate, positionType, selectedExchange);
  };

  return (
    <div className="card animate-fade">
      <div className="p-6 border-b border-[rgb(var(--border))]">
        <h2 className="text-xl font-semibold">Простий калькулятор</h2>
      </div>
      
      <div className="p-6 space-y-6">
        <CalculatorForm 
          formValues={formValues}
          positionType={positionType}
          setPositionType={setPositionType}
          selectedExchange={selectedExchange}
          onExchangeChange={handleExchangeChange}
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
    binanceFunding: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    okexFunding: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    bybitFunding: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    gateFunding: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    mexcFunding: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
  onSelectRate: PropTypes.func.isRequired,
};

export default CalculatorSection;