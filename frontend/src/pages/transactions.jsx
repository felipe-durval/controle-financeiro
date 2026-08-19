import { useState } from 'react';

import AppHeader from '../components/app-header.jsx';
import TransactionFilters from '../components/transaction-filters.jsx';
import TransactionList from '../components/transaction-list.jsx';
import SummaryCards from '../components/summary-cards.jsx';
import { useTransactions } from '../hooks/use-transactions.js';
import { useCategories } from '../hooks/use-categories.js';
import { currentMonth, formatMonthLabel } from '../utils/format.js';

function Transactions() {
  // Comeca no mes atual: e o que a pessoa quer ver ao abrir o app.
  const [month, setMonth] = useState(currentMonth());
  const [categoryId, setCategoryId] = useState('');

  const { transactions, loading, error } = useTransactions({ month, categoryId });
  const { categories } = useCategories();

  function handleClearFilters() {
    setMonth('');
    setCategoryId('');
  }

  return (
    <>
      <AppHeader />

      <main className="page">
        <h1>Transacoes</h1>
        <p className="page-subtitle">Exibindo {formatMonthLabel(month)}.</p>

        <TransactionFilters
          month={month}
          categoryId={categoryId}
          categories={categories}
          onMonthChange={setMonth}
          onCategoryChange={setCategoryId}
          onClear={handleClearFilters}
        />

        {/* Cada situacao tem seu proprio retorno, para a tela nunca
            ficar em branco sem explicacao. */}
        {loading && <p className="state-message">Carregando...</p>}

        {!loading && error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}

        {!loading && !error && transactions.length === 0 && (
          <p className="state-message">
            Nenhuma transacao encontrada para este filtro.
          </p>
        )}

        {!loading && !error && transactions.length > 0 && (
          <>
            <SummaryCards transactions={transactions} />
            <TransactionList transactions={transactions} />
          </>
        )}
      </main>
    </>
  );
}

export default Transactions;
