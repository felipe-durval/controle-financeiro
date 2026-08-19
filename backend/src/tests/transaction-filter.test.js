const request = require('supertest');

const app = require('../app');
const prisma = require('../prisma-client');

async function createUserAndLogin(email) {
  await request(app).post('/auth/register').send({
    name: 'Usuario',
    email,
    password: 'senhaSegura123',
  });

  const login = await request(app)
    .post('/auth/login')
    .send({ email, password: 'senhaSegura123' });

  return login.body.token;
}

async function createCategory(token, name) {
  const response = await request(app)
    .post('/categories')
    .set('Authorization', `Bearer ${token}`)
    .send({ name });

  return response.body.id;
}

async function createTransaction(token, { description, date, categoryId, type = 'expense', amount = 10 }) {
  return request(app)
    .post('/transactions')
    .set('Authorization', `Bearer ${token}`)
    .send({ description, amount, type, date, categoryId });
}

function listar(token, query = '') {
  return request(app)
    .get(`/transactions${query}`)
    .set('Authorization', `Bearer ${token}`);
}

let token;
let alimentacao;
let transporte;

// Cenario compartilhado: 5 transacoes espalhadas em 3 meses e 2 categorias,
// incluindo os dias de virada de mes (01 e ultimo dia).
beforeEach(async () => {
  await prisma.transaction.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  token = await createUserAndLogin('felipe@exemplo.com');
  alimentacao = await createCategory(token, 'Alimentacao');
  transporte = await createCategory(token, 'Transporte');

  await createTransaction(token, { description: 'Julho fim', date: '2026-07-31', categoryId: alimentacao });
  await createTransaction(token, { description: 'Agosto inicio', date: '2026-08-01', categoryId: alimentacao });
  await createTransaction(token, { description: 'Agosto meio', date: '2026-08-15', categoryId: transporte });
  await createTransaction(token, { description: 'Agosto fim', date: '2026-08-31', categoryId: alimentacao });
  await createTransaction(token, { description: 'Setembro inicio', date: '2026-09-01', categoryId: transporte });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('GET /transactions sem filtro', () => {
  it('devolve todas as transacoes do usuario', async () => {
    const response = await listar(token);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(5);
  });
});

describe('Filtro por mes (?month=)', () => {
  it('devolve apenas as transacoes do mes pedido', async () => {
    const response = await listar(token, '?month=2026-08');

    expect(response.status).toBe(200);
    expect(response.body.map((t) => t.description).sort()).toEqual([
      'Agosto fim',
      'Agosto inicio',
      'Agosto meio',
    ]);
  });

  it('inclui o primeiro e o ultimo dia do mes', async () => {
    const response = await listar(token, '?month=2026-08');
    const descricoes = response.body.map((t) => t.description);

    expect(descricoes).toContain('Agosto inicio');
    expect(descricoes).toContain('Agosto fim');
  });

  it('nao vaza transacoes do mes anterior nem do seguinte', async () => {
    const response = await listar(token, '?month=2026-08');
    const descricoes = response.body.map((t) => t.description);

    expect(descricoes).not.toContain('Julho fim');
    expect(descricoes).not.toContain('Setembro inicio');
  });

  it('funciona em fevereiro de ano bissexto', async () => {
    await createTransaction(token, { description: 'Bissexto', date: '2028-02-29', categoryId: alimentacao });

    const response = await listar(token, '?month=2028-02');

    expect(response.body).toHaveLength(1);
    expect(response.body[0].description).toBe('Bissexto');
  });

  it('funciona na virada de ano (dezembro)', async () => {
    await createTransaction(token, { description: 'Reveillon', date: '2026-12-31', categoryId: alimentacao });
    await createTransaction(token, { description: 'Ano novo', date: '2027-01-01', categoryId: alimentacao });

    const response = await listar(token, '?month=2026-12');

    expect(response.body).toHaveLength(1);
    expect(response.body[0].description).toBe('Reveillon');
  });

  it('devolve lista vazia para mes sem transacoes', async () => {
    const response = await listar(token, '?month=2026-01');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('recusa mes em formato invalido com 400', async () => {
    for (const month of ['2026', '08-2026', '2026/08', 'agosto', '']) {
      const response = await listar(token, `?month=${month}`);
      expect(response.status).toBe(400);
    }
  });

  it('recusa mes fora do intervalo 01-12 com 400', async () => {
    for (const month of ['2026-00', '2026-13', '2026-99']) {
      const response = await listar(token, `?month=${month}`);
      expect(response.status).toBe(400);
    }
  });
});

describe('Filtro por categoria (?categoryId=)', () => {
  it('devolve apenas as transacoes da categoria pedida', async () => {
    const response = await listar(token, `?categoryId=${transporte}`);

    expect(response.status).toBe(200);
    expect(response.body.map((t) => t.description).sort()).toEqual([
      'Agosto meio',
      'Setembro inicio',
    ]);
  });

  it('devolve lista vazia para categoria sem transacoes', async () => {
    const vazia = await createCategory(token, 'Lazer');

    const response = await listar(token, `?categoryId=${vazia}`);

    expect(response.body).toEqual([]);
  });

  it('recusa id de categoria invalido com 400', async () => {
    for (const id of ['abc', '0', '-5', '1.5']) {
      const response = await listar(token, `?categoryId=${id}`);
      expect(response.status).toBe(400);
    }
  });

  it('devolve vazio ao filtrar por categoria de outro usuario', async () => {
    const outroToken = await createUserAndLogin('ana@exemplo.com');
    const categoriaDaAna = await createCategory(outroToken, 'Lazer da Ana');

    await createTransaction(outroToken, {
      description: 'Da Ana',
      date: '2026-08-10',
      categoryId: categoriaDaAna,
    });

    const response = await listar(token, `?categoryId=${categoriaDaAna}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });
});

describe('Filtros combinados', () => {
  it('aplica mes E categoria ao mesmo tempo', async () => {
    const response = await listar(token, `?month=2026-08&categoryId=${alimentacao}`);

    expect(response.status).toBe(200);
    expect(response.body.map((t) => t.description).sort()).toEqual([
      'Agosto fim',
      'Agosto inicio',
    ]);
  });

  it('devolve vazio quando a combinacao nao tem resultado', async () => {
    const response = await listar(token, `?month=2026-07&categoryId=${transporte}`);

    expect(response.body).toEqual([]);
  });

  it('mantem a ordenacao da mais recente para a mais antiga', async () => {
    const response = await listar(token, '?month=2026-08');

    expect(response.body.map((t) => t.description)).toEqual([
      'Agosto fim',
      'Agosto meio',
      'Agosto inicio',
    ]);
  });

  it('ignora parametros desconhecidos', async () => {
    const response = await listar(token, '?ordenar=preco&pagina=2');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(5);
  });
});
