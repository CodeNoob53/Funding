// src/components/calc/CalculatorForm.jsx
import PropTypes from 'prop-types';
import { FiBriefcase, FiDollarSign, FiPercent, FiTrendingUp, FiCreditCard } from 'react-icons/fi';
import { TbTriangleFilled, TbTriangleInvertedFilled } from 'react-icons/tb';
import './CalculatorForm.css';

function CalculatorForm({ formValues, positionType, setPositionType, onChange, onSubmit }) {
  const handleSpinnerClick = (id, direction) => {
    const input = document.getElementById(id);
    if (input) {
      const step = parseFloat(input.step) || 0.01;
      const currentValue = parseFloat(input.value) || 0;
      const newValue = direction === 'up' ? currentValue + step : currentValue - step;
      input.value = newValue.toFixed(step.toString().split('.')[1]?.length || 2);
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  };

  return (
    <form className="calculator-form" onSubmit={onSubmit}>
      {/* Перемикач Long/Short */}
      <div className="position-toggle-container">
        <div className="position-toggle">
          <button
            type="button"
            onClick={() => setPositionType('long')}
            className={`toggle-button toggle-button-long ${positionType === 'long' ? 'toggle-button-active' : 'toggle-button-inactive'}`}
          >
            Long
          </button>
          <button
            type="button"
            onClick={() => setPositionType('short')}
            className={`toggle-button toggle-button-short ${positionType === 'short' ? 'toggle-button-active' : 'toggle-button-inactive'}`}
          >
            Short
          </button>
          <div className="toggle-slider" />
        </div>
      </div>

      {/* Група: Ціна відкриття + Плече */}
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label" htmlFor="entryPrice">
            Ціна відкриття ($):
          </label>
          <div className="input-wrapper">
            <input
              type="number"
              id="entryPrice"
              step="0.01"
              required
              className={`form-input ${formValues.entryPrice ? 'form-input--auto' : ''}`}
              value={formValues.entryPrice}
              onChange={onChange}
            />
            <div className="input-icon">
              <FiDollarSign size={18} />
            </div>
            <div className="spinner-wrapper">
              <button
                type="button"
                className="spinner-button"
                onClick={() => handleSpinnerClick('entryPrice', 'up')}
              >
                <TbTriangleFilled size={12} />
              </button>
              <button
                type="button"
                className="spinner-button"
                onClick={() => handleSpinnerClick('entryPrice', 'down')}
              >
                <TbTriangleInvertedFilled size={12} />
              </button>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="leverage">
            Плече:
          </label>
          <div className="input-wrapper">
            <input
              type="number"
              id="leverage"
              step="1"
              required
              className="form-input"
              value={formValues.leverage}
              onChange={onChange}
            />
            <div className="input-icon">
              <FiTrendingUp size={18} />
            </div>
            <div className="spinner-wrapper">
              <button
                type="button"
                className="spinner-button"
                onClick={() => handleSpinnerClick('leverage', 'up')}
              >
                <TbTriangleFilled size={12} />
              </button>
              <button
                type="button"
                className="spinner-button"
                onClick={() => handleSpinnerClick('leverage', 'down')}
              >
                <TbTriangleInvertedFilled size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Група: Розмір позиції */}
      <div className="form-group">
        <label className="form-label" htmlFor="positionSize">
          Розмір позиції ($):
        </label>
        <div className="input-wrapper">
          <input
            type="number"
            id="positionSize"
            step="0.01"
            required
            className="form-input"
            value={formValues.positionSize}
            onChange={onChange}
          />
          <div className="input-icon">
            <FiBriefcase size={18} />
          </div>
          <div className="spinner-wrapper">
            <button
              type="button"
              className="spinner-button"
              onClick={() => handleSpinnerClick('positionSize', 'up')}
            >
              <TbTriangleFilled size={12} />
            </button>
            <button
              type="button"
              className="spinner-button"
              onClick={() => handleSpinnerClick('positionSize', 'down')}
            >
              <TbTriangleInvertedFilled size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Група: Комісії */}
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label" htmlFor="openFee">
            Комісія відкриття (%):
          </label>
          <div className="input-wrapper">
            <input
              type="number"
              id="openFee"
              step="0.001"
              className="form-input"
              value={formValues.openFee}
              onChange={onChange}
            />
            <div className="input-icon">
              <FiCreditCard size={18} />
            </div>
            <div className="spinner-wrapper">
              <button
                type="button"
                className="spinner-button"
                onClick={() => handleSpinnerClick('openFee', 'up')}
              >
                <TbTriangleFilled size={12} />
              </button>
              <button
                type="button"
                className="spinner-button"
                onClick={() => handleSpinnerClick('openFee', 'down')}
              >
                <TbTriangleInvertedFilled size={12} />
              </button>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="closeFee">
            Комісія закриття (%):
          </label>
          <div className="input-wrapper">
            <input
              type="number"
              id="closeFee"
              step="0.001"
              className="form-input"
              value={formValues.closeFee}
              onChange={onChange}
            />
            <div className="input-icon">
              <FiCreditCard size={18} />
            </div>
            <div className="spinner-wrapper">
              <button
                type="button"
                className="spinner-button"
                onClick={() => handleSpinnerClick('closeFee', 'up')}
              >
                <TbTriangleFilled size={12} />
              </button>
              <button
                type="button"
                className="spinner-button"
                onClick={() => handleSpinnerClick('closeFee', 'down')}
              >
                <TbTriangleInvertedFilled size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Група: Ставка фандингу */}
      <div className="form-group">
        <label className="form-label" htmlFor="fundingRate">
          Ставка фандингу (% за 8 годин):
        </label>
        <div className="input-wrapper">
          <input
            type="number"
            id="fundingRate"
            step="0.001"
            required
            className={`form-input ${formValues.fundingRate ? 'form-input--auto' : ''}`}
            value={formValues.fundingRate}
            onChange={onChange}
          />
          <div className="input-icon">
            <FiPercent size={18} />
          </div>
          <div className="spinner-wrapper">
            <button
              type="button"
              className="spinner-button"
              onClick={() => handleSpinnerClick('fundingRate', 'up')}
            >
              <TbTriangleFilled size={12} />
            </button>
            <button
              type="button"
              className="spinner-button"
              onClick={() => handleSpinnerClick('fundingRate', 'down')}
            >
              <TbTriangleInvertedFilled size={12} />
            </button>
          </div>
        </div>
      </div>

      <button type="submit" className="submit-button">
        Розрахувати
      </button>
    </form>
  );
}

CalculatorForm.propTypes = {
  formValues: PropTypes.shape({
    entryPrice: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    leverage: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    positionSize: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    openFee: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    closeFee: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    fundingRate: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  }).isRequired,
  positionType: PropTypes.oneOf(['long', 'short']).isRequired,
  setPositionType: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default CalculatorForm;