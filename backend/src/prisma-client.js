const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');

// O adapter e a ponte entre o Prisma e o driver do banco.
// Ao migrar para PostgreSQL, so esta parte muda (@prisma/adapter-pg).
const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL });

// Uma unica instancia compartilhada por toda a aplicacao:
// cada PrismaClient abre seu proprio pool de conexoes com o banco.
const prisma = new PrismaClient({ adapter });

module.exports = prisma;
