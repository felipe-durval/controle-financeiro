const prisma = require('../prisma-client');

const MAX_DESCRIPTION_LENGTH = 100;

// O SQLite nao suporta enum no Prisma, entao o tipo e uma string
// validada aqui na aplicacao.
const VALID_TYPES = ['income', 'expense'];

function parseId(rawId) {
  const id = Number(rawId);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function validateTransactionInput({ description, amount, type, date, categoryId }) {
  const errors = [];

  if (typeof description !== 'string' || description.trim().length === 0) {
    errors.push('A descricao e obrigatoria.');
  } else if (description.trim().length > MAX_DESCRIPTION_LENGTH) {
    errors.push(`A descricao deve ter no maximo ${MAX_DESCRIPTION_LENGTH} caracteres.`);
  }

  // O valor e sempre positivo: quem diz se entra ou sai do bolso e o type.
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    errors.push('O valor deve ser um numero maior que zero.');
  }

  if (!VALID_TYPES.includes(type)) {
    errors.push(`O tipo deve ser ${VALID_TYPES.join(' ou ')}.`);
  }

  if (typeof date !== 'string' || Number.isNaN(Date.parse(date))) {
    errors.push('Informe uma data valida (ex: 2026-08-19).');
  }

  if (!parseId(categoryId)) {
    errors.push('Informe uma categoria valida.');
  }

  return errors;
}

// A categoria precisa existir E pertencer a quem esta fazendo a requisicao,
// senao um usuario poderia lancar transacoes na categoria de outro.
async function findOwnedCategory(categoryId, userId) {
  return prisma.category.findFirst({
    where: { id: parseId(categoryId), userId },
  });
}

const MONTH_REGEX = /^\d{4}-\d{2}$/;

// Converte "2026-08" no intervalo [01/08/2026, 01/09/2026).
// Usamos "maior ou igual ao inicio E menor que o inicio do mes seguinte"
// em vez de "ate dia 31": assim nao precisamos saber quantos dias
// tem cada mes nem tratar ano bissexto.
function buildMonthRange(month) {
  if (!MONTH_REGEX.test(month)) {
    return null;
  }

  const [year, monthNumber] = month.split('-').map(Number);

  if (monthNumber < 1 || monthNumber > 12) {
    return null;
  }

  // Date.UTC evita que o fuso horario da maquina desloque o limite do mes.
  const start = new Date(Date.UTC(year, monthNumber - 1, 1));
  const end = new Date(Date.UTC(year, monthNumber, 1));

  return { gte: start, lt: end };
}

async function list(req, res) {
  try {
    const { month, categoryId } = req.query;

    // O filtro por userId e a base: os filtros opcionais apenas estreitam
    // o resultado, nunca ampliam para alem das transacoes do usuario.
    const where = { userId: req.userId };

    if (month !== undefined) {
      const range = buildMonthRange(month);

      if (!range) {
        return res
          .status(400)
          .json({ error: 'Mes invalido. Use o formato AAAA-MM (ex: 2026-08).' });
      }

      where.date = range;
    }

    if (categoryId !== undefined) {
      const id = parseId(categoryId);

      if (!id) {
        return res.status(400).json({ error: 'Id de categoria invalido.' });
      }

      where.categoryId = id;
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: { category: { select: { id: true, name: true } } },
      orderBy: [{ date: 'desc' }, { id: 'desc' }],
    });

    return res.status(200).json(transactions);
  } catch (error) {
    console.error('Erro ao listar transacoes:', error);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
}

async function create(req, res) {
  try {
    const { description, amount, type, date, categoryId } = req.body ?? {};

    const errors = validateTransactionInput({ description, amount, type, date, categoryId });
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const category = await findOwnedCategory(categoryId, req.userId);
    if (!category) {
      return res.status(404).json({ error: 'Categoria nao encontrada.' });
    }

    const transaction = await prisma.transaction.create({
      data: {
        description: description.trim(),
        amount,
        type,
        date: new Date(date),
        userId: req.userId,
        categoryId: category.id,
      },
      include: { category: { select: { id: true, name: true } } },
    });

    return res.status(201).json(transaction);
  } catch (error) {
    console.error('Erro ao criar transacao:', error);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
}

async function update(req, res) {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Id invalido.' });
    }

    const { description, amount, type, date, categoryId } = req.body ?? {};

    const errors = validateTransactionInput({ description, amount, type, date, categoryId });
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const existing = await prisma.transaction.findFirst({
      where: { id, userId: req.userId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Transacao nao encontrada.' });
    }

    const category = await findOwnedCategory(categoryId, req.userId);
    if (!category) {
      return res.status(404).json({ error: 'Categoria nao encontrada.' });
    }

    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        description: description.trim(),
        amount,
        type,
        date: new Date(date),
        categoryId: category.id,
      },
      include: { category: { select: { id: true, name: true } } },
    });

    return res.status(200).json(transaction);
  } catch (error) {
    console.error('Erro ao atualizar transacao:', error);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
}

async function remove(req, res) {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Id invalido.' });
    }

    const existing = await prisma.transaction.findFirst({
      where: { id, userId: req.userId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Transacao nao encontrada.' });
    }

    await prisma.transaction.delete({ where: { id } });

    return res.status(204).send();
  } catch (error) {
    console.error('Erro ao excluir transacao:', error);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
}

module.exports = { list, create, update, remove };
