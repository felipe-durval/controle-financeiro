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

// Le o miolo do token sem validar a assinatura.
// ATENCAO: isto NAO e verificacao de seguranca. Qualquer pessoa pode
// escrever um token com o conteudo que quiser; so o backend, que tem
// o segredo, consegue dizer se o token e legitimo. Usamos isto apenas
// para evitar abrir uma tela que a API recusaria em seguida.
function decodeTokenPayload(token) {
  try {
    // JWT usa base64url: precisa converter os caracteres antes do atob.
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export function hasValidSession() {
  const token = getToken();

  if (!token) {
    return false;
  }

  const payload = decodeTokenPayload(token);

  if (!payload) {
    return false;
  }

  // exp vem em segundos; Date.now() em milissegundos.
  return typeof payload.exp === 'number' && payload.exp * 1000 > Date.now();
}
