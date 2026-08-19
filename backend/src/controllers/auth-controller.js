const bcrypt = require('bcryptjs');
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

module.exports = { register };
