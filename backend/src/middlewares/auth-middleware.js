const jwt = require('jsonwebtoken');

// Middleware: roda ANTES do controller. Se o token for valido, chama next()
// e deixa o userId disponivel na requisicao. Se nao for, corta ali com 401
// e o controller nunca chega a executar.
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Token nao informado.' });
  }

  // O padrao esperado e "Bearer <token>".
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Formato do token invalido. Use: Bearer <token>.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Guardamos so o id. Qualquer outro dado do usuario vem do banco,
    // porque o conteudo do token pode estar desatualizado.
    req.userId = payload.sub;

    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado. Faca login novamente.' });
    }

    return res.status(401).json({ error: 'Token invalido.' });
  }
}

module.exports = authMiddleware;
