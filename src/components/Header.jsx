// src/components/Header.jsx
import { useState, useEffect } from 'react';
import { FiSun, FiMoon } from 'react-icons/fi';
import useThemeStore from '../store/themeStore';
import './Header.css';

function Header() {
  const { theme, toggleTheme } = useThemeStore();
  const [scrolled, setScrolled] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isDarkMode = theme === 'dark';

  return (
    <header className={`header ${scrolled ? 'header-scrolled' : ''}`}>
      <div className="container">
        <div className="header-content">
          <h1 className="header-title">
            Калькулятор Фандингу
          </h1>
          
          <div className="header-actions">
            <button 
              onClick={toggleTheme}
              className="btn-ghost btn-icon theme-toggle-btn"
              aria-label="Змінити тему"
            >
              <span className="theme-icon">
                {isDarkMode ? <FiSun /> : <FiMoon />}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;