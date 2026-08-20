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

// No plano gratuito, a API hiberna apos 15 minutos sem uso e leva
// ate um minuto para voltar. Sem aviso, a tela parece travada.
// Passado este tempo sem resposta, avisamos quem estiver ouvindo.
const SLOW_REQUEST_MS = 3000;

const slowListeners = new Set();
let slowRequestCount = 0;

export function onSlowRequest(listener) {
  slowListeners.add(listener);
  return () => slowListeners.delete(listener);
}

function notifySlow() {
  for (const listener of slowListeners) {
    listener(slowRequestCount > 0);
  }
}

// Acorda a API assim que a pagina abre, sem esperar o primeiro clique.
// Enquanto a pessoa le a tela e digita, o servidor ja esta subindo.
export function warmUp() {
  fetch(`${API_URL}/health`).catch(() => {
    // Falhar aqui nao muda nada: e so um empurrao antecipado.
  });
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

  // Se a resposta demorar, sinaliza que o servidor esta acordando.
  const slowTimer = setTimeout(() => {
    slowRequestCount += 1;
    notifySlow();
  }, SLOW_REQUEST_MS);

  // Zera o aviso, tenha a requisicao dado certo ou errado.
  function finishTiming() {
    clearTimeout(slowTimer);

    if (slowRequestCount > 0) {
      slowRequestCount -= 1;
      notifySlow();
    }
  }

  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    finishTiming();
    // Cai aqui quando a API esta fora do ar ou sem rede.
    throw new ApiError('Nao foi possivel conectar ao servidor.', 0);
  }

  finishTiming();

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
