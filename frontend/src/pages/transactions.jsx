import { useState } from 'react';

import AppHeader from '../components/app-header.jsx';
import TransactionFilters from '../components/transaction-filters.jsx';
import TransactionList from '../components/transaction-list.jsx';
import TransactionForm from '../components/transaction-form.jsx';
import SummaryCards from '../components/summary-cards.jsx';
import { useTransactions } from '../hooks/use-transactions.js';
import { useCategories } from '../hooks/use-categories.js';
import { deleteTransaction } from '../services/transaction-service.js';
import { currentMonth, formatMonthLabel } from '../utils/format.js';

function Transactions() {
  const [month, setMonth] = useState(currentMonth());
  const [categoryId, setCategoryId] = useState('');

  // null = formulario fechado. Guardamos a transacao em edicao aqui:
  // 'new' significa criar, um objeto significa editar aquele registro.
  const [editing, setEditing] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [actionError, setActionError] = useState('');

  const { transactions, loading, error, reload } = useTransactions({ month, categoryId });
  const { categories, loading: loadingCategories } = useCategories();

  function handleClearFilters() {
    setMonth('');
    setCategoryId('');
  }

  function handleSaved() {
    setEditing(null);
    // Recarrega para a lista refletir o que acabou de ser gravado.
    reload();
  }

  async function handleDelete(transaction) {
    const confirmed = window.confirm(`Excluir "${transaction.description}"?`);

    if (!confirmed) {
      return;
    }

    setActionError('');
    setDeletingId(transaction.id);

    try {
      await deleteTransaction(transaction.id);
      reload();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  const hasCategories = categories.length > 0;

  return (
    <>
      <AppHeader />

      <main className="page">
        <div className="page-heading">
          <div>
            <h1>Transacoes</h1>
            <p className="page-subtitle">Exibindo {formatMonthLabel(month)}.</p>
          </div>

          <button
            type="button"
            onClick={() => setEditing('new')}
            disabled={!hasCategories}
            // Explica por que o botao esta desabilitado.
            title={hasCategories ? undefined : 'Crie uma categoria primeiro'}
          >
            Nova transacao
          </button>
        </div>

        {!loadingCategories && !hasCategories && (
          <p className="state-message">
            Voce ainda nao tem categorias. E preciso ter pelo menos uma para
            lancar transacoes.
          </p>
        )}

        <TransactionFilters
          month={month}
          categoryId={categoryId}
          categories={categories}
          onMonthChange={setMonth}
          onCategoryChange={setCategoryId}
          onClear={handleClearFilters}
        />

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

        {!loading && !error && transactions.length === 0 && (
          <p className="state-message">Nenhuma transacao encontrada para este filtro.</p>
        )}

        {!loading && !error && transactions.length > 0 && (
          <>
            <SummaryCards transactions={transactions} />
            <TransactionList
              transactions={transactions}
              onEdit={setEditing}
              onDelete={handleDelete}
              deletingId={deletingId}
            />
          </>
        )}
      </main>

      {editing && (
        <TransactionForm
          // key faz o React montar um formulario novo ao trocar de registro,
          // em vez de reaproveitar o anterior com os campos antigos.
          key={editing === 'new' ? 'new' : editing.id}
          transaction={editing === 'new' ? null : editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}

export default Transactions;
