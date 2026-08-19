import { Link, useNavigate } from 'react-router-dom';

import ThemeToggle from './theme-toggle.jsx';
import { logout } from '../services/auth-service.js';
import { getUser } from '../services/auth-storage.js';

// Cabecalho das telas internas: navegacao e saida da conta.
function AppHeader() {
  const navigate = useNavigate();
  const user = getUser();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <nav className="app-nav">
          <Link to="/transactions">Transacoes</Link>
          <Link to="/categories">Categorias</Link>
          <Link to="/dashboard">Dashboard</Link>
        </nav>

        <div className="app-header-user">
          {user && <span>{user.name}</span>}
          <ThemeToggle />
          <button type="button" className="button-secondary" onClick={handleLogout}>
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}

export default AppHeader;
