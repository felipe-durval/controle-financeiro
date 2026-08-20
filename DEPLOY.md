# Deploy

## Arquitetura em produção

| Camada | Serviço | Observação |
|---|---|---|
| Banco de dados | Neon (PostgreSQL 17) | Conexão direta, SSL com verificação de certificado |
| API | Render | Node 22, migrations aplicadas no start |
| Interface | Vercel | Build estático do Vite |

## Variáveis de ambiente da API

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | String de conexão do PostgreSQL, com `sslmode` |
| `JWT_SECRET` | Segredo de assinatura dos tokens; mínimo de 32 caracteres |
| `JWT_EXPIRES_IN` | Validade do token (padrão `1d`) |
| `CORS_ORIGIN` | Origens autorizadas, separadas por vírgula |
| `TRUST_PROXY` | `true` ou o número de proxies à frente da aplicação |
| `NODE_ENV` | `production` |

O servidor valida essas variáveis na inicialização e **recusa subir** se alguma
estiver ausente ou inválida — falhar no deploy é melhor do que atender
requisições com um segredo fraco ou sem CORS configurado.

Modelo comentado em [backend/.env.example](backend/.env.example).
Configuração do serviço em [backend/render.yaml](backend/render.yaml).

## Decisões

### O banco não fica na mesma plataforma da API

O PostgreSQL gratuito do Render expira 30 dias após a criação e é apagado depois
de um período de carência. Como o projeto precisa continuar acessível por tempo
indeterminado, o banco ficou no Neon, cujo plano gratuito não tem prazo.

### Confiança na cadeia de proxies

O limite de tentativas de login identifica quem chama pelo endereço de origem.
Atrás de um proxy, esse endereço vem do cabeçalho `X-Forwarded-For`, e o Express
precisa saber em quantos saltos confiar.

A configuração inicial confiava em um salto — o que selecionava um balanceador
interno da plataforma, cujo endereço muda a cada requisição. O resultado era um
contador que nunca acumulava: dezenas de tentativas de senha errada passavam sem
bloqueio.

Confiando na cadeia inteira, o endereço passa a ser o de quem realmente chamou.
A contrapartida é que esse cabeçalho é enviado pelo cliente e pode ser forjado.
Fixar o número exato de saltos seria mais seguro, mas depende de a plataforma
documentar quantos são — e um número errado reintroduz o problema.

### Migrations no comando de start

`prisma migrate deploy` roda antes do servidor subir. O comando é idempotente:
sem migrations pendentes, ele apenas confirma o estado e segue. Isso mantém o
schema do banco sincronizado a cada deploy sem intervenção manual.

## Limitações conhecidas

O plano gratuito do Render suspende o serviço após 15 minutos sem tráfego. A
primeira requisição seguinte leva de 30 a 60 segundos para acordá-lo; as demais
respondem normalmente. Um ping periódico em `/health` mantém o serviço ativo
dentro da cota mensal.

O banco também hiberna, mas retoma em menos de um segundo.
