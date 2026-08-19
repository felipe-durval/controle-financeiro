import { getToken, clearSession } from './auth-storage.js';

// Em desenvolvimento vale o localhost; no deploy definimos VITE_API_URL.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Erro com o status HTTP junto, para as telas decidirem o que mostrar.
export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// Transforma a resposta de erro da API em uma mensagem unica.
// O backend responde { error: "..." } ou { errors: ["...", "..."] }.
function extractErrorMessage(body, status) {
  if (body?.errors?.length) {
    return body.errors.join(' ');
  }

  if (body?.error) {
    return body.error;
  }

  return `Erro inesperado (HTTP ${status}).`;
}

export async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {};

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (auth) {
    const token = getToken();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  let response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    // Cai aqui quando a API esta fora do ar ou sem rede.
    throw new ApiError('Nao foi possivel conectar ao servidor.', 0);
  }

  // 204 (usado nos DELETE) nao tem corpo para ler.
  const data = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    // Token expirado ou invalido: limpa a sessao para o app pedir login de novo.
    if (response.status === 401 && auth) {
      clearSession();
    }

    throw new ApiError(extractErrorMessage(data, response.status), response.status);
  }

  return data;
}
