// src/assets/cryptoIcons/index.js

// Використовуємо Vite функцію для динамічного імпорту
const iconModules = import.meta.glob('./icons/*.svg');

// Функція для динамічного завантаження іконки за символом
export async function loadIcon(symbol) {
  if (!symbol) return null;
  
  const normalizedSymbol = symbol.toLowerCase();
  const iconPath = `./icons/${normalizedSymbol}.svg`;
  
  // Перевіряємо, чи існує такий шлях до іконки
  if (iconModules[iconPath]) {
    try {
      // Динамічно завантажуємо модуль
      const module = await iconModules[iconPath]();
      return module.default;
    } catch (error) {
      console.error(`Помилка завантаження іконки для ${symbol}:`, error);
      return null;
    }
  }
  
  return null;
}

export default {
  loadIcon
};