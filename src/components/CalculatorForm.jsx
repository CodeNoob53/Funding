import PropTypes from 'prop-types';
import { FiBriefcase, FiDollarSign, FiPercent, FiTrendingUp, FiCreditCard } from 'react-icons/fi';

function CalculatorForm({ formValues, positionType, setPositionType, onChange, onSubmit }) {
  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      {/* Перемикач Long/Short */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-lg bg-[rgb(var(--card))/50] p-1 border border-[rgb(var(--border))]">
          <button
            type="button"
            onClick={() => setPositionType('long')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 ${
              positionType === 'long'
                ? 'bg-[rgb(var(--primary))] text-white'
                : 'text-[rgb(var(--foreground))/60] hover:bg-[rgb(var(--foreground))/10]'
            }`}
          >
            Long
          </button>
          <button
            type="button"
            onClick={() => setPositionType('short')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 ${
              positionType === 'short'
                ? 'bg-[rgb(var(--primary))] text-white'
                : 'text-[rgb(var(--foreground))/60] hover:bg-[rgb(var(--foreground))/10]'
            }`}
          >
            Short
          </button>
        </div>
      </div>

      {/* Група: Ціна входу та розмір позиції */}
      <div className="space-y-4 p-4 rounded-lg bg-[rgb(var(--card))/50] border border-[rgb(var(--border))]">
        <h3 className="text-sm font-semibold text-[rgb(var(--foreground))/80]">Параметри позиції</h3>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <label className="block mb-1 text-sm font-medium" htmlFor="entryPrice">
              Ціна входу ($):
            </label>
            <div className="relative">
              <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[rgb(var(--foreground))/60]">
                <FiDollarSign size={16} />
              </div>
              <input
                type="number"
                id="entryPrice"
                step="0.01"
                required
                className="w-full pl-8 pr-3 py-2 text-sm rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--background))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))/50] transition-all"
                value={formValues.entryPrice}
                onChange={onChange}
              />
            </div>
          </div>
          
          <div className="relative">
            <label className="block mb-1 text-sm font-medium" htmlFor="positionSize">
              Розмір позиції ($):
            </label>
            <div className="relative">
              <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[rgb(var(--foreground))/60]">
                <FiBriefcase size={16} />
              </div>
              <input
                type="number"
                id="positionSize"
                step="0.01"
                required
                className="w-full pl-8 pr-3 py-2 text-sm rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--background))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))/50] transition-all"
                value={formValues.positionSize}
                onChange={onChange}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Група: Кредитне плече та ставка фандингу */}
      <div className="space-y-4 p-4 rounded-lg bg-[rgb(var(--card))/50] border border-[rgb(var(--border))]">
        <h3 className="text-sm font-semibold text-[rgb(var(--foreground))/80]">Ризики та фандинг</h3>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <label className="block mb-1 text-sm font-medium" htmlFor="leverage">
              Кредитне плече:
            </label>
            <div className="relative">
              <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[rgb(var(--foreground))/60]">
                <FiTrendingUp size={16} />
              </div>
              <input
                type="number"
                id="leverage"
                step="0.1"
                required
                className="w-full pl-8 pr-3 py-2 text-sm rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--background))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))/50] transition-all"
                value={formValues.leverage}
                onChange={onChange}
              />
            </div>
          </div>
          
          <div className="relative">
            <label className="block mb-1 text-sm font-medium" htmlFor="fundingRate">
              Ставка фандингу (% / 8г):
            </label>
            <div className="relative">
              <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[rgb(var(--foreground))/60]">
                <FiPercent size={16} />
              </div>
              <input
                type="number"
                id="fundingRate"
                step="0.001"
                required
                className="w-full pl-8 pr-3 py-2 text-sm rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--background))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))/50] transition-all"
                value={formValues.fundingRate}
                onChange={onChange}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Група: Комісії */}
      <div className="space-y-4 p-4 rounded-lg bg-[rgb(var(--card))/50] border border-[rgb(var(--border))]">
        <h3 className="text-sm font-semibold text-[rgb(var(--foreground))/80]">Комісії</h3>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <label className="block mb-1 text-sm font-medium" htmlFor="openFee">
              Відкриття (%):
            </label>
            <div className="relative">
              <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[rgb(var(--foreground))/60]">
                <FiCreditCard size={16} />
              </div>
              <input
                type="number"
                id="openFee"
                step="0.001"
                className="w-full pl-8 pr-3 py-2 text-sm rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--background))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))/50] transition-all"
                value={formValues.openFee}
                onChange={onChange}
              />
            </div>
          </div>
          
          <div className="relative">
            <label className="block mb-1 text-sm font-medium" htmlFor="closeFee">
              Закриття (%):
            </label>
            <div className="relative">
              <div className="absolute left-2 top-1/2 -translate-y-1/2 text-[rgb(var(--foreground))/60]">
                <FiCreditCard size={16} />
              </div>
              <input
                type="number"
                id="closeFee"
                step="0.001"
                className="w-full pl-8 pr-3 py-2 text-sm rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--background))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))/50] transition-all"
                value={formValues.closeFee}
                onChange={onChange}
              />
            </div>
          </div>
        </div>
      </div>

      <button type="submit" className="btn-primary w-full mt-6">
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