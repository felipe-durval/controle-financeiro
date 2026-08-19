const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

// O adapter e a ponte entre o Prisma e o driver do banco.
// Trocar de SQLite para PostgreSQL mudou apenas esta linha:
// nenhuma query da aplicacao precisou ser reescrita.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

// Uma unica instancia compartilhada por toda a aplicacao:
// cada PrismaClient abre seu proprio pool de conexoes com o banco.
const prisma = new PrismaClient({ adapter });

module.exports = prisma;
