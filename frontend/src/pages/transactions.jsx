import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { getCurrentUser, logout } from '../services/auth-service.js';

// Versao provisoria: serve para confirmar que o token guardado no login
// e aceito pela API. A listagem de verdade vem na etapa 15.
function Transactions() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .catch((err) => {
        // O PrivateRoute so olha a data de validade do token. Se o backend
        // recusar mesmo assim, e aqui que descobrimos e mandamos para o login.
        if (err.status === 401) {
          navigate('/login', { replace: true });
          return;
        }

        setError(err.message);
      });
  }, [navigate]);

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: '2rem 1rem' }}>
      <h1>Transacoes</h1>

      {error && (
        <p className="auth-error" role="alert">
          {error}
        </p>
      )}

      {user && (
        <p>
          Logado como <strong>{user.name}</strong> ({user.email})
        </p>
      )}

      <p style={{ color: '#6b7280' }}>Listagem e filtros: etapa 15.</p>

      <p>
        <Link to="/dashboard">Ir para o dashboard</Link>
      </p>

      <button type="button" onClick={handleLogout} style={{ marginTop: '1rem' }}>
        Sair
      </button>
    </main>
  );
}

export default Transactions;
