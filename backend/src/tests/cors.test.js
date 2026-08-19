const request = require('supertest');

const app = require('../app');
const prisma = require('../prisma-client');

afterAll(async () => {
  await prisma.$disconnect();
});

describe('CORS', () => {
  it('autoriza a origem do frontend', async () => {
    const response = await request(app)
      .get('/health')
      .set('Origin', 'http://localhost:5173');

    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  it('nao autoriza uma origem desconhecida', async () => {
    const response = await request(app)
      .get('/health')
      .set('Origin', 'http://site-malicioso.com');

    // Sem o cabecalho de liberacao, o navegador bloqueia a leitura da resposta.
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('responde a requisicao de verificacao (preflight) do navegador', async () => {
    // Antes de um POST com JSON, o navegador manda um OPTIONS perguntando
    // se aquela origem e aquele metodo sao permitidos.
    const response = await request(app)
      .options('/auth/login')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'content-type');

    expect(response.status).toBeLessThan(300);
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  it('permite o header Authorization usado nas rotas protegidas', async () => {
    const response = await request(app)
      .options('/transactions')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'GET')
      .set('Access-Control-Request-Headers', 'authorization');

    expect(response.headers['access-control-allow-headers'].toLowerCase()).toContain(
      'authorization'
    );
  });
});
