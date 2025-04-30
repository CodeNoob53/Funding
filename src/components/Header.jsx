import { useState, useEffect } from 'react';
import { FiSun, FiMoon } from 'react-icons/fi';
import useThemeStore from '../store/themeStore';

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
    <header 
      className={`sticky top-0 z-10 transition-all duration-300 
                 backdrop-blur-sm border-b border-[rgb(var(--border))]
                 ${scrolled 
                   ? 'bg-[rgb(var(--card))] shadow-md' 
                   : 'bg-[rgb(var(--card))]'}`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          <h1 className="text-xl md:text-2xl font-bold">
            Калькулятор Фандингу
          </h1>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className="btn-ghost p-2 rounded-full"
              aria-label="Змінити тему"
            >
              {isDarkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
            </button>
            
            <span className="hidden md:block text-sm opacity-70">
              Актуальні ставки фандингу
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;