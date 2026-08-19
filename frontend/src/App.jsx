import { Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/login.jsx';
import Register from './pages/register.jsx';
import Dashboard from './pages/dashboard.jsx';
import Transactions from './pages/transactions.jsx';
import NotFound from './pages/not-found.jsx';

// Cada <Route> liga um caminho da URL a um componente de pagina.
// A protecao das rotas privadas entra na etapa 14.
function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/transactions" element={<Transactions />} />
      {/* O * captura qualquer caminho que nao bateu com os anteriores. */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
