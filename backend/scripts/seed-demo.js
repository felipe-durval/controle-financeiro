/*
 * Popula a conta de demonstracao com um semestre de lancamentos.
 *
 * Usa a API publica, e nao o banco direto: assim funciona tanto contra
 * o ambiente local quanto contra producao, sem precisar da string de
 * conexao do banco.
 *
 *   node scripts/seed-demo.js
 *   node scripts/seed-demo.js https://minha-api.onrender.com
 */

const API = process.argv[2] || process.env.API_URL || 'http://localhost:3000';

const DEMO = {
  name: 'Visitante',
  email: 'demo@exemplo.com',
  password: 'demo12345',
};

// Categorias com um valor tipico de gasto mensal, para os lancamentos
// gerados terem proporcoes que fazem sentido.
const CATEGORIES = [
  { name: 'Salario', type: 'income' },
  { name: 'Moradia', type: 'expense' },
  { name: 'Alimentacao', type: 'expense' },
  { name: 'Transporte', type: 'expense' },
  { name: 'Saude', type: 'expense' },
  { name: 'Lazer', type: 'expense' },
];

// Modelo de um mes. Os valores variam um pouco a cada mes para os
// graficos nao ficarem com barras identicas.
const TEMPLATE = [
  { categoria: 'Salario', descricao: 'Salario', valor: 4200, dia: 5, tipo: 'income' },
  { categoria: 'Moradia', descricao: 'Aluguel', valor: 1450, dia: 10, tipo: 'expense' },
  { categoria: 'Moradia', descricao: 'Conta de luz', valor: 180, dia: 12, tipo: 'expense' },
  { categoria: 'Moradia', descricao: 'Internet', valor: 110, dia: 15, tipo: 'expense' },
  { categoria: 'Alimentacao', descricao: 'Mercado do mes', valor: 640, dia: 3, tipo: 'expense' },
  { categoria: 'Alimentacao', descricao: 'Feira', valor: 95, dia: 17, tipo: 'expense' },
  { categoria: 'Alimentacao', descricao: 'Almoco no trabalho', valor: 210, dia: 22, tipo: 'expense' },
  { categoria: 'Transporte', descricao: 'Combustivel', valor: 320, dia: 8, tipo: 'expense' },
  { categoria: 'Transporte', descricao: 'Aplicativo de corrida', valor: 85, dia: 19, tipo: 'expense' },
  { categoria: 'Saude', descricao: 'Plano de saude', valor: 290, dia: 14, tipo: 'expense' },
  { categoria: 'Lazer', descricao: 'Streaming', valor: 55, dia: 6, tipo: 'expense' },
  { categoria: 'Lazer', descricao: 'Cinema', valor: 70, dia: 24, tipo: 'expense' },
];

// Alguns lancamentos que aparecem em um mes so, para o historico
// nao parecer gerado por copia e cola.
const EXTRAS = [
  { offset: 0, categoria: 'Lazer', descricao: 'Show', valor: 240, dia: 20, tipo: 'expense' },
  { offset: 1, categoria: 'Saude', descricao: 'Dentista', valor: 380, dia: 11, tipo: 'expense' },
  { offset: 2, categoria: 'Salario', descricao: 'Freelance', valor: 950, dia: 18, tipo: 'income' },
  { offset: 3, categoria: 'Transporte', descricao: 'Revisao do carro', valor: 620, dia: 9, tipo: 'expense' },
  { offset: 4, categoria: 'Moradia', descricao: 'Conserto da geladeira', valor: 410, dia: 21, tipo: 'expense' },
  { offset: 5, categoria: 'Salario', descricao: 'Bonus', valor: 1800, dia: 25, tipo: 'income' },
];

const MESES = 6;

async function api(path, { method = 'GET', body, token } = {}) {
  const headers = {};

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const data = response.status === 204 ? null : await response.json().catch(() => null);

  return { status: response.status, data };
}

// Varia o valor de forma deterministica: rodar o script duas vezes
// gera os mesmos numeros.
//
// Receita fixa nao varia: salario nao muda 12% de um mes para o outro,
// e um salario menor faria o mes fechar no vermelho sem motivo.
function varia(valor, semente, tipo) {
  if (tipo === 'income') {
    return valor;
  }

  const fator = 1 + (((semente * 37) % 25) - 12) / 100;
  return Math.round(valor * fator * 100) / 100;
}

function dataDe(offsetMeses, dia) {
  const hoje = new Date();
  const base = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth() - offsetMeses, 1));
  const ano = base.getUTCFullYear();
  const mes = String(base.getUTCMonth() + 1).padStart(2, '0');

  return `${ano}-${mes}-${String(dia).padStart(2, '0')}`;
}

async function main() {
  console.log(`API: ${API}\n`);

  // A conta pode ja existir de uma execucao anterior.
  const registro = await api('/auth/register', { method: 'POST', body: DEMO });
  console.log(
    registro.status === 201
      ? 'Conta de demonstracao criada.'
      : `Conta ja existia (HTTP ${registro.status}).`
  );

  const login = await api('/auth/login', {
    method: 'POST',
    body: { email: DEMO.email, password: DEMO.password },
  });

  if (login.status !== 200) {
    throw new Error(`Login falhou: HTTP ${login.status} ${JSON.stringify(login.data)}`);
  }

  const token = login.data.token;

  // Limpa o que existir, para o script poder ser rodado de novo
  // sem duplicar lancamentos.
  const existentes = await api('/transactions', { token });
  for (const transacao of existentes.data ?? []) {
    await api(`/transactions/${transacao.id}`, { method: 'DELETE', token });
  }
  if (existentes.data?.length) {
    console.log(`${existentes.data.length} transacoes antigas removidas.`);
  }

  // Cria as categorias que ainda nao existirem.
  const atuais = await api('/categories', { token });
  const porNome = new Map((atuais.data ?? []).map((c) => [c.name, c.id]));

  for (const categoria of CATEGORIES) {
    if (porNome.has(categoria.name)) {
      continue;
    }

    const criada = await api('/categories', {
      method: 'POST',
      body: { name: categoria.name },
      token,
    });

    if (criada.status === 201) {
      porNome.set(categoria.name, criada.data.id);
    }
  }
  console.log(`${porNome.size} categorias disponiveis.`);

  // Gera os lancamentos do mes atual para tras.
  const lancamentos = [];

  for (let offset = 0; offset < MESES; offset += 1) {
    for (const [indice, item] of TEMPLATE.entries()) {
      lancamentos.push({
        description: item.descricao,
        amount: varia(item.valor, offset * 13 + indice, item.tipo),
        type: item.tipo,
        date: dataDe(offset, item.dia),
        categoryId: porNome.get(item.categoria),
      });
    }
  }

  for (const extra of EXTRAS) {
    lancamentos.push({
      description: extra.descricao,
      amount: extra.valor,
      type: extra.tipo,
      date: dataDe(extra.offset, extra.dia),
      categoryId: porNome.get(extra.categoria),
    });
  }

  let criadas = 0;
  for (const lancamento of lancamentos) {
    const resposta = await api('/transactions', { method: 'POST', body: lancamento, token });

    if (resposta.status === 201) {
      criadas += 1;
    } else {
      console.error(`  falhou: ${lancamento.description} (HTTP ${resposta.status})`);
    }
  }

  console.log(`${criadas} transacoes criadas em ${MESES} meses.\n`);

  const resumo = await api('/transactions', { token });
  const total = resumo.data.reduce(
    (acc, t) => (t.type === 'income' ? acc + t.amount : acc - t.amount),
    0
  );

  console.log(`Total no periodo: R$ ${total.toFixed(2)}`);
  console.log(`Acesso: ${DEMO.email} / ${DEMO.password}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
