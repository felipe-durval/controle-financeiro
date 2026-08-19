import { useState } from 'react';

import AppHeader from '../components/app-header.jsx';
import { useCategories } from '../hooks/use-categories.js';
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from '../services/category-service.js';

const MAX_NAME_LENGTH = 50;

function Categories() {
  const { categories, loading, error, reload } = useCategories();

  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  // Guarda o id da categoria sendo renomeada e o texto digitado.
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const [deletingId, setDeletingId] = useState(null);
  const [actionError, setActionError] = useState('');

  async function handleCreate(event) {
    event.preventDefault();

    if (!newName.trim()) {
      setActionError('Informe o nome da categoria.');
      return;
    }

    setActionError('');
    setCreating(true);

    try {
      await createCategory({ name: newName.trim() });
      setNewName('');
      reload();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setCreating(false);
    }
  }

  function startEditing(category) {
    setActionError('');
    setEditingId(category.id);
    setEditingName(category.name);
  }

  async function handleSaveEdit(event) {
    event.preventDefault();

    if (!editingName.trim()) {
      setActionError('Informe o nome da categoria.');
      return;
    }

    setActionError('');
    setSavingEdit(true);

    try {
      await updateCategory(editingId, { name: editingName.trim() });
      setEditingId(null);
      reload();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDelete(category) {
    const confirmed = window.confirm(`Excluir a categoria "${category.name}"?`);

    if (!confirmed) {
      return;
    }

    setActionError('');
    setDeletingId(category.id);

    try {
      await deleteCategory(category.id);
      reload();
    } catch (err) {
      // O backend recusa excluir categoria em uso (409) com uma
      // mensagem explicando quantas transacoes existem.
      setActionError(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <AppHeader />

      <main className="page">
        <h1>Categorias</h1>
        <p className="page-subtitle">
          Use categorias para agrupar suas transacoes (ex: alimentacao, transporte).
        </p>

        <form className="inline-form" onSubmit={handleCreate} noValidate>
          <div className="field">
            <label htmlFor="new-category">Nova categoria</label>
            <input
              id="new-category"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              maxLength={MAX_NAME_LENGTH}
              placeholder="Ex: Alimentacao"
            />
          </div>

          <button type="submit" disabled={creating}>
            {creating ? 'Adicionando...' : 'Adicionar'}
          </button>
        </form>

        {actionError && (
          <p className="auth-error" role="alert">
            {actionError}
          </p>
        )}

        {loading && <p className="state-message">Carregando...</p>}

        {!loading && error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}

        {!loading && !error && categories.length === 0 && (
          <p className="state-message">
            Voce ainda nao tem categorias. Crie a primeira no campo acima.
          </p>
        )}

        {!loading && !error && categories.length > 0 && (
          <ul className="category-list">
            {categories.map((category) => (
              <li key={category.id} className="category-item">
                {editingId === category.id ? (
                  // Modo edicao: a linha vira um formulario.
                  <form className="category-edit" onSubmit={handleSaveEdit}>
                    <input
                      value={editingName}
                      onChange={(event) => setEditingName(event.target.value)}
                      maxLength={MAX_NAME_LENGTH}
                      aria-label={`Novo nome para ${category.name}`}
                      autoFocus
                    />
                    <button type="submit" disabled={savingEdit}>
                      {savingEdit ? 'Salvando...' : 'Salvar'}
                    </button>
                    <button
                      type="button"
                      className="button-secondary"
                      onClick={() => setEditingId(null)}
                    >
                      Cancelar
                    </button>
                  </form>
                ) : (
                  <>
                    <span>{category.name}</span>
                    <div className="row-actions">
                      <button
                        type="button"
                        className="button-link"
                        onClick={() => startEditing(category)}
                        aria-label={`Renomear ${category.name}`}
                      >
                        Renomear
                      </button>
                      <button
                        type="button"
                        className="button-link button-danger"
                        onClick={() => handleDelete(category)}
                        disabled={deletingId === category.id}
                        aria-label={`Excluir ${category.name}`}
                      >
                        {deletingId === category.id ? 'Excluindo...' : 'Excluir'}
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}

export default Categories;
