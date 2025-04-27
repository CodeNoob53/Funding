function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[rgb(var(--card))/50] border-t border-[rgb(var(--border))] py-4">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-[rgb(var(--foreground))/60] text-sm">
            © {currentYear} Калькулятор Фандингу
          </p>
          
          <div className="mt-2 md:mt-0">
            <p className="text-xs text-[rgb(var(--foreground))/40]">
              Дані надаються лише для інформаційних цілей
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;