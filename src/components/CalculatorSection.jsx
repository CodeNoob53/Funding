import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import CalculatorForm from './CalculatorForm';
import CalculationResults from './CalculationResults';
import ExchangeIcon from './ExchangeIcon';

function CalculatorSection({ selectedToken }) {
  const [calculationData, setCalculationData] = useState(null);
  const [positionType, setPositionType] = useState('long');
  const [selectedExchange, setSelectedExchange] = useState('Binance');
  const [formValues, setFormValues] = useState({
    entryPrice: '',
    leverage: '',
    positionSize: '',
    openFee: '0.04',
    closeFee: '0.04',
    fundingRate: '',
  });

  const getBestExchange = (token) => {
    if (!token) return { exchange: 'Binance', rate: 0 };

    const rates = [
      { exchange: 'Binance', rate: token.binanceFunding },
      { exchange: 'OKX', rate: token.okexFunding },
      { exchange: 'Bybit', rate: token.bybitFunding },
      { exchange: 'Gate.io', rate: token.gateFunding },
      { exchange: 'MEXC', rate: token.mexcFunding },
    ].filter(item => item.rate !== undefined && item.rate !== null && item.rate !== '-');

    if (rates.length === 0) return { exchange: 'Binance', rate: 0 };

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
    const totalFees = (positionSize * (openFee + closeFee)) / 100;
    
    // Визначаємо ефективну ставку фандингу в залежності від типу позиції
    // Для long позицій негативний фандинг - це прибуток
    // Для short позицій позитивний фандинг - це прибуток
    const effectiveFundingRate = positionType === 'long' ? -fundingRate : fundingRate;
    
    const estimatedFundingProfit = (effectiveFundingRate / 100) * positionSize;
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
      
      setSelectedExchange(bestExchange.exchange);
      
      const fundingRate = bestExchange.rate 
        ? (parseFloat(bestExchange.rate) * 100).toFixed(4)
        : selectedToken.fundingRate 
        ? (selectedToken.fundingRate * 100).toFixed(4)
        : '';

      // Визначаємо оптимальний тип позиції для цього фандингу
      const newPositionType = parseFloat(fundingRate) < 0 ? 'long' : 'short';
      setPositionType(newPositionType);

      setFormValues(prevValues => ({
        ...prevValues,
        entryPrice: selectedToken.indexPrice || '',
        fundingRate: Math.abs(parseFloat(fundingRate)),
      }));
    }
  }, [selectedToken]);

  // Цей ефект відслідковує зміни у selectedExchange і оновлює ставку фандингу
  useEffect(() => {
    if (selectedToken && selectedExchange) {
      const rate = selectedExchange === 'Binance' ? selectedToken.binanceFunding :
                  selectedExchange === 'OKX' ? selectedToken.okexFunding :
                  selectedExchange === 'Bybit' ? selectedToken.bybitFunding :
                  selectedExchange === 'Gate.io' ? selectedToken.gateFunding :
                  selectedExchange === 'MEXC' ? selectedToken.mexcFunding : 0;

      if (rate !== undefined && rate !== null && rate !== '-') {
        const fundingRate = (parseFloat(rate) * 100).toFixed(4);
        const newPositionType = parseFloat(fundingRate) < 0 ? 'long' : 'short';
        setPositionType(newPositionType);
        
        setFormValues(prev => ({
          ...prev,
          fundingRate: Math.abs(parseFloat(fundingRate)),
        }));
      }
    }
  }, [selectedExchange, selectedToken]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormValues(prev => ({ ...prev, [id]: value }));
  };

  const handleCalculate = (e) => {
    e.preventDefault();
    
    const entryPrice = parseFloat(formValues.entryPrice);
    const leverage = parseFloat(formValues.leverage);
    const positionSize = parseFloat(formValues.positionSize);
    const openFee = parseFloat(formValues.openFee);
    const closeFee = parseFloat(formValues.closeFee);
    const fundingRate = parseFloat(formValues.fundingRate);
    
    calculateResults(entryPrice, leverage, positionSize, openFee, closeFee, fundingRate, positionType, selectedExchange);
  };

  return (
    <section className="card">
      <div className="p-6 border-b border-[rgb(var(--border))]">
        <h2 className="text-xl font-semibold">Калькулятор позиції</h2>
      </div>
      
      {selectedExchange && (
        <div className="px-6 pt-4 pb-0">
          <div className="flex items-center justify-between bg-[rgb(var(--foreground))/5 p-3 rounded-lg">
            <span className="text-sm font-medium">Вибрана біржа:</span>
            <div className="flex items-center gap-2">
              <ExchangeIcon exchange={selectedExchange} size={18} />
              <span className="font-semibold">{selectedExchange}</span>
            </div>
          </div>
        </div>
      )}
      
      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CalculatorForm 
          formValues={formValues}
          positionType={positionType}
          setPositionType={setPositionType}
          onChange={handleInputChange}
          onSubmit={handleCalculate}
        />
        
        <CalculationResults data={calculationData} />
      </div>
    </section>
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
};

export default CalculatorSection;