import PropTypes from 'prop-types';
import { FiBriefcase, FiDollarSign, FiPercent, FiTrendingUp, FiCreditCard } from 'react-icons/fi';
import './CalculatorForm.css';

function CalculatorForm({ formValues, positionType, setPositionType, onChange, onSubmit }) {
  return (
    <form className="calculator-form" onSubmit={onSubmit}>
      {/* Перемикач Long/Short */}
      <div className="position-toggle-container">
        <div className="position-toggle">
          <button
            type="button"
            onClick={() => setPositionType('long')}
            className={`toggle-button ${positionType === 'long' ? 'toggle-button-active' : 'toggle-button-inactive'}`}
          >
            Long
          </button>
          <button
            type="button"
            onClick={() => setPositionType('short')}
            className={`toggle-button ${positionType === 'short' ? 'toggle-button-active' : 'toggle-button-inactive'}`}
          >
            Short
          </button>
        </div>
      </div>

      {/* Група: Ціна відкриття + Плече */}
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label" htmlFor="entryPrice">
            Ціна відкриття ($):
          </label>
          <div className="input-wrapper">
            <div className="input-icon">
              <FiDollarSign size={16} />
            </div>
            <input
              type="number"
              id="entryPrice"
              step="0.01"
              required
              className="form-input"
              value={formValues.entryPrice}
              onChange={onChange}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="leverage">
            Плече:
          </label>
          <div className="input-wrapper">
            <div className="input-icon">
              <FiTrendingUp size={16} />
            </div>
            <input
              type="number"
              id="leverage"
              step="0.1"
              required
              className="form-input"
              value={formValues.leverage}
              onChange={onChange}
            />
          </div>
        </div>
      </div>

      {/* Група: Розмір позиції */}
      <div className="form-group">
        <label className="form-label" htmlFor="positionSize">
          Розмір позиції ($):
        </label>
        <div className="input-wrapper">
          <div className="input-icon">
            <FiBriefcase size={16} />
          </div>
          <input
            type="number"
            id="positionSize"
            step="0.01"
            required
            className="form-input"
            value={formValues.positionSize}
            onChange={onChange}
          />
        </div>
      </div>

      {/* Група: Комісії */}
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label" htmlFor="openFee">
            Комісія відкриття (%):
          </label>
          <div className="input-wrapper">
            <div className="input-icon">
              <FiCreditCard size={16} />
            </div>
            <input
              type="number"
              id="openFee"
              step="0.001"
              className="form-input"
              value={formValues.openFee}
              onChange={onChange}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="closeFee">
            Комісія закриття (%):
          </label>
          <div className="input-wrapper">
            <div className="input-icon">
              <FiCreditCard size={16} />
            </div>
            <input
              type="number"
              id="closeFee"
              step="0.001"
              className="form-input"
              value={formValues.closeFee}
              onChange={onChange}
            />
          </div>
        </div>
      </div>

      {/* Група: Ставка фандингу */}
      <div className="form-group">
        <label className="form-label" htmlFor="fundingRate">
          Ставка фандингу (% за 8 годин):
        </label>
        <div className="input-wrapper">
          <div className="input-icon">
            <FiPercent size={16} />
          </div>
          <input
            type="number"
            id="fundingRate"
            step="0.001"
            required
            className="form-input"
            value={formValues.fundingRate}
            onChange={onChange}
          />
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