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

// Dados validos usados como base; cada teste sobrescreve so o que precisa.
function validPayload(categoryId, overrides = {}) {
  return {
    description: 'Almoco',
    amount: 32.5,
    type: 'expense',
    date: '2026-08-19',
    categoryId,
    ...overrides,
  };
}

let token;
let categoryId;

beforeEach(async () => {
  await prisma.transaction.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  token = await createUserAndLogin('felipe@exemplo.com');
  categoryId = await createCategory(token, 'Alimentacao');
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Protecao das rotas de transacao', () => {
  it('bloqueia todas as rotas sem token', async () => {
    const semToken = [
      await request(app).get('/transactions'),
      await request(app).post('/transactions').send(validPayload(categoryId)),
      await request(app).put('/transactions/1').send(validPayload(categoryId)),
      await request(app).delete('/transactions/1'),
    ];

    for (const response of semToken) {
      expect(response.status).toBe(401);
    }
  });
});

describe('POST /transactions', () => {
  it('cria a transacao e devolve 201 com a categoria junto', async () => {
    const response = await request(app)
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send(validPayload(categoryId));

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      description: 'Almoco',
      amount: 32.5,
      type: 'expense',
    });
    expect(response.body.category).toEqual({ id: categoryId, name: 'Alimentacao' });
  });

  it('aceita o tipo income', async () => {
    const response = await request(app)
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send(validPayload(categoryId, { description: 'Salario', type: 'income', amount: 3000 }));

    expect(response.status).toBe(201);
    expect(response.body.type).toBe('income');
  });

  it('recusa corpo vazio com 400 listando todos os erros', async () => {
    const response = await request(app)
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.errors).toHaveLength(5);
  });

  it('recusa valor zero ou negativo', async () => {
    for (const amount of [0, -10]) {
      const response = await request(app)
        .post('/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send(validPayload(categoryId, { amount }));

      expect(response.status).toBe(400);
    }
  });

  it('recusa valor enviado como texto', async () => {
    const response = await request(app)
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send(validPayload(categoryId, { amount: '32.5' }));

    expect(response.status).toBe(400);
  });

  it('recusa tipo diferente de income/expense', async () => {
    const response = await request(app)
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send(validPayload(categoryId, { type: 'transferencia' }));

    expect(response.status).toBe(400);
  });

  it('recusa data invalida', async () => {
    const response = await request(app)
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send(validPayload(categoryId, { date: '19/08/2026' }));

    expect(response.status).toBe(400);
  });

  it('recusa categoria inexistente com 404', async () => {
    const response = await request(app)
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send(validPayload(99999));

    expect(response.status).toBe(404);
  });

  it('NAO permite usar categoria de outro usuario', async () => {
    const outroToken = await createUserAndLogin('ana@exemplo.com');
    const categoriaDaAna = await createCategory(outroToken, 'Lazer da Ana');

    const response = await request(app)
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send(validPayload(categoriaDaAna));

    expect(response.status).toBe(404);
    expect(await prisma.transaction.count()).toBe(0);
  });

  it('ignora userId enviado no corpo e usa o do token', async () => {
    const outroToken = await createUserAndLogin('ana@exemplo.com');
    const ana = await prisma.user.findUnique({ where: { email: 'ana@exemplo.com' } });

    await request(app)
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send(validPayload(categoryId, { userId: ana.id }));

    const daAna = await request(app)
      .get('/transactions')
      .set('Authorization', `Bearer ${outroToken}`);

    expect(daAna.body).toHaveLength(0);
  });
});

describe('GET /transactions', () => {
  it('devolve lista vazia quando nao ha transacoes', async () => {
    const response = await request(app)
      .get('/transactions')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('devolve as transacoes da mais recente para a mais antiga', async () => {
    for (const date of ['2026-08-10', '2026-08-20', '2026-08-15']) {
      await request(app)
        .post('/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send(validPayload(categoryId, { description: date, date }));
    }

    const response = await request(app)
      .get('/transactions')
      .set('Authorization', `Bearer ${token}`);

    expect(response.body.map((t) => t.description)).toEqual([
      '2026-08-20',
      '2026-08-15',
      '2026-08-10',
    ]);
  });

  it('nunca devolve transacoes de outro usuario', async () => {
    await request(app)
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send(validPayload(categoryId));

    const outroToken = await createUserAndLogin('ana@exemplo.com');

    const response = await request(app)
      .get('/transactions')
      .set('Authorization', `Bearer ${outroToken}`);

    expect(response.body).toHaveLength(0);
  });
});

describe('PUT /transactions/:id', () => {
  let transactionId;

  beforeEach(async () => {
    const created = await request(app)
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send(validPayload(categoryId));

    transactionId = created.body.id;
  });

  it('atualiza a transacao e devolve 200', async () => {
    const response = await request(app)
      .put(`/transactions/${transactionId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(validPayload(categoryId, { description: 'Jantar', amount: 80 }));

    expect(response.status).toBe(200);
    expect(response.body.description).toBe('Jantar');
    expect(response.body.amount).toBe(80);
  });

  it('permite trocar a categoria por outra do proprio usuario', async () => {
    const outraCategoria = await createCategory(token, 'Transporte');

    const response = await request(app)
      .put(`/transactions/${transactionId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(validPayload(outraCategoria));

    expect(response.status).toBe(200);
    expect(response.body.category.name).toBe('Transporte');
  });

  it('NAO permite mover a transacao para categoria de outro usuario', async () => {
    const outroToken = await createUserAndLogin('ana@exemplo.com');
    const categoriaDaAna = await createCategory(outroToken, 'Lazer da Ana');

    const response = await request(app)
      .put(`/transactions/${transactionId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(validPayload(categoriaDaAna));

    expect(response.status).toBe(404);
  });

  it('devolve 404 para transacao inexistente', async () => {
    const response = await request(app)
      .put('/transactions/99999')
      .set('Authorization', `Bearer ${token}`)
      .send(validPayload(categoryId));

    expect(response.status).toBe(404);
  });

  it('devolve 400 para id nao numerico', async () => {
    const response = await request(app)
      .put('/transactions/abc')
      .set('Authorization', `Bearer ${token}`)
      .send(validPayload(categoryId));

    expect(response.status).toBe(400);
  });

  it('NAO permite editar transacao de outro usuario', async () => {
    const outroToken = await createUserAndLogin('ana@exemplo.com');
    const categoriaDaAna = await createCategory(outroToken, 'Lazer da Ana');

    const response = await request(app)
      .put(`/transactions/${transactionId}`)
      .set('Authorization', `Bearer ${outroToken}`)
      .send(validPayload(categoriaDaAna, { description: 'Invadida' }));

    expect(response.status).toBe(404);

    const original = await prisma.transaction.findUnique({ where: { id: transactionId } });
    expect(original.description).toBe('Almoco');
  });
});

describe('DELETE /transactions/:id', () => {
  let transactionId;

  beforeEach(async () => {
    const created = await request(app)
      .post('/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send(validPayload(categoryId));

    transactionId = created.body.id;
  });

  it('exclui a transacao e devolve 204', async () => {
    const response = await request(app)
      .delete(`/transactions/${transactionId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);
    expect(await prisma.transaction.count()).toBe(0);
  });

  it('devolve 404 para transacao inexistente', async () => {
    const response = await request(app)
      .delete('/transactions/99999')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  it('NAO permite excluir transacao de outro usuario', async () => {
    const outroToken = await createUserAndLogin('ana@exemplo.com');

    const response = await request(app)
      .delete(`/transactions/${transactionId}`)
      .set('Authorization', `Bearer ${outroToken}`);

    expect(response.status).toBe(404);
    expect(await prisma.transaction.count()).toBe(1);
  });
});
