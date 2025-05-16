// src/components/calc/CalculatorSection.jsx
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import CalculatorForm from './CalculatorForm';
import CalculationResults from './CalculationResults';
import './CalculatorSection.css';

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
    const marginList = token.stablecoin_margin_list || [];
    if (!marginList.length) return { exchange: 'Binance', rate: 0 };
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

  const calculateResults = (
    entryPrice,
    leverage,
    positionSize,
    openFee,
    closeFee,
    fundingRate,
    positionType,
    exchange
  ) => {
    const initialMargin = positionSize / leverage;
    const recommendedMargin = initialMargin * 1.5;

    const liquidationPrice =
      positionType === 'long'
        ? entryPrice * (1 - 1 / leverage)
        : entryPrice * (1 + 1 / leverage);

    const liquidationMove = Math.abs((liquidationPrice / entryPrice - 1) * 100);

    const totalFees = positionSize * (openFee + closeFee);

    const isProfitable =
      (positionType === 'long' && fundingRate < 0) ||
      (positionType === 'short' && fundingRate > 0);

    const estimatedFundingProfit =
      (Math.abs(fundingRate) / 100) * positionSize * (isProfitable ? 1 : -1);

    const estimatedDailyFundingProfit = estimatedFundingProfit * 3;
    const estimatedMonthlyFundingProfit = estimatedDailyFundingProfit * 30;
    const fundingAPR = (estimatedDailyFundingProfit * 365 / positionSize) * 100;

    const netProfit = estimatedFundingProfit - totalFees;

    setCalculationData({
      initialMargin,
      recommendedMargin,
      liquidationPrice,
      liquidationMove,
      totalFees,
      estimatedFundingProfit,
      estimatedDailyFundingProfit,
      estimatedMonthlyFundingProfit,
      fundingAPR,
      netProfit,
      selectedSymbol: selectedToken?.symbol || null,
      selectedExchange: exchange,
      positionType,
    });
  };

  // У CalculatorSection.jsx
  useEffect(() => {
    if (selectedToken) {
      const bestExchange = getBestExchange(selectedToken);
      setSelectedExchange(bestExchange.exchange);

      const fundingRate = bestExchange.rate || selectedToken.fundingRate || 0;

      const newPositionType = parseFloat(fundingRate) < 0 ? 'long' : 'short';
      setPositionType(newPositionType);

      setFormValues(prevValues => ({
        ...prevValues,
        entryPrice:
          selectedToken.indexPrice !== undefined && selectedToken.indexPrice !== null
            ? selectedToken.indexPrice
            : prevValues.entryPrice,
        fundingRate: parseFloat(fundingRate), // Зберігаємо значення без множення на 100
      }));
    }
  }, [selectedToken]);

  useEffect(() => {
    if (selectedToken && selectedExchange) {
      const marginList = selectedToken.stablecoin_margin_list || [];

      const match = marginList.find(entry => entry.exchange?.toLowerCase() === selectedExchange.toLowerCase());

      if (match && match.funding_rate !== undefined && match.funding_rate !== null) {
        const fundingRate = parseFloat(match.funding_rate); // Зберігаємо значення без множення на 100
        const newPositionType = fundingRate < 0 ? 'long' : 'short';
        setPositionType(newPositionType);

        setFormValues(prev => ({
          ...prev,
          fundingRate: fundingRate,
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
    const openFee = parseFloat(formValues.openFee) / 100;
    const closeFee = parseFloat(formValues.closeFee) / 100;
    const fundingRate = parseFloat(formValues.fundingRate);
    calculateResults(entryPrice, leverage, positionSize, openFee, closeFee, fundingRate, positionType, selectedExchange);
  };

  return (
    <section className="calculator-section">
      <div className="section-header">
        <h2 className="section-title">Калькулятор позиції</h2>
      </div>

      {selectedExchange && (
        <div className="exchange-info">
          <div className="exchange-details">
            <span className="exchange-label">Вибрана біржа:</span>
            <div className="exchange-content">
              {/* Замість ExchangeIcon використовуйте <img> */}
              {(() => {
                // Знаходимо логотип біржі
                let logoUrl = null;
                if (selectedToken && selectedToken.stablecoin_margin_list) {
                  const found = selectedToken.stablecoin_margin_list.find(
                    entry => entry.exchange?.toLowerCase() === selectedExchange.toLowerCase()
                  );
                  logoUrl = found?.exchange_logo || null;
                }
                return logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={selectedExchange}
                    style={{ width: 18, height: 18, marginRight: 6, verticalAlign: 'middle', borderRadius: 4 }}
                  />
                ) : null;
              })()}
              <span className="exchange-name">{selectedExchange}</span>
            </div>
          </div>
        </div>
      )}

      <div className="section-content">
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