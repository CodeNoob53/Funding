import PropTypes from 'prop-types';

function CalculatorForm({ formValues, onChange, onSubmit }) {
  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div>
        <label className="block mb-1 font-medium" htmlFor="entryPrice">
          Entry Price ($):
        </label>
        <input
          type="number"
          id="entryPrice"
          step="0.01"
          required
          className="input-field"
          value={formValues.entryPrice}
          onChange={onChange}
        />
      </div>
      
      <div>
        <label className="block mb-1 font-medium" htmlFor="leverage">
          Leverage:
        </label>
        <input
          type="number"
          id="leverage"
          step="0.1"
          required
          className="input-field"
          value={formValues.leverage}
          onChange={onChange}
        />
      </div>
      
      <div>
        <label className="block mb-1 font-medium" htmlFor="positionSize">
          Position Size ($):
        </label>
        <input
          type="number"
          id="positionSize"
          step="0.01"
          required
          className="input-field"
          value={formValues.positionSize}
          onChange={onChange}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block mb-1 font-medium" htmlFor="openFee">
            Open Fee (%):
          </label>
          <input
            type="number"
            id="openFee"
            step="0.001"
            className="input-field"
            value={formValues.openFee}
            onChange={onChange}
          />
        </div>
        
        <div>
          <label className="block mb-1 font-medium" htmlFor="closeFee">
            Close Fee (%):
          </label>
          <input
            type="number"
            id="closeFee"
            step="0.001"
            className="input-field"
            value={formValues.closeFee}
            onChange={onChange}
          />
        </div>
      </div>
      
      <div>
        <label className="block mb-1 font-medium" htmlFor="fundingRate">
          Funding Rate (% per 8h):
        </label>
        <input
          type="number"
          id="fundingRate"
          step="0.001"
          required
          className="input-field"
          value={formValues.fundingRate}
          onChange={onChange}
        />
      </div>
      
      <button type="submit" className="btn-primary w-full mt-6">
        Calculate
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
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default CalculatorForm;