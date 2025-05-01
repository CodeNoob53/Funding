// src/components/Footer.jsx
import './Footer.css';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <p className="footer-copyright">
            © {currentYear} Калькулятор Фандингу
          </p>
          
          <div className="footer-disclaimer">
            <p>
              Дані надаються лише для інформаційних цілей
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;