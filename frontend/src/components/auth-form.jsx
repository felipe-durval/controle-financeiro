// Estrutura visual compartilhada pelas telas de login e cadastro.
function AuthForm({ title, subtitle, error, loading, loadingLabel, submitLabel, onSubmit, children, footer }) {
  return (
    <main className="auth-page">
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
  );
}

export default AuthForm;
