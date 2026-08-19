const express = require('express');
const request = require('supertest');

const { createLimiter } = require('../middlewares/rate-limit-middleware');

// O limitador fica desligado durante os testes, senao os outros 80+ casos
// esbarrariam nele. Para provar que a configuracao funciona, montamos aqui
// um app minimo com a mesma fabrica e um limite baixo.
function buildApp({ limit, skipSuccessfulRequests = false }) {
  const limiter = createLimiter({
    limit,
    message: 'Muitas tentativas. Tente novamente em alguns minutos.',
    skipSuccessfulRequests,
    // Anula o desligamento automatico do ambiente de teste.
    skip: () => false,
  });

  const app = express();
  app.use(express.json());
  app.use(limiter);
  app.post('/tentar', (req, res) => {
    if (req.body.senha === 'certa') {
      return res.status(200).json({ ok: true });
    }

    return res.status(401).json({ error: 'Email ou senha invalidos.' });
  });

  return app;
}

describe('Limite de tentativas', () => {
  it('bloqueia com 429 depois de estourar o limite', async () => {
    const app = buildApp({ limit: 3 });

    const codes = [];
    for (let i = 0; i < 5; i += 1) {
      const response = await request(app).post('/tentar').send({ senha: 'errada' });
      codes.push(response.status);
    }

    expect(codes).toEqual([401, 401, 401, 429, 429]);
  });

  it('explica o bloqueio em vez de devolver uma resposta vazia', async () => {
    const app = buildApp({ limit: 1 });

    await request(app).post('/tentar').send({ senha: 'errada' });
    const bloqueado = await request(app).post('/tentar').send({ senha: 'errada' });

    expect(bloqueado.status).toBe(429);
    expect(bloqueado.body.error).toMatch(/muitas tentativas/i);
  });

  it('nao gasta cota de quem acerta a senha', async () => {
    const app = buildApp({ limit: 2, skipSuccessfulRequests: true });

    // Dez logins bem-sucedidos nao podem esgotar um limite de 2.
    for (let i = 0; i < 10; i += 1) {
      const response = await request(app).post('/tentar').send({ senha: 'certa' });
      expect(response.status).toBe(200);
    }
  });

  it('informa o limite nos cabecalhos padrao', async () => {
    const app = buildApp({ limit: 5 });

    const response = await request(app).post('/tentar').send({ senha: 'errada' });

    expect(response.headers['ratelimit-limit'] || response.headers.ratelimit).toBeDefined();
  });
});
