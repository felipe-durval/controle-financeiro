const express = require('express');
const request = require('supertest');

// Reproduz a decisao de confianca no proxy que o app.js faz, para
// travar o comportamento sem precisar recarregar o app inteiro.
function buildApp(trustProxy) {
  const app = express();

  if (trustProxy === 'true') {
    app.set('trust proxy', true);
  } else if (trustProxy && Number.isInteger(Number(trustProxy))) {
    app.set('trust proxy', Number(trustProxy));
  }

  app.get('/ip', (req, res) => res.json({ ip: req.ip }));

  return app;
}

// Simula a cadeia de proxies de uma plataforma de deploy:
// cliente real -> balanceador que muda -> proxy da borda
const CLIENTE = '203.0.113.10';

describe('Confianca no proxy', () => {
  it('sem configuracao, ignora o X-Forwarded-For', async () => {
    const response = await request(buildApp(undefined))
      .get('/ip')
      .set('X-Forwarded-For', CLIENTE);

    expect(response.body.ip).not.toBe(CLIENTE);
  });

  it('com "true", usa o IP do cliente mesmo com varios saltos', async () => {
    const response = await request(buildApp('true'))
      .get('/ip')
      .set('X-Forwarded-For', `${CLIENTE}, 10.0.0.7, 10.0.0.9`);

    expect(response.body.ip).toBe(CLIENTE);
  });

  it('o IP nao muda quando so os saltos internos mudam', async () => {
    const app = buildApp('true');

    // Mesma pessoa, duas requisicoes que passaram por balanceadores
    // internos diferentes -- o que acontece de verdade no Render.
    const primeira = await request(app)
      .get('/ip')
      .set('X-Forwarded-For', `${CLIENTE}, 10.0.0.7, 10.0.0.9`);

    const segunda = await request(app)
      .get('/ip')
      .set('X-Forwarded-For', `${CLIENTE}, 10.0.4.2, 10.0.8.1`);

    // Se estes divergissem, cada requisicao cairia em um balde diferente
    // e o limite de tentativas nunca acumularia.
    expect(primeira.body.ip).toBe(segunda.body.ip);
    expect(primeira.body.ip).toBe(CLIENTE);
  });

  // O Express conta os saltos de tras para frente, a partir do servidor.
  // Com a cadeia "cliente, A, B" ele anda da direita para a esquerda:
  //   1 salto  -> B      2 saltos -> A      3 saltos -> cliente
  it('com "1", pega o proxy mais proximo, nao o cliente', async () => {
    const response = await request(buildApp('1'))
      .get('/ip')
      .set('X-Forwarded-For', `${CLIENTE}, 10.0.0.7, 10.0.0.9`);

    // E exatamente por isso que um unico salto nao serve no Render:
    // este IP e de um balanceador interno, que muda a cada requisicao.
    expect(response.body.ip).toBe('10.0.0.9');
    expect(response.body.ip).not.toBe(CLIENTE);
  });

  it('aceita numero de saltos configuravel', async () => {
    const response = await request(buildApp('3'))
      .get('/ip')
      .set('X-Forwarded-For', `${CLIENTE}, 10.0.0.7, 10.0.0.9`);

    expect(response.body.ip).toBe(CLIENTE);
  });
});
