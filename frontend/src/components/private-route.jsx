import { Navigate, useLocation } from 'react-router-dom';

import { hasValidSession, clearSession } from '../services/auth-storage.js';

// Protege as telas internas. Se nao houver sessao valida, manda para o login
// em vez de renderizar a pagina.
//
// Importante: isto e experiencia do usuario, nao seguranca. Um usuario pode
// burlar isto pelo console do navegador; o que realmente protege os dados
// e o middleware de autenticacao no backend.
function PrivateRoute({ children }) {
  const location = useLocation();

  if (!hasValidSession()) {
    // Token vencido ou corrompido deixa lixo no localStorage: limpamos aqui.
    clearSession();

    // state.from guarda onde o usuario queria ir, para voltarmos
    // para la depois do login em vez de jogar todo mundo na mesma tela.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export default PrivateRoute;
