import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

import { formatCurrency } from '../utils/format.js';

// Barras horizontais em vez de pizza: fatias de tamanho parecido sao
// dificeis de comparar num circulo, e nomes de categoria cabem melhor
// escritos na horizontal.
function ExpensesByCategoryChart({ data }) {
  // Altura proporcional ao numero de barras, com espaco reservado
  // para o eixo de baixo. Altura fixa cortaria as ultimas categorias.
  const height = Math.max(180, data.length * 42 + 40);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 64, bottom: 4, left: 4 }}>
        {/* Apenas linhas verticais: as horizontais nao ajudam a ler barras deitadas. */}
        <CartesianGrid horizontal={false} stroke="var(--chart-grid)" />
        <XAxis
          type="number"
          tickFormatter={(value) => formatCurrency(value)}
          stroke="var(--chart-axis)"
          tick={{ fill: 'var(--chart-muted)', fontSize: 12 }}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={110}
          stroke="var(--chart-axis)"
          tick={{ fill: 'var(--chart-muted)', fontSize: 12 }}
          tickLine={false}
        />
        <Tooltip
          formatter={(value) => [formatCurrency(value), 'Despesas']}
          contentStyle={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            boxShadow: 'var(--shadow-md)',
            fontSize: 13,
            color: 'var(--text)',
          }}
          itemStyle={{ color: 'var(--text)' }}
          labelStyle={{ color: 'var(--text-muted)', marginBottom: 4 }}
          cursor={{ fill: 'var(--chart-cursor)' }}
        />
        {/* Uma serie so, entao uma cor so: pintar cada barra de um tom
            diferente repetiria a informacao que o comprimento ja da. */}
        <Bar
          dataKey="total"
          fill="var(--chart-expense)"
          radius={[0, 4, 4, 0]}
          barSize={18}
          name="Despesas"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default ExpensesByCategoryChart;
