# CLAUDE.md

Este arquivo dá contexto ao Claude Code sobre o projeto. Leia sempre antes de sugerir ou implementar qualquer coisa.

## Sobre o projeto

Sistema de controle financeiro pessoal, feito como projeto de portfólio para candidaturas a estágio em desenvolvimento. O objetivo não é só "funcionar", é ser um projeto que eu (o dev) entendo profundamente e consigo explicar em uma entrevista técnica.

**Funcionalidades principais:**
- Cadastro e login de usuário (autenticação com JWT)
- CRUD de transações (receitas e despesas)
- Categorias de transações (ex: alimentação, transporte, lazer, salário)
- Filtros por mês e por categoria
- Dashboard com gráficos (total gasto, gasto por categoria, evolução mensal)

## Stack técnica

- **Backend:** Node.js + Express
- **Banco de dados:** SQLite no início (migrar para PostgreSQL depois, se der tempo)
- **ORM:** Prisma
- **Autenticação:** JWT + bcrypt para hash de senha
- **Frontend:** React (com Vite)
- **Gráficos:** Recharts
- **Testes:** Jest (backend) + React Testing Library (frontend, se der tempo)
- **Deploy:** Backend no Railway, frontend no Vercel

## Estrutura de pastas esperada

```
/backend
  /src
    /routes
    /controllers
    /models (ou /prisma/schema.prisma)
    /middlewares
    /tests
  server.js
/frontend
  /src
    /components
    /pages
    /services (chamadas de API)
    /hooks
  App.jsx
```

## Convenções de código

- Nomes de arquivos e pastas em inglês, minúsculo, kebab-case (ex: `auth-controller.js`)
- Nomes de variáveis e funções em inglês, camelCase
- Comentários e mensagens de commit em português
- Commits pequenos e descritivos (ex: `feat: adiciona rota de login`, `fix: corrige validação de senha`)
- Sempre validar dados de entrada nas rotas (não confiar no que vem do frontend)
- Tratar erros com respostas HTTP adequadas (400, 401, 404, 500) e mensagens claras

## Como devemos trabalhar juntos (MUITO IMPORTANTE)

Estou usando este projeto para **aprender**, não só para ter algo pronto. Por isso:

1. **Sempre planeje antes de implementar.** Antes de escrever código, me mostre um plano em etapas pequenas e espere minha aprovação.
2. **Uma etapa por vez.** Não implemente várias funcionalidades de uma vez. Implemente uma parte, pare, e explique o que foi feito.
3. **Explique o código gerado.** Depois de cada trecho relevante, explique em português simples o que ele faz e por que essa abordagem foi escolhida (não só "o quê", mas o "porquê").
4. **Não assuma que eu sei tópicos avançados.** Sou estudante de Análise e Desenvolvimento de Sistemas, sei o básico, mas ainda estou pegando o jeito de projetos reais. Se usar algum conceito mais avançado (ex: middleware, JWT, hashing), explique brevemente o conceito antes de aplicá-lo.
5. **Mostre evidências, não apenas afirme que funciona.** Rode os testes, mostre a saída, mostre o resultado de comandos. Não diga só "pronto, está funcionando".
6. **Pergunte antes de tomar decisões arquiteturais grandes** (ex: trocar de banco de dados, mudar estrutura de pastas, adicionar uma lib nova).

## O que evitar

- Não gerar código muito além do que foi pedido na etapa atual
- Não usar bibliotecas ou padrões complexos sem necessidade (mantenha simples, é um projeto de aprendizado)
- Não pular a etapa de testes "porque não dá tempo"
- Não usar senhas, chaves de API ou dados sensíveis direto no código — sempre usar variáveis de ambiente (`.env`)

## Definição de "pronto" (para cada etapa)

Uma etapa só está concluída quando:
- O código funciona (testado manualmente ou com teste automatizado)
- Eu entendi o que foi feito e por quê
- Não há dados sensíveis expostos no código
- O commit foi feito com mensagem clara