import { Navigate } from 'react-router-dom';

import { hasValidSession } from '../services/auth-storage.js';

// O contrario do PrivateRoute: quem ja esta logado nao precisa
// ver as telas de login e cadastro.
function PublicOnlyRoute({ children }) {
  if (hasValidSession()) {
    return <Navigate to="/transactions" replace />;
  }

  return children;
}

export default PublicOnlyRoute;
