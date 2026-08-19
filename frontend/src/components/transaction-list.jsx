import { formatCurrency, formatDate } from '../utils/format.js';

function TransactionList({ transactions, onEdit, onDelete, deletingId }) {
  return (
    <table className="transaction-table">
      <caption className="sr-only">Lista de transacoes</caption>
      <thead>
        <tr>
          <th scope="col">Data</th>
          <th scope="col">Descricao</th>
          <th scope="col">Categoria</th>
          <th scope="col" className="align-right">
            Valor
          </th>
          <th scope="col" className="align-right">
            Acoes
          </th>
        </tr>
      </thead>
      <tbody>
        {transactions.map((transaction) => {
          const isIncome = transaction.type === 'income';

          return (
            <tr key={transaction.id}>
              <td>{formatDate(transaction.date)}</td>
              <td>{transaction.description}</td>
              <td>
                <span className="category-tag">{transaction.category.name}</span>
              </td>
              <td className={`align-right ${isIncome ? 'value-income' : 'value-expense'}`}>
                {isIncome ? '+' : '-'} {formatCurrency(transaction.amount)}
              </td>
              <td className="align-right">
                <div className="row-actions">
                  <button
                    type="button"
                    className="button-link"
                    onClick={() => onEdit(transaction)}
                    // O texto do botao e so "Editar"; o aria-label diz
                    // o que sera editado, para quem usa leitor de tela.
                    aria-label={`Editar ${transaction.description}`}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="button-link button-danger"
                    onClick={() => onDelete(transaction)}
                    disabled={deletingId === transaction.id}
                    aria-label={`Excluir ${transaction.description}`}
                  >
                    {deletingId === transaction.id ? 'Excluindo...' : 'Excluir'}
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default TransactionList;
