# Deploy

## Backend (Railway)

### 1. Criar o projeto

1. Acesse [railway.app](https://railway.app) e entre com o GitHub.
2. **New Project → Deploy from GitHub repo** e escolha este repositório.
3. Em **Settings → Root Directory**, defina `backend`.
   Sem isso o Railway tenta construir a partir da raiz e não acha o `package.json`.

### 2. Adicionar o banco de dados

1. No projeto, **New → Database → Add PostgreSQL**.
2. O Railway cria a variável `DATABASE_URL` automaticamente.
   Em **Variables** do serviço do backend, referencie a do banco:
   `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`

### 3. Definir as variáveis de ambiente

Em **Variables** do serviço do backend:

| Variável | Valor |
|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
| `JWT_SECRET` | gere um novo (comando abaixo) — **nunca reutilize o de desenvolvimento** |
| `JWT_EXPIRES_IN` | `1d` |
| `CORS_ORIGIN` | a URL do frontend na Vercel (ex: `https://controle-financeiro.vercel.app`) |
| `TRUST_PROXY` | `true` |
| `NODE_ENV` | `production` |

Gerar o `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

`CORS_ORIGIN` só será conhecida depois do deploy do frontend. Coloque um valor
provisório, faça o deploy do frontend, e volte para corrigir.

`TRUST_PROXY=true` é obrigatório: sem ele o limite de tentativas de login conta
todos os usuários como um só, porque a aplicação enxerga o IP do proxy do Railway.

### 4. Deploy

O [railway.json](backend/railway.json) já define tudo:

- **build:** `npm run build` (gera o Prisma Client)
- **start:** `npx prisma migrate deploy && npm start` (aplica as migrations e sobe)
- **healthcheck:** `/health`

Depois do deploy, gere o domínio em **Settings → Networking → Generate Domain**
e confira:

```bash
curl https://SEU-APP.up.railway.app/health
```

A resposta esperada é `{"status":"ok"}`.

---

## Frontend (Vercel)

1. [vercel.com](https://vercel.com) → **Add New → Project** → escolha o repositório.
2. **Root Directory:** `frontend`
3. Framework: Vite (detectado automaticamente).
4. Em **Environment Variables**, defina:

| Variável | Valor |
|---|---|
| `VITE_API_URL` | a URL do backend no Railway, **sem barra no final** |

5. Deploy.
6. Volte ao Railway e ajuste `CORS_ORIGIN` para a URL da Vercel.

Variáveis do Vite são lidas **no momento do build**. Se mudar `VITE_API_URL`
depois, é preciso refazer o deploy — não basta salvar a variável.

---

## Checklist antes de publicar

- [ ] `JWT_SECRET` de produção é novo e tem 32+ caracteres
- [ ] `CORS_ORIGIN` aponta para a URL real do frontend
- [ ] `TRUST_PROXY=true` no Railway
- [ ] `/health` responde 200
- [ ] Cadastro, login e lançamento funcionam pela interface publicada
- [ ] Nenhum `.env` foi commitado (`git ls-files | grep "\.env$"` não retorna nada)
