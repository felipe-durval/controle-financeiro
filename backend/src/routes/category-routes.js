const express = require('express');
const categoryController = require('../controllers/category-controller');
const authMiddleware = require('../middlewares/auth-middleware');

const router = express.Router();

// Aplica o middleware a TODAS as rotas deste arquivo de uma vez,
// em vez de repeti-lo em cada linha. Nenhuma rota de categoria e publica.
router.use(authMiddleware);

router.get('/', categoryController.list);
router.post('/', categoryController.create);
router.put('/:id', categoryController.update);
router.delete('/:id', categoryController.remove);

module.exports = router;
