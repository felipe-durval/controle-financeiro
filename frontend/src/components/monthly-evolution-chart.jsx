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
              border: '1px solid var(--chart-grid)',
              borderRadius: 8,
              fontSize: 13,
            }}
            cursor={{ fill: 'rgba(11, 11, 11, 0.04)' }}
          />
          <Bar dataKey="income" name="Receitas" fill="var(--chart-income)" radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Bar dataKey="expense" name="Despesas" fill="var(--chart-expense)" radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </>
  );
}

export default MonthlyEvolutionChart;
