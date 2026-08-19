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
- **Banco de dados:** SQLite (início) → PostgreSQL (via Docker, a partir da Fase 3)
- **Autenticação:** JWT + bcrypt
- **Frontend:** React + Vite + Recharts
- **Testes:** Jest

## Estrutura

```
/backend    # API REST
/frontend   # Aplicação React
```

Mais contexto e decisões de projeto em [CLAUDE.md](./CLAUDE.md).
