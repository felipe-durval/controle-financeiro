// Roda antes de cada arquivo de teste.
// O override garante que o .env.test vence sobre qualquer variavel ja definida,
// para os testes nunca apontarem para o banco de desenvolvimento.
const path = require('node:path');

require('dotenv').config({
  path: path.resolve(__dirname, '../../.env.test'),
  override: true,
  quiet: true,
});
