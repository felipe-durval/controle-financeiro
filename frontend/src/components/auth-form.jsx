import ThemeToggle from './theme-toggle.jsx';

// Estrutura visual compartilhada pelas telas de login e cadastro:
// painel de apresentacao a esquerda, formulario a direita.
function AuthForm({ title, subtitle, error, loading, loadingLabel, submitLabel, onSubmit, children, footer }) {
  return (
    <div className="auth-layout">
      {/* aria-hidden: e decoracao. Quem usa leitor de tela nao ganha nada
          ouvindo o slogan antes de chegar ao formulario. */}
      <aside className="auth-brand" aria-hidden="true">
        <div className="auth-brand-content">
          <p className="auth-brand-name">Controle Financeiro</p>
          <p className="auth-brand-tagline">
            Organize seus gastos e veja para onde vai o seu dinheiro.
          </p>

          <ul className="auth-brand-list">
            <li>Receitas e despesas em um lugar so</li>
            <li>Filtros por mes e por categoria</li>
            <li>Graficos para enxergar os padroes</li>
          </ul>
        </div>
      </aside>

      <main className="auth-panel">
        <div className="auth-theme-toggle">
          <ThemeToggle />
        </div>

        <form
          className="auth-card"
          onSubmit={onSubmit}
          // noValidate desliga as mensagens do navegador para usarmos as nossas,
          // em portugues e consistentes com as do backend.
          noValidate
        >
          <h1>{title}</h1>
          {subtitle && <p className="auth-subtitle">{subtitle}</p>}

          {children}

          {/* role="alert" faz leitores de tela anunciarem o erro assim que aparece. */}
          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading}>
            {loading ? loadingLabel : submitLabel}
          </button>

          <p className="auth-footer">{footer}</p>
        </form>
      </main>
    </div>
  );
}

export default AuthForm;
