require('dotenv').config({ quiet: true });

const MIN_SECRET_LENGTH = 32;

// Falha logo na inicializacao se faltar configuracao essencial,
// em vez de quebrar so quando alguem tentar fazer login.
function validateEnvironment() {
  const errors = [];

  if (!process.env.DATABASE_URL) {
    errors.push('DATABASE_URL nao esta definida.');
  }

  if (!process.env.JWT_SECRET) {
    errors.push('JWT_SECRET nao esta definida.');
  } else if (process.env.JWT_SECRET.length < MIN_SECRET_LENGTH) {
    // Um segredo curto pode ser descoberto por forca bruta, e ai
    // qualquer pessoa consegue assinar tokens validos.
    errors.push(
      `JWT_SECRET tem ${process.env.JWT_SECRET.length} caracteres; use pelo menos ${MIN_SECRET_LENGTH}.`
    );
  }

  if (process.env.NODE_ENV === 'production' && !process.env.CORS_ORIGIN) {
    errors.push('CORS_ORIGIN precisa ser definida em producao.');
  }

  return errors;
}

const errors = validateEnvironment();

if (errors.length > 0) {
  console.error('Configuracao invalida:');
  for (const error of errors) {
    console.error(`  - ${error}`);
  }
  console.error('Veja o .env.example.');
  process.exit(1);
}

const app = require('./src/app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
