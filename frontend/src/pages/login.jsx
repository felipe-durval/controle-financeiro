import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import AuthForm from '../components/auth-form.jsx';
import TextField from '../components/text-field.jsx';
import { login } from '../services/auth-service.js';

function Login() {
  // Um estado para cada campo: sao inputs controlados pelo React.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  async function handleSubmit(event) {
    // Sem isso o navegador recarregaria a pagina ao enviar o formulario.
    event.preventDefault();

    setError('');

    if (!email.trim() || !password) {
      setError('Preencha email e senha.');
      return;
    }

    setLoading(true);

    try {
      await login({ email: email.trim(), password });
      // replace: true impede o usuario de voltar para o login pelo botao "voltar".
      navigate('/transactions', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      // Roda tanto no sucesso quanto no erro, para o botao nunca travar.
      setLoading(false);
    }
  }

  return (
    <AuthForm
      title="Entrar"
      subtitle="Acesse sua conta para ver suas transacoes."
      error={error}
      loading={loading}
      loadingLabel="Entrando..."
      submitLabel="Entrar"
      onSubmit={handleSubmit}
      footer={<>Ainda nao tem conta? <Link to="/register">Cadastre-se</Link></>}
    >
      <TextField
        id="email"
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
        autoComplete="email"
        placeholder="voce@exemplo.com"
      />
      <TextField
        id="password"
        label="Senha"
        type="password"
        value={password}
        onChange={setPassword}
        autoComplete="current-password"
      />
    </AuthForm>
  );
}

export default Login;
