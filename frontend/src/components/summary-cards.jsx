import { formatCurrency } from '../utils/format.js';

// Calcula os totais do que esta sendo exibido no momento.
// Como os filtros ja foram aplicados pela API, somar aqui e suficiente.
function calculateSummary(transactions) {
  let income = 0;
  let expense = 0;

  for (const transaction of transactions) {
    if (transaction.type === 'income') {
      income += transaction.amount;
    } else {
      expense += transaction.amount;
    }
  }

  return { income, expense, balance: income - expense };
}

function SummaryCards({ transactions }) {
  const { income, expense, balance } = calculateSummary(transactions);

  return (
    <section className="summary">
      <div className="summary-card">
        <span className="summary-label">Receitas</span>
        <strong className="summary-value value-income">{formatCurrency(income)}</strong>
      </div>

      <div className="summary-card">
        <span className="summary-label">Despesas</span>
        <strong className="summary-value value-expense">{formatCurrency(expense)}</strong>
      </div>

      <div className="summary-card">
        <span className="summary-label">Saldo</span>
        <strong className={`summary-value ${balance < 0 ? 'value-expense' : ''}`}>
          {formatCurrency(balance)}
        </strong>
      </div>
    </section>
  );
}

export default SummaryCards;
