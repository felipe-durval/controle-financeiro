require('dotenv').config({ quiet: true });

// Falha logo na inicializacao se faltar configuracao essencial,
// em vez de quebrar so quando alguem tentar fazer login.
if (!process.env.JWT_SECRET) {
  console.error('Erro: a variavel JWT_SECRET nao esta definida. Veja o .env.example.');
  process.exit(1);
}

const app = require('./src/app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
