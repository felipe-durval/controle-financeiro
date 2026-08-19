import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import AuthForm from '../components/auth-form.jsx';
import TextField from '../components/text-field.jsx';
import { register, login } from '../services/auth-service.js';

// Mesma regra do backend, para o usuario saber do erro antes de enviar.
const MIN_PASSWORD_LENGTH = 8;

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Validacao aqui e so conveniencia: evita uma ida ao servidor para
  // erros obvios. A validacao que vale continua sendo a do backend.
  function validate() {
    if (!name.trim()) {
      return 'Informe seu nome.';
    }

    if (!email.trim()) {
      return 'Informe seu email.';
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`;
    }

    return '';
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setLoading(true);

    try {
      await register({ name: name.trim(), email: email.trim(), password });
      // Ja entra logado: evita obrigar o usuario a digitar tudo de novo.
      await login({ email: email.trim(), password });
      navigate('/transactions', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthForm
      title="Criar conta"
      subtitle="Comece a organizar suas financas."
      error={error}
      loading={loading}
      loadingLabel="Criando conta..."
      submitLabel="Criar conta"
      onSubmit={handleSubmit}
      footer={<>Ja tem conta? <Link to="/login">Entrar</Link></>}
    >
      <TextField
        id="name"
        label="Nome"
        value={name}
        onChange={setName}
        autoComplete="name"
        placeholder="Seu nome"
      />
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
        autoComplete="new-password"
        placeholder={`Minimo de ${MIN_PASSWORD_LENGTH} caracteres`}
      />
    </AuthForm>
  );
}

export default Register;
