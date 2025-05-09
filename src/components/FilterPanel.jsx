import PropTypes from 'prop-types';
import './FilterPanel.css';
import { useState } from 'react';

function FilterPanel({
  filtersEnabled,
  setFiltersEnabled,
  minFundingRate,
  setMinFundingRate,
  rateSignFilter,
  setRateSignFilter,
  displayMode,
  setDisplayMode,
  fundingInterval,
  setFundingInterval,
  statusFilter,
  setStatusFilter,
  selectedExchanges,
  setSelectedExchanges,
  availableExchanges,
  onClose,
}) {
  const [sortBy, setSortBy] = useState('exchanges'); // Кількість бірж
  const [sortOrder, setSortOrder] = useState('asc'); // Зростання
  const [exchangeSortBy, setExchangeSortBy] = useState('tokens'); // Кількість токенів
  const [exchangeSortOrder, setExchangeSortOrder] = useState('asc'); // Зростання

  return (
    <div className="filter-panel">
      <div className="filter-panel-header">
        <h3>Фільтри</h3>
        <button className="filter-close-button" onClick={onClose} aria-label="Закрити панель фільтрів">
          ×
        </button>
      </div>

      <div className="filter-group">
        <label>Фільтри</label>
        <div className="radio-group">
          <label>
            <input
              type="radio"
              name="filtersEnabled"
              value="off"
              checked={!filtersEnabled}
              onChange={() => setFiltersEnabled(false)}
            />
            Вимкнено
          </label>
          <label>
            <input
              type="radio"
              name="filtersEnabled"
              value="on"
              checked={filtersEnabled}
              onChange={() => setFiltersEnabled(true)}
            />
            Увімкнено
          </label>
        </div>
      </div>

      <div className="filter-group">
        <label>Мінімальна ставка фандингу (%)</label>
        <input
          type="number"
          value={minFundingRate}
          onChange={(e) => setMinFundingRate(parseFloat(e.target.value) || 0)}
          step="0.01"
          min="0"
          className="filter-input"
          disabled={!filtersEnabled}
        />
      </div>

      <div className="filter-group">
        <label>Тип ставки</label>
        <select
          value={rateSignFilter}
          onChange={(e) => setRateSignFilter(e.target.value)}
          className="filter-select"
          disabled={!filtersEnabled}
        >
          <option value="all">Усі</option>
          <option value="long">Long</option>
          <option value="short">Short</option>
        </select>
      </div>

      <div className="filter-group">
        <label>Режим відображення</label>
        <select
          value={displayMode}
          onChange={(e) => setDisplayMode(e.target.value)}
          className="filter-select filter-select-wide"
          disabled={!filtersEnabled}
        >
          <option value="option1">Всі біржі (якщо ≥ на одній)</option>
          <option value="option2">Тільки біржі ≥ значення</option>
        </select>
      </div>

      <div className="filter-group">
        <label>Інтервал фандингу (години)</label>
        <select
          value={fundingInterval}
          onChange={(e) => setFundingInterval(e.target.value)}
          className="filter-select"
          disabled={!filtersEnabled}
        >
          <option value="all">Усі</option>
          <option value="4">4 години</option>
          <option value="8">8 годин</option>
          <option value="12">12 годин</option>
        </select>
      </div>

      <div className="filter-group">
        <label>Статус</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="filter-select"
          disabled={!filtersEnabled}
        >
          <option value="all">Усі</option>
          <option value="active">Активні</option>
          <option value="predicted">Прогнозовані</option>
        </select>
      </div>

      <div className="filter-group">
        <label>Сортування Symbol</label>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="filter-select"
          disabled={!filtersEnabled}
        >
          <option value="exchanges">Кількість бірж</option>
          <option value="symbol">Символ (A-Z)</option>
          <option value="fundingRate">Середня ставка</option>
          <option value="bestFR">Найкраща ставка (Best FR)</option>
        </select>
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="filter-select"
          disabled={!filtersEnabled}
        >
          <option value="desc">Спадання</option>
          <option value="asc">Зростання</option>
        </select>
      </div>

      <div className="filter-group">
        <label>Сортування бірж</label>
        <select
          value={exchangeSortBy}
          onChange={(e) => setExchangeSortBy(e.target.value)}
          className="filter-select"
          disabled={!filtersEnabled}
        >
          <option value="name">Назва (A-Z)</option>
          <option value="tokens">Кількість токенів</option>
          <option value="bestFR">Найкраща ставка</option>
        </select>
        <select
          value={exchangeSortOrder}
          onChange={(e) => setExchangeSortOrder(e.target.value)}
          className="filter-select"
          disabled={!filtersEnabled}
        >
          <option value="desc">Спадання</option>
          <option value="asc">Зростання</option>
        </select>
      </div>

      <div className="filter-group">
        <label>Біржі</label>
        <div className="exchange-checkboxes">
          {Object.keys(availableExchanges).map((exchange) => (
            <label key={exchange} className="exchange-checkbox">
              <input
                type="checkbox"
                checked={selectedExchanges[exchange] !== false}
                onChange={() =>
                  setSelectedExchanges({
                    ...selectedExchanges,
                    [exchange]: !selectedExchanges[exchange],
                  })
                }
                disabled={!filtersEnabled}
              />
              {availableExchanges[exchange].displayName}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

FilterPanel.propTypes = {
  filtersEnabled: PropTypes.bool.isRequired,
  setFiltersEnabled: PropTypes.func.isRequired,
  minFundingRate: PropTypes.number.isRequired,
  setMinFundingRate: PropTypes.func.isRequired,
  rateSignFilter: PropTypes.string.isRequired,
  setRateSignFilter: PropTypes.func.isRequired,
  displayMode: PropTypes.string.isRequired,
  setDisplayMode: PropTypes.func.isRequired,
  fundingInterval: PropTypes.string.isRequired,
  setFundingInterval: PropTypes.func.isRequired,
  statusFilter: PropTypes.string.isRequired,
  setStatusFilter: PropTypes.func.isRequired,
  selectedExchanges: PropTypes.object.isRequired,
  setSelectedExchanges: PropTypes.func.isRequired,
  availableExchanges: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default FilterPanel;