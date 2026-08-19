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

// Duas series (receitas e despesas) em barras agrupadas.
// Azul e laranja em vez de verde e vermelho: verde/vermelho e justamente
// o par que pessoas com daltonismo mais confundem.
function MonthlyEvolutionChart({ data }) {
  return (
    <>
      {/* Legenda propria em HTML: a do Recharts inverte a ordem das series
          em relacao as barras, o que confunde na hora de ler. */}
      <ul className="chart-legend">
        <li>
          <span className="legend-swatch" style={{ background: 'var(--chart-income)' }} />
          Receitas
        </li>
        <li>
          <span className="legend-swatch" style={{ background: 'var(--chart-expense)' }} />
          Despesas
        </li>
      </ul>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: 8 }}>
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
          <XAxis
            dataKey="label"
            stroke="var(--chart-axis)"
            tick={{ fill: 'var(--chart-muted)', fontSize: 12 }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(value) => formatCurrency(value)}
            stroke="var(--chart-axis)"
            tick={{ fill: 'var(--chart-muted)', fontSize: 12 }}
            tickLine={false}
            width={90}
          />
          <Tooltip
            formatter={(value, name) => [formatCurrency(value), name]}
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
          <Bar dataKey="income" name="Receitas" fill="var(--chart-income)" radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Bar dataKey="expense" name="Despesas" fill="var(--chart-expense)" radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </>
  );
}

export default MonthlyEvolutionChart;
