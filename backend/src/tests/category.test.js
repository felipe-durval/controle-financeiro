const request = require('supertest');

const app = require('../app');
const prisma = require('../prisma-client');

// Cria um usuario e devolve o token dele, para os testes que precisam
// de duas contas diferentes (verificacao de isolamento).
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

let token;

beforeEach(async () => {
  await prisma.transaction.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  token = await createUserAndLogin('felipe@exemplo.com');
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Protecao das rotas de categoria', () => {
  it('bloqueia todas as rotas sem token', async () => {
    const semToken = [
      await request(app).get('/categories'),
      await request(app).post('/categories').send({ name: 'Lazer' }),
      await request(app).put('/categories/1').send({ name: 'Lazer' }),
      await request(app).delete('/categories/1'),
    ];

    for (const response of semToken) {
      expect(response.status).toBe(401);
    }
  });
});

describe('POST /categories', () => {
  it('cria a categoria e devolve 201', async () => {
    const response = await request(app)
      .post('/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Alimentacao' });

    expect(response.status).toBe(201);
    expect(response.body.name).toBe('Alimentacao');
    expect(response.body.id).toEqual(expect.any(Number));
  });

  it('remove espacos em volta do nome', async () => {
    const response = await request(app)
      .post('/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '  Transporte  ' });

    expect(response.body.name).toBe('Transporte');
  });

  it('recusa nome vazio com 400', async () => {
    const response = await request(app)
      .post('/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '   ' });

    expect(response.status).toBe(400);
  });

  it('recusa nome duplicado do mesmo usuario com 409', async () => {
    await request(app)
      .post('/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Lazer' });

    const response = await request(app)
      .post('/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Lazer' });

    expect(response.status).toBe(409);
  });

  it('permite que usuarios diferentes tenham categorias de mesmo nome', async () => {
    await request(app)
      .post('/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Lazer' });

    const outroToken = await createUserAndLogin('ana@exemplo.com');

    const response = await request(app)
      .post('/categories')
      .set('Authorization', `Bearer ${outroToken}`)
      .send({ name: 'Lazer' });

    expect(response.status).toBe(201);
  });

  it('ignora userId enviado no corpo e usa o do token', async () => {
    const outroToken = await createUserAndLogin('ana@exemplo.com');
    const ana = await prisma.user.findUnique({ where: { email: 'ana@exemplo.com' } });

    // Tentativa de criar uma categoria na conta da Ana usando o token do Felipe.
    const response = await request(app)
      .post('/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Invasao', userId: ana.id });

    expect(response.status).toBe(201);

    // A categoria deve ter ficado com o Felipe, nao com a Ana.
    const daAna = await request(app)
      .get('/categories')
      .set('Authorization', `Bearer ${outroToken}`);

    expect(daAna.body).toHaveLength(0);
  });
});

describe('GET /categories', () => {
  it('devolve lista vazia quando nao ha categorias', async () => {
    const response = await request(app)
      .get('/categories')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it('devolve as categorias em ordem alfabetica', async () => {
    for (const name of ['Transporte', 'Alimentacao', 'Lazer']) {
      await request(app)
        .post('/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name });
    }

    const response = await request(app)
      .get('/categories')
      .set('Authorization', `Bearer ${token}`);

    expect(response.body.map((c) => c.name)).toEqual([
      'Alimentacao',
      'Lazer',
      'Transporte',
    ]);
  });

  it('nunca devolve categorias de outro usuario', async () => {
    await request(app)
      .post('/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Do Felipe' });

    const outroToken = await createUserAndLogin('ana@exemplo.com');

    const response = await request(app)
      .get('/categories')
      .set('Authorization', `Bearer ${outroToken}`);

    expect(response.body).toHaveLength(0);
  });
});

describe('PUT /categories/:id', () => {
  let categoryId;

  beforeEach(async () => {
    const created = await request(app)
      .post('/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Alimentacao' });

    categoryId = created.body.id;
  });

  it('atualiza o nome e devolve 200', async () => {
    const response = await request(app)
      .put(`/categories/${categoryId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Mercado' });

    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Mercado');
  });

  it('devolve 404 para categoria inexistente', async () => {
    const response = await request(app)
      .put('/categories/99999')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Qualquer' });

    expect(response.status).toBe(404);
  });

  it('devolve 400 para id nao numerico', async () => {
    const response = await request(app)
      .put('/categories/abc')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Qualquer' });

    expect(response.status).toBe(400);
  });

  it('NAO permite editar categoria de outro usuario', async () => {
    const outroToken = await createUserAndLogin('ana@exemplo.com');

    const response = await request(app)
      .put(`/categories/${categoryId}`)
      .set('Authorization', `Bearer ${outroToken}`)
      .send({ name: 'Invadida' });

    expect(response.status).toBe(404);

    // Confirma que o nome original nao mudou.
    const original = await prisma.category.findUnique({ where: { id: categoryId } });
    expect(original.name).toBe('Alimentacao');
  });
});

describe('DELETE /categories/:id', () => {
  let categoryId;

  beforeEach(async () => {
    const created = await request(app)
      .post('/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Alimentacao' });

    categoryId = created.body.id;
  });

  it('exclui a categoria e devolve 204', async () => {
    const response = await request(app)
      .delete(`/categories/${categoryId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);

    const restantes = await prisma.category.findMany();
    expect(restantes).toHaveLength(0);
  });

  it('devolve 404 para categoria inexistente', async () => {
    const response = await request(app)
      .delete('/categories/99999')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  it('NAO permite excluir categoria de outro usuario', async () => {
    const outroToken = await createUserAndLogin('ana@exemplo.com');

    const response = await request(app)
      .delete(`/categories/${categoryId}`)
      .set('Authorization', `Bearer ${outroToken}`);

    expect(response.status).toBe(404);

    const aindaExiste = await prisma.category.findUnique({ where: { id: categoryId } });
    expect(aindaExiste).not.toBeNull();
  });

  it('recusa com 409 quando a categoria tem transacoes', async () => {
    const user = await prisma.user.findUnique({
      where: { email: 'felipe@exemplo.com' },
    });

    await prisma.transaction.create({
      data: {
        description: 'Almoco',
        amount: 32.5,
        type: 'expense',
        date: new Date('2026-08-19'),
        userId: user.id,
        categoryId,
      },
    });

    const response = await request(app)
      .delete(`/categories/${categoryId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(409);

    const aindaExiste = await prisma.category.findUnique({ where: { id: categoryId } });
    expect(aindaExiste).not.toBeNull();
  });
});
