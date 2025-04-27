function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-800/50 border-t border-slate-700 py-4">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-slate-400 text-sm">
            © {currentYear} Funding Calculator
          </p>
          
          <div className="mt-2 md:mt-0">
            <p className="text-xs text-slate-500">
              Data provided for informational purposes only
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;