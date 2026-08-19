import { formatCurrency, formatDate } from '../utils/format.js';

function TransactionList({ transactions }) {
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
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default TransactionList;
