# Deploy

Três serviços, todos com plano gratuito permanente e **sem cartão de crédito**:

| Parte | Serviço | Por quê |
|---|---|---|
| Banco de dados | [Neon](https://neon.com) | Postgres gratuito que **não expira**, até 100 projetos |
| Backend | [Render](https://render.com) | Serviço web gratuito, 750 h/mês |
| Frontend | [Vercel](https://vercel.com) | Gratuito para projetos pessoais |

> **Por que o banco não fica no Render:** o PostgreSQL gratuito dele **expira em
> 30 dias** e depois é apagado. Um projeto de portfólio precisa continuar no ar
> enquanto você se candidata a vagas.

---

## 1. Banco de dados (Neon)

1. Entre em [neon.com](https://neon.com) com o GitHub.
2. **Create project** — escolha a região mais próxima (ex: `AWS us-east-2`).
3. Copie a **connection string**. Ela tem este formato:

```
postgresql://usuario:senha@ep-algo-123.us-east-2.aws.neon.tech/neondb?sslmode=require
```

Guarde essa string: ela é o `DATABASE_URL` do passo seguinte.

Use a conexão **direta**, não a `-pooler`. Nossa API é um servidor que fica
ligado, então não precisa do pool externo — e as migrations funcionam melhor
na conexão direta.

O `?sslmode=require` faz parte da string e precisa continuar lá: o Neon só
aceita conexões cifradas.

---

## 2. Backend (Render)

### Criar o serviço

1. Entre em [render.com](https://render.com) com o GitHub.
2. **New → Web Service** e escolha este repositório.
3. Confira as configurações (o [render.yaml](backend/render.yaml) já define,
   mas vale verificar):
   - **Root Directory:** `backend`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npx prisma migrate deploy && npm start`
   - **Instance Type:** `Free`

### Variáveis de ambiente

Em **Environment**, adicione:

| Variável | Valor |
|---|---|
| `DATABASE_URL` | a connection string do Neon (passo 1) |
| `JWT_SECRET` | gere um novo (comando abaixo) |
| `CORS_ORIGIN` | a URL do frontend na Vercel — deixe provisório e ajuste depois |
| `JWT_EXPIRES_IN` | `1d` |
| `TRUST_PROXY` | `true` |
| `NODE_ENV` | `production` |

Gerar o `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

**Nunca reutilize o segredo de desenvolvimento.** Ele já esteve em texto puro
na sua máquina.

**`TRUST_PROXY=true` é obrigatório.** O Render fica atrás de um proxy; sem essa
variável a aplicação enxerga o IP do proxy e o limite de tentativas de login
contaria todos os usuários como uma pessoa só — o primeiro atacante bloquearia
o site inteiro.

### Conferir

Depois do deploy, o Render te dá uma URL. Teste:

```bash
curl https://SEU-APP.onrender.com/health
```

Resposta esperada: `{"status":"ok"}`

---

## 3. Frontend (Vercel)

1. [vercel.com](https://vercel.com) → **Add New → Project** → escolha o repositório.
2. **Root Directory:** `frontend`
3. Framework: Vite (detectado sozinho).
4. Em **Environment Variables**:

| Variável | Valor |
|---|---|
| `VITE_API_URL` | a URL do Render, **sem barra no final** |

5. Deploy.
6. **Volte ao Render** e ajuste `CORS_ORIGIN` para a URL da Vercel.
   Sem isso o navegador bloqueia todas as chamadas do frontend.

Variáveis do Vite entram no código **durante o build**. Se mudar `VITE_API_URL`
depois, é preciso refazer o deploy — salvar a variável não basta.

---

## O que esperar do plano gratuito

**O backend dorme após 15 minutos sem acesso.** A primeira requisição depois
disso demora de 30 a 60 segundos enquanto o serviço acorda; as seguintes são
normais.

Na prática, se você mandar o link para alguém, a primeira tela pode demorar.
Duas formas de contornar:

- Abrir o link alguns minutos antes de mostrar para alguém.
- Um serviço gratuito de ping (ex: [UptimeRobot](https://uptimerobot.com))
  chamando `/health` a cada 10 minutos. Consome as 750 h/mês, que é justamente
  o suficiente para um serviço ficar ligado o mês inteiro.

O banco no Neon também hiberna após 5 minutos parado, mas acorda em menos de
um segundo — esse não incomoda.

---

## Checklist antes de publicar

- [ ] `JWT_SECRET` de produção é novo e tem 32+ caracteres
- [ ] `CORS_ORIGIN` aponta para a URL real da Vercel
- [ ] `TRUST_PROXY=true` no Render
- [ ] `DATABASE_URL` do Neon mantém o `?sslmode=require`
- [ ] `/health` responde `{"status":"ok"}`
- [ ] Cadastro, login e lançamento funcionam pela interface publicada
- [ ] `git ls-files | grep "\.env$"` não retorna nada
