const path = require('node:path');
const { execSync } = require('node:child_process');

// Roda UMA vez, antes de toda a suite de testes.
// Garante que o banco de testes existe e esta com as tabelas atualizadas.
module.exports = async () => {
  const backendDir = path.resolve(__dirname, '../..');

  require('dotenv').config({
    path: path.resolve(backendDir, '.env.test'),
    override: true,
    quiet: true,
  });

  execSync('npx prisma migrate deploy', {
    cwd: backendDir,
    env: process.env,
    stdio: 'pipe',
  });
};
