import { Link } from 'react-router-dom';

// Componente temporario usado pelas paginas ainda nao implementadas.
// Serve para conferir que o roteamento funciona antes de construir as telas.
function PagePlaceholder({ title, description }) {
  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: '2rem 1rem' }}>
      <h1>{title}</h1>
      <p>{description}</p>

      <nav style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
        {/* <Link> troca de rota sem recarregar a pagina inteira. */}
        <Link to="/login">Login</Link>
        <Link to="/register">Cadastro</Link>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/transactions">Transacoes</Link>
      </nav>
    </main>
  );
}

export default PagePlaceholder;
