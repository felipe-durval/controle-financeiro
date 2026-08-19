// Intl e nativo do navegador: formata moeda e data no padrao brasileiro
// sem precisar de biblioteca.
const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function formatCurrency(value) {
  return currencyFormatter.format(value);
}

// A API devolve a data em UTC (ex: 2026-08-15T00:00:00.000Z).
// Formatar com o fuso local mostraria 14/08 para quem esta no Brasil,
// entao lemos as partes em UTC de proposito.
export function formatDate(isoDate) {
  const date = new Date(isoDate);
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();

  return `${day}/${month}/${year}`;
}

// Converte a data da API (2026-08-15T00:00:00.000Z) para AAAA-MM-DD,
// que e o formato do <input type="date">. Lemos em UTC pelo mesmo
// motivo do formatDate: o fuso local deslocaria o dia.
export function toDateInputValue(isoDate) {
  const date = new Date(isoDate);
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');

  return `${date.getUTCFullYear()}-${month}-${day}`;
}

// Data de hoje em AAAA-MM-DD, para o formulario ja vir preenchido.
export function todayInputValue() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');

  return `${now.getFullYear()}-${month}-${day}`;
}

// Devolve o mes atual no formato AAAA-MM, que e o mesmo
// aceito pelo <input type="month"> e pela API.
export function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// Transforma "2026-08" em "agosto de 2026" para exibir na tela.
export function formatMonthLabel(month) {
  if (!month) {
    return 'todos os meses';
  }

  const [year, monthNumber] = month.split('-').map(Number);
  const label = new Date(Date.UTC(year, monthNumber - 1, 1)).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

  return label;
}
