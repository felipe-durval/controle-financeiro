const express = require('express');
const transactionController = require('../controllers/transaction-controller');
const authMiddleware = require('../middlewares/auth-middleware');

const router = express.Router();

// Nenhuma rota de transacao e publica.
router.use(authMiddleware);

router.get('/', transactionController.list);
router.post('/', transactionController.create);
router.put('/:id', transactionController.update);
router.delete('/:id', transactionController.remove);

module.exports = router;
