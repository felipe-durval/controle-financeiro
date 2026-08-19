import { useState } from 'react';

// Envolve um grafico com titulo e a opcao de ver os mesmos dados em tabela.
// A tabela nao e enfeite: quem usa leitor de tela, ou nao distingue as cores,
// precisa de um caminho para o numero exato.
function ChartCard({ title, subtitle, columns, rows, children }) {
  const [showTable, setShowTable] = useState(false);

  return (
    <section className="chart-card">
      <header className="chart-card-header">
        <div>
          <h2>{title}</h2>
          {subtitle && <p className="chart-subtitle">{subtitle}</p>}
        </div>

        <button
          type="button"
          className="button-link"
          onClick={() => setShowTable((current) => !current)}
          aria-pressed={showTable}
        >
          {showTable ? 'Ver grafico' : 'Ver tabela'}
        </button>
      </header>

      {showTable ? (
        <table className="transaction-table">
          <caption className="sr-only">{title}</caption>
          <thead>
            <tr>
              {columns.map((column, index) => (
                <th key={column} scope="col" className={index === 0 ? undefined : 'align-right'}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row[0]}>
                {row.map((cell, index) => (
                  <td key={`${row[0]}-${index}`} className={index === 0 ? undefined : 'align-right'}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        children
      )}
    </section>
  );
}

export default ChartCard;
