const request = require('supertest');
const jwt = require('jsonwebtoken');

const app = require('../app');
const prisma = require('../prisma-client');

const validUser = {
  name: 'Felipe',
  email: 'felipe@exemplo.com',
  password: 'senhaSegura123',
};

// Cada teste comeca com o banco limpo, para um teste nunca
// depender do que outro deixou para tras.
beforeEach(async () => {
  await prisma.transaction.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('POST /auth/register', () => {
  it('cria o usuario e devolve 201', async () => {
    const response = await request(app).post('/auth/register').send(validUser);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      name: validUser.name,
      email: validUser.email,
    });
    expect(response.body.id).toEqual(expect.any(Number));
  });

  it('nunca devolve a senha na resposta', async () => {
    const response = await request(app).post('/auth/register').send(validUser);

    expect(response.body).not.toHaveProperty('password');
  });

  it('salva a senha como hash, nunca em texto puro', async () => {
    await request(app).post('/auth/register').send(validUser);

    const saved = await prisma.user.findUnique({
      where: { email: validUser.email },
    });

    expect(saved.password).not.toBe(validUser.password);
    expect(saved.password).toMatch(/^\$2[aby]\$\d{2}\$/);
  });

  it('normaliza o email para minusculo e sem espacos', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({ ...validUser, email: '  FELIPE@EXEMPLO.COM  ' });

    expect(response.status).toBe(201);
    expect(response.body.email).toBe('felipe@exemplo.com');
  });

  it('recusa email ja cadastrado com 409', async () => {
    await request(app).post('/auth/register').send(validUser);

    const response = await request(app).post('/auth/register').send(validUser);

    expect(response.status).toBe(409);
    expect(response.body.error).toBeDefined();
  });

  it('recusa corpo vazio com 400 e lista os erros', async () => {
    const response = await request(app).post('/auth/register').send({});

    expect(response.status).toBe(400);
    expect(response.body.errors).toHaveLength(3);
  });

  it('recusa email invalido com 400', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({ ...validUser, email: 'nao-e-email' });

    expect(response.status).toBe(400);
  });

  it('recusa senha com menos de 8 caracteres com 400', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({ ...validUser, password: '123' });

    expect(response.status).toBe(400);
  });
});

describe('POST /auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/auth/register').send(validUser);
  });

  it('devolve 200 e um token valido quando as credenciais estao corretas', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ email: validUser.email, password: validUser.password });

    expect(response.status).toBe(200);
    expect(response.body.token).toEqual(expect.any(String));

    const payload = jwt.verify(response.body.token, process.env.JWT_SECRET);
    expect(payload.sub).toBe(response.body.user.id);
  });

  it('nao coloca a senha dentro do token', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ email: validUser.email, password: validUser.password });

    const payload = jwt.verify(response.body.token, process.env.JWT_SECRET);
    expect(JSON.stringify(payload)).not.toContain(validUser.password);
  });

  it('recusa senha errada com 401', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ email: validUser.email, password: 'senhaErrada999' });

    expect(response.status).toBe(401);
  });

  it('recusa email inexistente com 401', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'naoexiste@exemplo.com', password: 'qualquercoisa' });

    expect(response.status).toBe(401);
  });

  it('usa a MESMA mensagem para senha errada e email inexistente', async () => {
    const senhaErrada = await request(app)
      .post('/auth/login')
      .send({ email: validUser.email, password: 'senhaErrada999' });

    const emailInexistente = await request(app)
      .post('/auth/login')
      .send({ email: 'naoexiste@exemplo.com', password: 'qualquercoisa' });

    // Mensagens diferentes revelariam quais emails estao cadastrados.
    expect(senhaErrada.body.error).toBe(emailInexistente.body.error);
  });

  it('recusa corpo vazio com 400', async () => {
    const response = await request(app).post('/auth/login').send({});

    expect(response.status).toBe(400);
  });
});

describe('GET /auth/me (rota protegida)', () => {
  let token;
  let userId;

  beforeEach(async () => {
    await request(app).post('/auth/register').send(validUser);

    const login = await request(app)
      .post('/auth/login')
      .send({ email: validUser.email, password: validUser.password });

    token = login.body.token;
    userId = login.body.user.id;
  });

  it('devolve os dados do usuario logado com token valido', async () => {
    const response = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(userId);
    expect(response.body).not.toHaveProperty('password');
  });

  it('bloqueia com 401 quando nao ha token', async () => {
    const response = await request(app).get('/auth/me');

    expect(response.status).toBe(401);
  });

  it('bloqueia com 401 quando falta o prefixo Bearer', async () => {
    const response = await request(app)
      .get('/auth/me')
      .set('Authorization', token);

    expect(response.status).toBe(401);
  });

  it('bloqueia com 401 quando o token e invalido', async () => {
    const response = await request(app)
      .get('/auth/me')
      .set('Authorization', 'Bearer abc.def.ghi');

    expect(response.status).toBe(401);
  });

  it('bloqueia com 401 quando o token foi adulterado', async () => {
    const [header, , signature] = token.split('.');
    const payloadFalso = Buffer.from(
      JSON.stringify({ sub: 99999, iat: 1, exp: 9999999999 })
    ).toString('base64url');

    const response = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${header}.${payloadFalso}.${signature}`);

    expect(response.status).toBe(401);
  });

  it('bloqueia com 401 quando o token esta expirado', async () => {
    const expirado = jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
      expiresIn: '-1h',
    });

    const response = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${expirado}`);

    expect(response.status).toBe(401);
    expect(response.body.error).toMatch(/expirado/i);
  });

  it('devolve 404 quando o token e valido mas o usuario nao existe mais', async () => {
    await prisma.user.deleteMany();

    const response = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });
});
