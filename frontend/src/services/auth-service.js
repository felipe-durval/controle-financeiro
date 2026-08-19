import { request } from './api.js';
import { saveSession, clearSession } from './auth-storage.js';

// auth: false porque estas rotas sao publicas e nao devem enviar token.
export function register({ name, email, password }) {
  return request('/auth/register', {
    method: 'POST',
    body: { name, email, password },
    auth: false,
  });
}

export async function login({ email, password }) {
  const data = await request('/auth/login', {
    method: 'POST',
    body: { email, password },
    auth: false,
  });

  saveSession({ token: data.token, user: data.user });

  return data.user;
}

export function logout() {
  // O JWT nao guarda estado no servidor: sair e apagar o token daqui.
  clearSession();
}

export function getCurrentUser() {
  return request('/auth/me');
}
