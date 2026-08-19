const prisma = require('../prisma-client');

const MAX_NAME_LENGTH = 50;

function validateName(name) {
  if (typeof name !== 'string' || name.trim().length === 0) {
    return 'O nome da categoria e obrigatorio.';
  }

  if (name.trim().length > MAX_NAME_LENGTH) {
    return `O nome da categoria deve ter no maximo ${MAX_NAME_LENGTH} caracteres.`;
  }

  return null;
}

// Converte o :id da URL (sempre string) em numero, recusando o que nao for valido.
function parseId(rawId) {
  const id = Number(rawId);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function list(req, res) {
  try {
    // O filtro por userId e o que impede um usuario de ver
    // as categorias de outro. Ele nunca pode faltar.
    const categories = await prisma.category.findMany({
      where: { userId: req.userId },
      orderBy: { name: 'asc' },
    });

    return res.status(200).json(categories);
  } catch (error) {
    console.error('Erro ao listar categorias:', error);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
}

async function create(req, res) {
  try {
    const { name } = req.body ?? {};

    const error = validateName(name);
    if (error) {
      return res.status(400).json({ errors: [error] });
    }

    const category = await prisma.category.create({
      // O userId vem do token, nunca do corpo da requisicao:
      // senao o cliente poderia criar categorias para outro usuario.
      data: { name: name.trim(), userId: req.userId },
    });

    return res.status(201).json(category);
  } catch (error) {
    // P2002 = violacao de restricao unica (ja existe categoria com esse nome).
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Voce ja tem uma categoria com esse nome.' });
    }

    console.error('Erro ao criar categoria:', error);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
}

async function update(req, res) {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Id invalido.' });
    }

    const { name } = req.body ?? {};

    const error = validateName(name);
    if (error) {
      return res.status(400).json({ errors: [error] });
    }

    const existing = await prisma.category.findFirst({
      where: { id, userId: req.userId },
    });

    // Responde 404 tanto se a categoria nao existe quanto se e de outro usuario:
    // um 403 revelaria que aquele id existe no sistema.
    if (!existing) {
      return res.status(404).json({ error: 'Categoria nao encontrada.' });
    }

    const category = await prisma.category.update({
      where: { id },
      data: { name: name.trim() },
    });

    return res.status(200).json(category);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Voce ja tem uma categoria com esse nome.' });
    }

    console.error('Erro ao atualizar categoria:', error);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
}

async function remove(req, res) {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Id invalido.' });
    }

    const existing = await prisma.category.findFirst({
      where: { id, userId: req.userId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Categoria nao encontrada.' });
    }

    const transactionCount = await prisma.transaction.count({
      where: { categoryId: id },
    });

    // Excluir a categoria deixaria as transacoes sem referencia,
    // entao o banco recusaria a operacao. Avisamos antes com mensagem clara.
    if (transactionCount > 0) {
      return res.status(409).json({
        error: `Esta categoria tem ${transactionCount} transacao(oes) e nao pode ser excluida.`,
      });
    }

    await prisma.category.delete({ where: { id } });

    // 204 = deu certo e nao ha conteudo para devolver.
    return res.status(204).send();
  } catch (error) {
    console.error('Erro ao excluir categoria:', error);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
}

module.exports = { list, create, update, remove };
