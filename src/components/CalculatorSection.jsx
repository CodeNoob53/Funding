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

  // src/components/CalculatorSection.jsx - потрібно оновити getBestExchange
  const getBestExchange = (token) => {
    if (!token) return { exchange: 'Binance', rate: 0 };

    // Використовуємо stablecoin_margin_list від нової структури даних
    const marginList = token.stablecoin_margin_list || [];

    if (!marginList.length) return { exchange: 'Binance', rate: 0 };

    // Знаходимо біржу з найбільшим за модулем фандингом
    const best = marginList.reduce((prev, curr) => {
      const prevRate = prev.funding_rate || 0;
      const currRate = curr.funding_rate || 0;

      return Math.abs(currRate) > Math.abs(prevRate) ? curr : prev;
    });

    return {
      exchange: best.exchange || 'Binance',
      rate: best.funding_rate || 0
    };
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
  
      const newPositionType = parseFloat(fundingRate) < 0 ? 'long' : 'short';
      setPositionType(newPositionType);
  
      setFormValues(prevValues => ({
        ...prevValues,
        entryPrice:
          selectedToken.indexPrice !== undefined && selectedToken.indexPrice !== null
            ? selectedToken.indexPrice
            : prevValues.entryPrice,
        fundingRate: Math.abs(parseFloat(fundingRate)),
      }));
    }
  }, [selectedToken]);  

  // Цей ефект відслідковує зміни у selectedExchange і оновлює ставку фандингу
  useEffect(() => {
    if (selectedToken && selectedExchange) {
      const marginList = selectedToken.stablecoin_margin_list || [];
  
      const match = marginList.find(entry => entry.exchange?.toLowerCase() === selectedExchange.toLowerCase());
  
      if (match && match.funding_rate !== undefined && match.funding_rate !== null) {
        const fundingRate = (parseFloat(match.funding_rate) * 100).toFixed(4);
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
    stablecoin_margin_list: PropTypes.arrayOf(PropTypes.shape({
      funding_rate: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      exchange: PropTypes.string,
    })),
  }),
};

export default CalculatorSection;