import PropTypes from 'prop-types';
import { useState } from 'react';
import { FiFilter, FiSliders, FiEye, FiRefreshCw } from 'react-icons/fi';
import './FilterPanel.css';
import useAppStore from '../store/appStore';
import { DEFAULT_SETTINGS } from '../config/appConfig';

function FilterPanel({ onClose }) {
  const [activeTab, setActiveTab] = useState('filter');
  
  const { 
    filters,
    updateFilter,
    updateExchangeVisibility,
    availableExchanges,
    resetTabFilters
  } = useAppStore(state => ({
    filters: state.filters,
    updateFilter: state.updateFilter,
    updateExchangeVisibility: state.updateExchangeVisibility,
    availableExchanges: state.availableExchanges,
    resetTabFilters: state.resetTabFilters
  }));

  // Деструктуризуємо налаштування фільтрів
  const {
    enabled: filtersEnabled,
    minFundingRate,
    rateSignFilter,
    displayMode,
    fundingInterval,
    statusFilter,
    sortBy,
    sortOrder,
    exchangeSortBy,
    exchangeSortOrder,
    stablecoinExchanges = {},
    tokenExchanges = {}
  } = filters;

  // Переконаємося, що DEFAULT_SETTINGS містить потрібні обʼєкти, інакше створимо порожні
  const defaultStablecoinExchanges = DEFAULT_SETTINGS?.filters?.stablecoinExchanges || {};
  const defaultTokenExchanges = DEFAULT_SETTINGS?.filters?.tokenExchanges || {};

  const setFiltersEnabled = (value) => updateFilter('enabled', value);
  const setMinFundingRate = (value) => updateFilter('minFundingRate', value);
  const setRateSignFilter = (value) => updateFilter('rateSignFilter', value);
  const setDisplayMode = (value) => updateFilter('displayMode', value);
  const setFundingInterval = (value) => updateFilter('fundingInterval', value);
  const setStatusFilter = (value) => updateFilter('statusFilter', value);
  const setSortBy = (value) => updateFilter('sortBy', value);
  const setSortOrder = (value) => updateFilter('sortOrder', value);
  const setExchangeSortBy = (value) => updateFilter('exchangeSortBy', value);
  const setExchangeSortOrder = (value) => updateFilter('exchangeSortOrder', value);
  
  // Функція для оновлення видимості біржі з урахуванням типу маржі
  const handleStablecoinExchangeChange = (exchange, isVisible) => {
    updateExchangeVisibility(exchange, isVisible, 'stablecoin');
  };

  const handleTokenExchangeChange = (exchange, isVisible) => {
    updateExchangeVisibility(exchange, isVisible, 'token');
  };

  // Функція для скидання налаштувань поточної вкладки
  const handleResetTab = () => {
    resetTabFilters(activeTab);
  };

  // Функція для отримання іконки біржі
  const getExchangeLogo = (exchange) => {
    if (availableExchanges[exchange] && availableExchanges[exchange].logoUrl) {
      return availableExchanges[exchange].logoUrl;
    }
    return null;
  };

  // Функція для рендерингу вкладки "фільтр"
  const renderFilterTab = () => (
    <>
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
    </>
  );

  // Функція для рендерингу вкладки "сортування"
  const renderSortingTab = () => (
    <>
      <div className="filter-group">
        <label>Інтервал фандингу (години)</label>
        <select
          value={fundingInterval}
          onChange={(e) => setFundingInterval(e.target.value)}
          className="filter-select"
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
        >
          <option value="name">Назва (A-Z)</option>
          <option value="tokens">Кількість токенів</option>
          <option value="bestFR">Найкраща ставка</option>
        </select>
        <select
          value={exchangeSortOrder}
          onChange={(e) => setExchangeSortOrder(e.target.value)}
          className="filter-select"
        >
          <option value="desc">Спадання</option>
          <option value="asc">Зростання</option>
        </select>
      </div>
    </>
  );

  // Функція для рендерингу вкладки "відображення"
  const renderDisplayTab = () => {
    // Використовуємо список бірж з availableExchanges, якщо DEFAULT_SETTINGS не містить потрібних даних
    const stablecoinKeys = Object.keys(defaultStablecoinExchanges).length > 0 
      ? Object.keys(defaultStablecoinExchanges) 
      : Object.keys(availableExchanges);
      
    const tokenKeys = Object.keys(defaultTokenExchanges).length > 0 
      ? Object.keys(defaultTokenExchanges) 
      : Object.keys(availableExchanges);
    
    return (
      <>
        <div className="filter-group">
          <label>Біржі</label>
          
          <div className="exchanges-wrapper">
            {/* Заголовки */}
            <div className="exchanges-header-container">
              <div className="exchange-header-tab active">USDT Margined</div>
              <div className="exchange-header-tab active">Token Margined</div>
            </div>
            
            {/* Контейнер для обох колонок бірж */}
            <div className="exchanges-columns-container">
              {/* USDT Margined колонка */}
              <div className="exchange-checkboxes">
                {stablecoinKeys.map((exchange) => {
                  const logo = getExchangeLogo(exchange);
                  return (
                    <label key={`stablecoin-${exchange}`} className="exchange-checkbox">
                      <input
                        type="checkbox"
                        checked={stablecoinExchanges[exchange] === true}
                        onChange={() => handleStablecoinExchangeChange(exchange, !stablecoinExchanges[exchange])}
                      />
                      {logo && (
                        <img 
                          src={logo} 
                          alt={exchange} 
                          className="exchange-icon" 
                        />
                      )}
                      {availableExchanges[exchange]?.displayName || exchange}
                    </label>
                  );
                })}
              </div>
              
              {/* Token Margined колонка */}
              <div className="exchange-checkboxes">
                {tokenKeys.map((exchange) => {
                  const logo = getExchangeLogo(exchange);
                  return (
                    <label key={`token-${exchange}`} className="exchange-checkbox">
                      <input
                        type="checkbox"
                        checked={tokenExchanges[exchange] === true}
                        onChange={() => handleTokenExchangeChange(exchange, !tokenExchanges[exchange])}
                      />
                      {logo && (
                        <img 
                          src={logo} 
                          alt={exchange} 
                          className="exchange-icon" 
                        />
                      )}
                      {availableExchanges[exchange]?.displayName || exchange}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  // Визначаємо, який вміст показати на основі активної вкладки
  const renderTabContent = () => {
    switch (activeTab) {
      case 'filter':
        return renderFilterTab();
      case 'sorting':
        return renderSortingTab();
      case 'display':
        return renderDisplayTab();
      default:
        return renderFilterTab();
    }
  };

  return (
    <div className="filter-panel">
      <div className="filter-panel-header">
        <h3>Фільтри</h3>
        <button className="filter-close-button" onClick={onClose} aria-label="Закрити панель фільтрів">
          ×
        </button>
      </div>

      <div className="filter-tabs">
        <button 
          className={`filter-tab ${activeTab === 'filter' ? 'active' : ''}`}
          onClick={() => setActiveTab('filter')}
        >
          <FiFilter size={16} />
          <span>Фільтр</span>
        </button>
        <button 
          className={`filter-tab ${activeTab === 'sorting' ? 'active' : ''}`}
          onClick={() => setActiveTab('sorting')}
        >
          <FiSliders size={16} />
          <span>Сортування</span>
        </button>
        <button 
          className={`filter-tab ${activeTab === 'display' ? 'active' : ''}`}
          onClick={() => setActiveTab('display')}
        >
          <FiEye size={16} />
          <span>Відображення</span>
        </button>
      </div>

      <div className="filter-content">
        {renderTabContent()}
      </div>

      <div className="filter-action">
        <button className="filter-reset-button" onClick={handleResetTab}>
          <FiRefreshCw size={16} />
          <span>Скинути налаштування</span>
        </button>
      </div>
    </div>
  );
}

FilterPanel.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default FilterPanel;