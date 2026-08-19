const TOKEN_KEY = 'controle-financeiro:token';
const USER_KEY = 'controle-financeiro:user';

// Guardamos o token no localStorage para o usuario continuar logado
// depois de fechar e reabrir o navegador.
export function saveSession({ token, user }) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser() {
  const raw = localStorage.getItem(USER_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    // Dado corrompido no localStorage nao deve derrubar a aplicacao.
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
