// Extrai "2026-08" de "2026-08-15T00:00:00.000Z".
// Usamos as partes em UTC pelo mesmo motivo do formatDate: o fuso local
// deslocaria transacoes do dia 1 para o mes anterior.
export function monthKeyOf(isoDate) {
  const date = new Date(isoDate);
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');

  return `${date.getUTCFullYear()}-${month}`;
}

// Soma receitas e despesas de uma lista de transacoes.
export function summarize(transactions) {
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

// Agrupa as despesas por categoria, da maior para a menor.
// Ordenar aqui e o que permite o grafico de barras ser lido de cima para baixo.
export function expensesByCategory(transactions) {
  const totals = new Map();

  for (const transaction of transactions) {
    if (transaction.type !== 'expense') {
      continue;
    }

    const name = transaction.category.name;
    totals.set(name, (totals.get(name) || 0) + transaction.amount);
  }

  return [...totals.entries()]
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total);
}

// Devolve as chaves dos N meses que terminam em endMonth ("2026-08").
// Meses sem nenhuma transacao precisam aparecer no grafico como zero,
// senao a linha do tempo fica com buracos.
export function lastMonthKeys(endMonth, count) {
  const [year, month] = endMonth.split('-').map(Number);
  const keys = [];

  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const date = new Date(Date.UTC(year, month - 1 - offset, 1));
    const monthNumber = String(date.getUTCMonth() + 1).padStart(2, '0');

    keys.push(`${date.getUTCFullYear()}-${monthNumber}`);
  }

  return keys;
}

// Monta a serie mensal de receitas e despesas para o periodo pedido.
export function monthlyEvolution(transactions, endMonth, count = 6) {
  const keys = lastMonthKeys(endMonth, count);
  const byMonth = new Map(keys.map((key) => [key, { income: 0, expense: 0 }]));

  for (const transaction of transactions) {
    const entry = byMonth.get(monthKeyOf(transaction.date));

    // Transacoes fora da janela sao ignoradas.
    if (!entry) {
      continue;
    }

    if (transaction.type === 'income') {
      entry.income += transaction.amount;
    } else {
      entry.expense += transaction.amount;
    }
  }

  return keys.map((key) => {
    const [year, month] = key.split('-');

    return {
      month: key,
      // Rotulo curto para o eixo: "ago/26".
      label: new Date(Date.UTC(Number(year), Number(month) - 1, 1))
        .toLocaleDateString('pt-BR', { month: 'short', timeZone: 'UTC' })
        .replace('.', '') + `/${year.slice(2)}`,
      ...byMonth.get(key),
    };
  });
}
