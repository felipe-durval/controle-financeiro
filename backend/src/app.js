const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes = require('./routes/auth-routes');
const categoryRoutes = require('./routes/category-routes');
const transactionRoutes = require('./routes/transaction-routes');
const { authLimiter, apiLimiter } = require('./middlewares/rate-limit-middleware');

const app = express();

// Em producao a aplicacao fica atras do proxy da plataforma de deploy.
// Sem isto o Express enxerga o IP do proxy, e nao o de quem chamou.
//
// O valor importa: "1" confia em um unico salto. Plataformas como o Render
// tem mais de um proxy na frente, e ai o IP escolhido e o de um balanceador
// interno que muda a cada requisicao -- o limite de tentativas nunca acumula.
//
// TRUST_PROXY aceita:
//   "true"  -> confia na cadeia inteira e usa o primeiro IP do X-Forwarded-For
//   um numero -> confia nessa quantidade exata de saltos
//
// Contrapartida do "true": o primeiro IP do cabecalho e enviado pelo cliente,
// entao alguem pode forjar IPs diferentes para escapar do limite. Em troca,
// o limite passa a funcionar para o uso normal. Preferir o numero exato de
// saltos quando a plataforma documentar quantos sao.
const trustProxy = process.env.TRUST_PROXY;

if (trustProxy === 'true') {
  app.set('trust proxy', true);
} else if (trustProxy && Number.isInteger(Number(trustProxy))) {
  app.set('trust proxy', Number(trustProxy));
}

// Adiciona cabecalhos de seguranca (X-Content-Type-Options, Referrer-Policy,
// Strict-Transport-Security, entre outros) e remove o X-Powered-By,
// que anunciava para qualquer um que a API roda em Express.
app.use(
  helmet({
    // Por padrao o helmet manda Cross-Origin-Resource-Policy: same-origin,
    // e o navegador passa a bloquear a leitura das respostas por um site
    // de outra origem -- exatamente o que o nosso frontend faz.
    // Quem controla quais origens podem chamar a API e o CORS abaixo.
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    // A API so devolve JSON; a politica de conteudo abaixo protege
    // paginas HTML, que nao servimos aqui.
    contentSecurityPolicy: false,
  })
);

// Por padrao o navegador bloqueia requisicoes entre origens diferentes
// (o frontend em :5173 chamando a API em :3000). O CORS libera apenas
// as origens que informamos, nao todas.
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim());

app.use(cors({ origin: allowedOrigins }));

// Middleware que le o corpo JSON da requisicao e coloca em req.body.
// O limite de tamanho evita que alguem envie um corpo gigante
// so para consumir memoria do servidor.
app.use(express.json({ limit: '100kb' }));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// O limite mais apertado vem antes: as rotas de senha sao o alvo obvio.
app.use('/auth/login', authLimiter);
app.use('/auth/register', authLimiter);

app.use(apiLimiter);

app.use('/auth', authRoutes);
app.use('/categories', categoryRoutes);
app.use('/transactions', transactionRoutes);

// Rota nao encontrada.
app.use((req, res) => {
  res.status(404).json({ error: 'Rota nao encontrada.' });
});

// Tratador de erros global: middleware com 4 parametros.
// Sem ele, o Express responde HTML com stack trace, expondo caminhos internos.
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON invalido no corpo da requisicao.' });
  }

  // 413 = corpo maior que o limite configurado no express.json().
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Corpo da requisicao muito grande.' });
  }

  console.error('Erro nao tratado:', err);
  return res.status(500).json({ error: 'Erro interno do servidor.' });
});

// Exporta o app sem subir o servidor: assim os testes podem usa-lo
// sem ocupar uma porta de rede.
module.exports = app;
