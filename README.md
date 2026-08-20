# Controle Financeiro

Aplicação web para acompanhar receitas e despesas pessoais: lançamentos por
categoria, filtros por período e um painel com a evolução dos gastos.

**[▶ Acessar o sistema](https://controle-financeiro-tau-tan.vercel.app)**

Há um botão de acesso à conta de demonstração na tela de login, já com seis
meses de lançamentos — não é preciso criar cadastro para explorar.

| | |
|---|---|
| E-mail | `demo@exemplo.com` |
| Senha | `demo12345` |

> A API roda em plano gratuito e hiberna quando fica sem uso. A primeira visita
> pode levar até um minuto para carregar — a aplicação avisa enquanto isso
> acontece.

![Node](https://img.shields.io/badge/Node.js-22-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma&logoColor=white)
![Testes](https://img.shields.io/badge/testes-102%20passando-brightgreen)

## Funcionalidades

- Autenticação com JWT e senhas protegidas com bcrypt
- Lançamento de receitas e despesas, com edição e exclusão
- Categorias próprias de cada usuário
- Filtros por mês e por categoria, aplicados no banco
- Painel com gastos por categoria e evolução dos últimos seis meses
- Tema claro e escuro

## Stack

| Camada | Tecnologias |
|---|---|
| Backend | Node.js, Express, Prisma |
| Banco de dados | PostgreSQL |
| Autenticação | JWT, bcrypt |
| Frontend | React, Vite, React Router, Recharts |
| Testes | Jest, Supertest |
| Infraestrutura | Docker (desenvolvimento), Render, Neon, Vercel |

## Decisões técnicas

**Isolamento entre contas.** Toda consulta filtra pelo usuário do token, nunca
por um identificador vindo do corpo da requisição. Ao lançar uma transação, a
categoria informada também é verificada — sem isso, alguém poderia usar a
categoria de outra pessoa. Há testes cobrindo tentativas de acesso cruzado em
cada rota.

**Mensagens de erro que não revelam nada.** Senha errada e e-mail inexistente
devolvem a mesma resposta, e as tentativas de login são limitadas por origem.
Respostas de erro nunca expõem caminhos internos ou detalhes da stack.

**Gráficos legíveis por quem não distingue cores.** A paleta evita o par
verde/vermelho, e cada gráfico tem uma versão em tabela para leitores de tela.

**102 testes automatizados** cobrindo autenticação, permissões, validações,
filtros e cabeçalhos de segurança, em um banco separado do de desenvolvimento.

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

## Conta de demonstração

Para recriar os dados da conta de demonstração:

```bash
cd backend && node scripts/seed-demo.js
```

O script usa a API pública em vez do banco, então funciona tanto localmente
quanto contra o ambiente publicado — basta passar a URL como argumento. Ele
remove os lançamentos anteriores antes de gerar os novos, e pode ser executado
quantas vezes for necessário.

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

## Deploy

API no Render, banco PostgreSQL no Neon e interface na Vercel.
Arquitetura e decisões em [DEPLOY.md](./DEPLOY.md).
