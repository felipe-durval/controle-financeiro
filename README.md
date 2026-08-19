# Controle Financeiro

Sistema de controle financeiro pessoal, feito como projeto de portfólio.

## Funcionalidades

- Cadastro e login de usuário (JWT)
- CRUD de transações (receitas e despesas)
- Categorias de transações
- Filtros por mês e por categoria
- Dashboard com gráficos

## Stack

- **Backend:** Node.js + Express + Prisma
- **Banco de dados:** PostgreSQL (via Docker em desenvolvimento)
- **Autenticação:** JWT + bcrypt
- **Frontend:** React + Vite + Recharts
- **Testes:** Jest + Supertest

## Como rodar o backend

Pré-requisitos: Node.js 22+ e Docker.

```bash
# 1. Subir o PostgreSQL (na raiz do projeto)
docker compose up -d

# 2. Instalar dependências
cd backend && npm install

# 3. Criar o .env a partir do exemplo e gerar um JWT_SECRET
cp .env.example .env
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# 4. Aplicar as migrations
npx prisma migrate deploy

# 5. Subir o servidor
npm run dev
```

A API fica em `http://localhost:3000`.

Para parar o banco: `docker compose down` (os dados são preservados no volume).

## Testes

```bash
cd backend && npm test
```

Os testes usam um banco separado (`controle_financeiro_test`), criado automaticamente
na primeira vez que o container sobe. Rodar os testes nunca afeta os dados de desenvolvimento.

## Endpoints

| Método | Rota | Protegida | Descrição |
|---|---|---|---|
| GET | `/health` | não | Verifica se a API está no ar |
| POST | `/auth/register` | não | Cria um usuário |
| POST | `/auth/login` | não | Faz login e devolve o token JWT |
| GET | `/auth/me` | sim | Dados do usuário logado |
| GET | `/categories` | sim | Lista as categorias do usuário |
| POST | `/categories` | sim | Cria uma categoria |
| PUT | `/categories/:id` | sim | Renomeia uma categoria |
| DELETE | `/categories/:id` | sim | Exclui uma categoria sem transações |
| GET | `/transactions` | sim | Lista transações (`?month=AAAA-MM`, `?categoryId=N`) |
| POST | `/transactions` | sim | Cria uma transação |
| PUT | `/transactions/:id` | sim | Atualiza uma transação |
| DELETE | `/transactions/:id` | sim | Exclui uma transação |

Rotas protegidas exigem o header `Authorization: Bearer <token>`.

## Estrutura

```
/backend    # API REST
/frontend   # Aplicação React
/docker     # Scripts de inicialização do banco
```

Mais contexto e decisões de projeto em [CLAUDE.md](./CLAUDE.md).
