import PropTypes from 'prop-types';
import TokenItem from './TokenItem';

function FundingSection({ fundingData, isLoading, error, onSelectToken }) {
  const sortedTokens = [...fundingData]
    .filter(token => token.fundingRate)
    .sort((a, b) => Math.abs(b.fundingRate) - Math.abs(a.fundingRate));

  return (
    <section className="card overflow-hidden animate-fade">
      <div className="p-6 border-b border-[rgb(var(--border))]">
        <h2 className="text-xl font-semibold flex items-center gap-3">
          <span>Funding Rates</span>
          {isLoading && (
            <div className="w-4 h-4 border-2 border-[rgb(var(--primary))] border-t-transparent rounded-full animate-spin" />
          )}
        </h2>
      </div>
      
      {error ? (
        <div className="p-6">
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500">
            <p>{error}</p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgb(var(--border))]">
                <th className="table-cell table-header text-left">Symbol</th>
                <th className="table-cell table-header text-right">Binance</th>
                <th className="table-cell table-header text-right">OKX</th>
                <th className="table-cell table-header text-right">Bybit</th>
                <th className="table-cell table-header text-right">Gate.io</th>
                <th className="table-cell table-header text-right">MEXC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgb(var(--border))]">
              {sortedTokens.map((token) => (
                <TokenItem 
                  key={token.symbol} 
                  token={token}
                  onClick={() => onSelectToken(token)}
                />
              ))}
              {!isLoading && sortedTokens.length === 0 && (
                <tr>
                  <td colSpan="6" className="table-cell text-center opacity-70">
                    No data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

FundingSection.propTypes = {
  fundingData: PropTypes.arrayOf(
    PropTypes.shape({
      symbol: PropTypes.string.isRequired,
      fundingRate: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      // Add other token fields as needed
    })
  ).isRequired,
  isLoading: PropTypes.bool.isRequired,
  error: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  onSelectToken: PropTypes.func.isRequired,
};

export default FundingSection;