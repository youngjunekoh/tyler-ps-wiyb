import './Header.css';

export default function Header({ onLogoClick }) {
  return (
    <header className="header">
      <div className="header-inner">
        <button className="header-logo" onClick={onLogoClick} aria-label="Go to home">
          <span className="header-logo-golf">Golf</span>
          <span className="header-logo-wrx">WRX</span>
          <span className="header-logo-answers">Answers</span>
        </button>
        <nav className="header-nav">
          <a
            href="https://forums.golfwrx.com"
            target="_blank"
            rel="noopener noreferrer"
            className="header-nav-link"
          >
            Forums
          </a>
          <a
            href="https://www.golfwrx.com"
            target="_blank"
            rel="noopener noreferrer"
            className="header-nav-link"
          >
            GolfWRX.com
          </a>
        </nav>
      </div>
    </header>
  );
}
