const express = require('express');
const authRoutes = require('./routes/auth-routes');

const app = express();

// Middleware que le o corpo JSON da requisicao e coloca em req.body.
// Sem ele, req.body fica indefinido em POST/PUT.
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/auth', authRoutes);

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

  console.error('Erro nao tratado:', err);
  return res.status(500).json({ error: 'Erro interno do servidor.' });
});

// Exporta o app sem subir o servidor: assim os testes podem usa-lo
// sem ocupar uma porta de rede.
module.exports = app;
