import { request } from './api.js';

// Monta a query string apenas com os filtros preenchidos:
// mandar ?month= vazio faria a API responder 400.
export function listTransactions({ month, categoryId } = {}) {
  const params = new URLSearchParams();

  if (month) {
    params.set('month', month);
  }

  if (categoryId) {
    params.set('categoryId', categoryId);
  }

  const query = params.toString();

  return request(`/transactions${query ? `?${query}` : ''}`);
}

export function createTransaction(data) {
  return request('/transactions', { method: 'POST', body: data });
}

export function updateTransaction(id, data) {
  return request(`/transactions/${id}`, { method: 'PUT', body: data });
}

export function deleteTransaction(id) {
  return request(`/transactions/${id}`, { method: 'DELETE' });
}
