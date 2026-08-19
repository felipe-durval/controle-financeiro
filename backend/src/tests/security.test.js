const request = require('supertest');

const app = require('../app');
const prisma = require('../prisma-client');

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Cabecalhos de seguranca', () => {
  it('nao anuncia que a API roda em Express', async () => {
    const response = await request(app).get('/health');

    expect(response.headers['x-powered-by']).toBeUndefined();
  });

  it('impede o navegador de adivinhar o tipo do conteudo', async () => {
    const response = await request(app).get('/health');

    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });

  it('exige HTTPS em visitas futuras', async () => {
    const response = await request(app).get('/health');

    expect(response.headers['strict-transport-security']).toBeDefined();
  });

  it('limita o que vaza no cabecalho Referer', async () => {
    const response = await request(app).get('/health');

    expect(response.headers['referrer-policy']).toBeDefined();
  });

  it('impede que a API seja embutida em um iframe', async () => {
    const response = await request(app).get('/health');

    expect(response.headers['x-frame-options']).toBeDefined();
  });

  it('permite que o frontend, em outra origem, leia as respostas', async () => {
    const response = await request(app).get('/health');

    // Com same-origin (o padrao do helmet) o navegador bloqueia a leitura
    // da resposta pelo frontend, que roda em outra porta. Quem decide
    // quais origens podem chamar a API e o CORS, nao este cabecalho.
    expect(response.headers['cross-origin-resource-policy']).toBe('cross-origin');
  });
});

describe('Limite de tamanho do corpo', () => {
  it('recusa um corpo muito grande', async () => {
    const gigante = 'a'.repeat(200 * 1024);

    const response = await request(app)
      .post('/auth/register')
      .set('Content-Type', 'application/json')
      .send({ name: gigante, email: 'a@b.com', password: 'senhaSegura123' });

    // 413 = payload muito grande.
    expect(response.status).toBe(413);
  });
});

describe('Nao vazamento de informacao', () => {
  beforeEach(async () => {
    await prisma.transaction.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();
  });

  it('nao devolve stack trace quando o JSON e invalido', async () => {
    const response = await request(app)
      .post('/auth/register')
      .set('Content-Type', 'application/json')
      .send('{isso nao e json}');

    expect(response.status).toBe(400);
    expect(response.text).not.toMatch(/node_modules|at Object|SyntaxError/);
  });

  it('nao expoe caminhos do servidor em rota inexistente', async () => {
    const response = await request(app).get('/rota-que-nao-existe');

    expect(response.status).toBe(404);
    expect(response.text).not.toMatch(/node_modules|C:\\|\/home\//);
  });

  it('nunca inclui o hash da senha em nenhuma resposta de autenticacao', async () => {
    const dados = { name: 'Felipe', email: 'felipe@exemplo.com', password: 'senhaSegura123' };

    const registro = await request(app).post('/auth/register').send(dados);
    const login = await request(app)
      .post('/auth/login')
      .send({ email: dados.email, password: dados.password });
    const perfil = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${login.body.token}`);

    for (const response of [registro, login, perfil]) {
      expect(response.text).not.toContain('$2b$');
      expect(response.text).not.toContain(dados.password);
    }
  });
});
