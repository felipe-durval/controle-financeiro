const rateLimit = require('express-rate-limit');

const FIFTEEN_MINUTES = 15 * 60 * 1000;

// Nos testes o limite atrapalharia: varios casos fazem dezenas de
// requisicoes seguidas de proposito.
// Atencao: nao use limit: 0 para desligar -- nesta biblioteca isso
// bloqueia TODAS as requisicoes. O jeito correto e a opcao skip.
const isTest = process.env.NODE_ENV === 'test';

// skip e um parametro para os testes conseguirem ligar o limitador
// mesmo rodando em NODE_ENV=test.
function createLimiter({ limit, message, skipSuccessfulRequests = false, skip = () => isTest }) {
  return rateLimit({
    windowMs: FIFTEEN_MINUTES,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skipSuccessfulRequests,
    skip,
    message: { error: message },
  });
}

// Limite apertado para as rotas que recebem senha.
// Sem isto, alguem pode tentar milhares de senhas ate acertar.
const authLimiter = createLimiter({
  limit: Number(process.env.AUTH_RATE_LIMIT) || 10,
  message: 'Muitas tentativas. Tente novamente em alguns minutos.',
  // Conta apenas tentativas que falharam: quem acerta a senha
  // nao deve gastar cota.
  skipSuccessfulRequests: true,
});

// Limite mais folgado para o resto da API, apenas para conter abuso.
const apiLimiter = createLimiter({
  limit: Number(process.env.API_RATE_LIMIT) || 300,
  message: 'Muitas requisicoes. Tente novamente em alguns minutos.',
});

module.exports = { authLimiter, apiLimiter, createLimiter };
