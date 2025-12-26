import { Link, useLocation } from 'react-router-dom';
import './Navigation.css';

export function Navigation() {
  const location = useLocation();

  return (
    <nav className="navigation">
      <div className="nav-brand">
        <h1>Datche event</h1>
      </div>
      <div className="nav-links">
        <Link
          to="/"
          className={location.pathname === '/' ? 'active' : ''}
        >
          Ventes
        </Link>
        <Link
          to="/stock"
          className={location.pathname === '/stock' ? 'active' : ''}
        >
          Stock
        </Link>
        <Link
          to="/parametres"
          className={location.pathname === '/parametres' ? 'active' : ''}
        >
          Paramètres
        </Link>
      </div>
    </nav>
  );
}

