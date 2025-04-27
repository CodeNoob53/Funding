import { useState } from 'react';
import PropTypes from 'prop-types';
import TokenItem from './TokenItem';
import { FiSliders, FiSearch } from 'react-icons/fi';

function FundingSection({ fundingData, isLoading, error, onSelectToken, onSelectRate }) {
  const [filterThreshold, setFilterThreshold] = useState(0.15);
  const [showFilter, setShowFilter] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTokens = fundingData
    .filter(token => {
      if (!token.fundingRate) return false;
      if (searchQuery && !token.symbol.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      const absRate = Math.abs(token.fundingRate * 100);
      return absRate >= filterThreshold;
    })
    .sort((a, b) => Math.abs(b.fundingRate) - Math.abs(a.fundingRate));

  const handleThresholdChange = (e) => {
    setFilterThreshold(parseFloat(e.target.value));
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleRateClick = (token, exchange, rate) => {
    console.log(`FundingSection: Selecting rate for ${token.symbol} on ${exchange}: ${rate}`);
    onSelectRate(token, exchange, rate);
  };

  return (
    <section className="card overflow-hidden animate-fade">
      {/* Заголовок і панель управління */}
      <div className="p-4 sm:p-6 border-b border-[rgb(var(--border))]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <span>Фандинг ставки</span>
            {isLoading && (
              <div className="w-4 h-4 border-2 border-[rgb(var(--primary))] border-t-transparent rounded-full animate-spin" />
            )}
          </h2>
          
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-48">
              <input
                type="text"
                placeholder="Пошук..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full py-1.5 px-3 pr-8 text-sm rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--card))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))/50]"
              />
              <FiSearch className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-[rgb(var(--foreground))/50]" />
            </div>
            
            <button 
              onClick={() => setShowFilter(!showFilter)}
              className="p-2 rounded-md border border-[rgb(var(--border))] hover:bg-[rgb(var(--foreground))/5] transition-colors"
              aria-label="Налаштування фільтрів"
            >
              <FiSliders size={18} />
            </button>
          </div>
        </div>
        
        {/* Фільтр із анімацією */}
        {showFilter && (
          <div className="mt-3 p-3 border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--card))] animate-slide">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1">
                <label className="block mb-1 text-sm font-medium">
                  Мінімальний фандинг: {filterThreshold}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={filterThreshold}
                  onChange={handleThresholdChange}
                  className="w-full accent-[rgb(var(--primary))]"
                />
              </div>
              <div className="w-20">
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  value={filterThreshold}
                  onChange={handleThresholdChange}
                  className="w-full px-2 py-1 text-sm rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--card))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))/50]"
                />
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Таблиця */}
      {error ? (
        <div className="p-6">
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500">
            <p>{error}</p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="border-b border-[rgb(var(--border))] bg-[rgb(var(--card))]">
                <th className="table-cell table-header text-left py-3 px-4 sm:px-6 font-semibold">Символ</th>
                <th className="table-cell table-header text-right py-3 px-4 sm:px-6 font-semibold">Binance</th>
                <th className="table-cell table-header text-right py-3 px-4 sm:px-6 font-semibold">OKX</th>
                <th className="table-cell table-header text-right py-3 px-4 sm:px-6 font-semibold">Bybit</th>
                <th className="table-cell table-header text-right py-3 px-4 sm:px-6 font-semibold">Gate.io</th>
                <th className="table-cell table-header text-right py-3 px-4 sm:px-6 font-semibold">MEXC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgb(var(--border))]">
              {filteredTokens.map((token) => (
                <TokenItem 
                  key={token.symbol} 
                  token={token}
                  onClick={() => onSelectToken(token)}
                  onRateClick={handleRateClick}
                />
              ))}
              {!isLoading && filteredTokens.length === 0 && (
                <tr>
                  <td colSpan="6" className="table-cell text-center py-8 opacity-70">
                    {searchQuery ? 
                      `Немає результатів для "${searchQuery}"` :
                      `Немає даних з фандингом ≥ ${filterThreshold}%`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Нижній рядок */}
      <div className="p-3 border-t border-[rgb(var(--border))] bg-[rgb(var(--card))] text-xs text-center text-[rgb(var(--foreground))/60">
        Показано {filteredTokens.length} з {fundingData.length} монет • Фільтр: фандинг ≥ {filterThreshold}%
      </div>
    </section>
  );
}

FundingSection.propTypes = {
  fundingData: PropTypes.arrayOf(
    PropTypes.shape({
      symbol: PropTypes.string.isRequired,
      fundingRate: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      binanceFunding: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      okexFunding: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      bybitFunding: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      gateFunding: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      mexcFunding: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    })
  ).isRequired,
  isLoading: PropTypes.bool.isRequired,
  error: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  onSelectToken: PropTypes.func.isRequired,
  onSelectRate: PropTypes.func.isRequired,
};

export default FundingSection;