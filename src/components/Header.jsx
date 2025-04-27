import { FiSun, FiMoon } from 'react-icons/fi';
import useThemeStore from '../store/themeStore';

function Header() {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <header className="sticky top-0 z-10 bg-[rgb(var(--card))] border-b border-[rgb(var(--border))] backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-bold">
            Funding Calculator
          </h1>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className="btn-ghost p-2 rounded-full"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <FiSun size={20} /> : <FiMoon size={20} />}
            </button>
            
            <span className="hidden md:block text-sm opacity-70">
              Real-time funding rates
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;