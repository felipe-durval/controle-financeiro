const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma-client');

// Quantas rodadas de processamento o bcrypt usa para gerar o hash.
// Quanto maior, mais lento (e mais caro de quebrar por forca bruta).
const SALT_ROUNDS = 10;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

// Valida os dados recebidos do frontend. Nunca confiar no que chega.
function validateRegisterInput({ name, email, password }) {
  const errors = [];

  if (typeof name !== 'string' || name.trim().length === 0) {
    errors.push('O nome e obrigatorio.');
  }

  if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push('Informe um email valido.');
  }

  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    errors.push(`A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`);
  }

  return errors;
}

async function register(req, res) {
  try {
    const { name, email, password } = req.body ?? {};

    const errors = validateRegisterInput({ name, email, password });
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Este email ja esta cadastrado.' });
    }

    // Guardamos apenas o hash: a senha original nunca fica salva no banco.
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: passwordHash,
      },
      // Escolhe explicitamente o que volta na resposta,
      // para o hash da senha nunca vazar para o cliente.
      select: { id: true, name: true, email: true, createdAt: true },
    });

    return res.status(201).json(user);
  } catch (error) {
    console.error('Erro ao registrar usuario:', error);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
}

// Hash descartavel de uma senha qualquer. Serve para gastar o mesmo tempo
// de CPU quando o email nao existe, evitando que a diferenca de tempo de
// resposta revele quais emails estao cadastrados.
const DUMMY_HASH = bcrypt.hashSync('senha-que-nunca-sera-usada', SALT_ROUNDS);

function validateLoginInput({ email, password }) {
  const errors = [];

  if (typeof email !== 'string' || email.trim().length === 0) {
    errors.push('O email e obrigatorio.');
  }

  if (typeof password !== 'string' || password.length === 0) {
    errors.push('A senha e obrigatoria.');
  }

  return errors;
}

async function login(req, res) {
  try {
    const { email, password } = req.body ?? {};

    const errors = validateLoginInput({ email, password });
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    const passwordMatches = await bcrypt.compare(
      password,
      user ? user.password : DUMMY_HASH
    );

    // Mensagem generica de proposito: dizer "email nao existe" permitiria
    // descobrir quais emails estao cadastrados no sistema.
    if (!user || !passwordMatches) {
      return res.status(401).json({ error: 'Email ou senha invalidos.' });
    }

    // O token carrega apenas o id do usuario. Nada sensivel entra aqui:
    // o payload de um JWT e apenas codificado em base64, nao criptografado.
    const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    });

    return res.status(200).json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
}

// Rota protegida: o req.userId foi colocado pelo middleware de autenticacao.
async function me(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    // O token pode ser valido mas o usuario ter sido excluido depois.
    if (!user) {
      return res.status(404).json({ error: 'Usuario nao encontrado.' });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error('Erro ao buscar usuario logado:', error);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
}

module.exports = { register, login, me };
