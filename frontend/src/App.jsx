import { Routes, Route, Navigate } from 'react-router-dom';

import PrivateRoute from './components/private-route.jsx';
import PublicOnlyRoute from './components/public-only-route.jsx';
import Login from './pages/login.jsx';
import Register from './pages/register.jsx';
import Dashboard from './pages/dashboard.jsx';
import Transactions from './pages/transactions.jsx';
import Categories from './pages/categories.jsx';
import NotFound from './pages/not-found.jsx';

// Cada <Route> liga um caminho da URL a um componente de pagina.
// PublicOnlyRoute e PrivateRoute decidem quem pode ver o que.
function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/transactions" replace />} />

      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <Register />
          </PublicOnlyRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/transactions"
        element={
          <PrivateRoute>
            <Transactions />
          </PrivateRoute>
        }
      />
      <Route
        path="/categories"
        element={
          <PrivateRoute>
            <Categories />
          </PrivateRoute>
        }
      />

      {/* O * captura qualquer caminho que nao bateu com os anteriores. */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
