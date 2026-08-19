import { request } from './api.js';

export function listCategories() {
  return request('/categories');
}

export function createCategory({ name }) {
  return request('/categories', { method: 'POST', body: { name } });
}

export function updateCategory(id, { name }) {
  return request(`/categories/${id}`, { method: 'PUT', body: { name } });
}

export function deleteCategory(id) {
  return request(`/categories/${id}`, { method: 'DELETE' });
}
