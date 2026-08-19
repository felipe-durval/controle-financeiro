import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import AppHeader from '../components/app-header.jsx';
import SummaryCards from '../components/summary-cards.jsx';
import ChartCard from '../components/chart-card.jsx';
import ExpensesByCategoryChart from '../components/expenses-by-category-chart.jsx';
import MonthlyEvolutionChart from '../components/monthly-evolution-chart.jsx';
import { useTransactions } from '../hooks/use-transactions.js';
import { currentMonth, formatCurrency, formatMonthLabel } from '../utils/format.js';
import { expensesByCategory, monthlyEvolution, monthKeyOf } from '../utils/aggregate.js';

const MONTHS_IN_CHART = 6;

function Dashboard() {
  const [month, setMonth] = useState(currentMonth());

  // Busca tudo de uma vez: o grafico de evolucao precisa de varios meses,
  // e sao os mesmos dados que alimentam o resto da tela.
  const { transactions, loading, error } = useTransactions({});

  // useMemo evita refazer as contas a cada renderizacao;
  // elas so mudam quando os dados ou o mes escolhido mudam.
  const monthTransactions = useMemo(
    () => transactions.filter((transaction) => monthKeyOf(transaction.date) === month),
    [transactions, month]
  );

  const categoryData = useMemo(
    () => expensesByCategory(monthTransactions),
    [monthTransactions]
  );

  const evolutionData = useMemo(
    () => monthlyEvolution(transactions, month, MONTHS_IN_CHART),
    [transactions, month]
  );

  const hasData = transactions.length > 0;

  return (
    <>
      <AppHeader />

      <main className="page">
        <div className="page-heading">
          <div>
            <h1>Dashboard</h1>
            <p className="page-subtitle">Resumo de {formatMonthLabel(month)}.</p>
          </div>
        </div>

        {/* Uma linha de filtro para a tela inteira, e nao um filtro
            dentro de cada grafico. */}
        <section className="filters">
          <div className="field">
            <label htmlFor="dashboard-month">Mes</label>
            <input
              id="dashboard-month"
              type="month"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
              required
            />
          </div>
        </section>

        {loading && <p className="state-message">Carregando...</p>}

        {!loading && error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}

        {!loading && !error && !hasData && (
          <p className="state-message">
            Nenhuma transacao cadastrada ainda.{' '}
            <Link to="/transactions">Lancar a primeira</Link>.
          </p>
        )}

        {!loading && !error && hasData && (
          <>
            <SummaryCards transactions={monthTransactions} />

            <ChartCard
              title="Despesas por categoria"
              subtitle={formatMonthLabel(month)}
              columns={['Categoria', 'Total']}
              rows={categoryData.map((item) => [item.name, formatCurrency(item.total)])}
            >
              {categoryData.length > 0 ? (
                <ExpensesByCategoryChart data={categoryData} />
              ) : (
                <p className="state-message">Nenhuma despesa neste mes.</p>
              )}
            </ChartCard>

            <ChartCard
              title="Evolucao mensal"
              subtitle={`Ultimos ${MONTHS_IN_CHART} meses ate ${formatMonthLabel(month)}`}
              columns={['Mes', 'Receitas', 'Despesas']}
              rows={evolutionData.map((item) => [
                item.label,
                formatCurrency(item.income),
                formatCurrency(item.expense),
              ])}
            >
              <MonthlyEvolutionChart data={evolutionData} />
            </ChartCard>
          </>
        )}
      </main>
    </>
  );
}

export default Dashboard;
