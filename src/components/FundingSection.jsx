import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TokenItem from './TokenItem';
import ExchangeIcon from './ExchangeIcon';

function FundingSection({ fundingData, isLoading, error, onSelectToken, onSelectRate }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('stablecoin'); // Вкладки: stablecoin або token
  const [availableExchanges, setAvailableExchanges] = useState([]);

  // Обробка доступних бірж на основі даних
  useEffect(() => {
    if (fundingData?.length > 0) {
      const exchanges = new Set();
      fundingData.forEach((item) => {
        const list = activeTab === 'stablecoin' ? item.stablecoin_margin_list : item.token_margin_list;
        if (Array.isArray(list) && list.length > 0) {
          list.forEach((entry) => {
            if (entry.exchange) {
              exchanges.add(entry.exchange);
            }
          });
        }
      });

      const formatted = Array.from(exchanges).map((exchange) => ({
        key: exchange.toLowerCase(),
        displayName: exchange,
      }));
      setAvailableExchanges(formatted);
      console.log('availableExchanges:', formatted);
    } else {
      setAvailableExchanges([]);
    }
  }, [fundingData, activeTab]);

  // Фільтрація токенів за пошуковим запитом і наявністю відповідного списку
  const filteredTokens = fundingData.filter((token) => {
    const matchesSearch = token.symbol?.toLowerCase().includes(searchQuery.toLowerCase()) || !searchQuery;
    const hasMarginList = Array.isArray(
      activeTab === 'stablecoin' ? token.stablecoin_margin_list : token.token_margin_list
    );
    console.log(`Token ${token.symbol}: matchesSearch=${matchesSearch}, hasMarginList=${hasMarginList}`); // Діагностика
    return matchesSearch && hasMarginList;
  });

  console.log('fundingData:', fundingData);
  console.log('filteredTokens:', filteredTokens);

  return (
    <section className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      {/* Заголовок і пошук */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          Ставки фінансування
          {isLoading && (
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          )}
        </h2>
        <input
          type="text"
          placeholder="Пошук токена..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:w-64 py-2 px-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        />
      </div>

      {/* Вкладки */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('stablecoin')}
            className={`py-2 px-4 rounded-lg font-semibold transition-colors ${
              activeTab === 'stablecoin'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Stablecoin Margin
          </button>
          <button
            onClick={() => setActiveTab('token')}
            className={`py-2 px-4 rounded-lg font-semibold transition-colors ${
              activeTab === 'token'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Token Margin
          </button>
        </div>
      </div>

      {/* Помилка або таблиця */}
      {error ? (
        <div className="p-6">
          <div className="p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg text-red-600 dark:text-red-400">
            {error}
          </div>
        </div>
      ) : filteredTokens.length === 0 && !isLoading ? (
        <div className="p-6 text-center text-gray-500 dark:text-gray-400">
          Немає даних для відображення. Перевірте вкладку або пошуковий запит.
        </div>
      ) : (
        <div className="max-h-[70vh] overflow-x-auto overflow-y-auto">
          <table className="w-full min-w-max table-fixed">
            <thead>
              <tr className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <th className="py-4 px-6 text-left font-semibold text-gray-700 dark:text-gray-200 w-40">
                  Монета
                </th>
                {availableExchanges.length > 0 ? (
                  availableExchanges.map((ex) => (
                    <th
                      key={ex.key}
                      className="py-4 px-6 text-center font-semibold text-gray-700 dark:text-gray-200"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <ExchangeIcon exchange={ex.displayName} size={20} />
                        <span>{ex.displayName}</span>
                      </div>
                    </th>
                  ))
                ) : (
                  <th className="py-4 px-6 text-center font-semibold text-gray-700 dark:text-gray-200">
                    Немає доступних бірж
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {filteredTokens.map((token) => (
                <TokenItem
                  key={`${token.symbol}-${activeTab}`}
                  token={token}
                  exchanges={availableExchanges.map((e) => e.key)}
                  marginType={activeTab}
                  onClick={onSelectToken}
                  onRateClick={onSelectRate}
                />
              ))}
              {!isLoading && filteredTokens.length === 0 && (
                <tr>
                  <td
                    colSpan={availableExchanges.length + 1 || 2}
                    className="text-center py-12 text-gray-500 dark:text-gray-400"
                  >
                    Нічого не знайдено
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
      stablecoin_margin_list: PropTypes.arrayOf(
        PropTypes.shape({
          exchange: PropTypes.string,
          funding_rate: PropTypes.number,
          funding_rate_interval: PropTypes.number,
          next_funding_time: PropTypes.number,
        })
      ),
      token_margin_list: PropTypes.arrayOf(
        PropTypes.shape({
          exchange: PropTypes.string,
          funding_rate: PropTypes.number,
          funding_rate_interval: PropTypes.number,
          next_funding_time: PropTypes.number,
        })
      ),
    })
  ).isRequired,
  isLoading: PropTypes.bool.isRequired,
  error: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  onSelectToken: PropTypes.func.isRequired,
  onSelectRate: PropTypes.func.isRequired,
};

export default FundingSection;