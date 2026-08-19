import { Link } from 'react-router-dom';

function Dashboard() {
  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: '2rem 1rem' }}>
      <h1>Dashboard</h1>
      <p style={{ color: '#6b7280' }}>Graficos: etapa 17.</p>
      <Link to="/transactions">Ir para transacoes</Link>
    </main>
  );
}

export default Dashboard;
