const express = require('express');
const authController = require('../controllers/auth-controller');
const authMiddleware = require('../middlewares/auth-middleware');

const router = express.Router();

// Rotas publicas: quem ainda nao tem token precisa poder acessar.
router.post('/register', authController.register);
router.post('/login', authController.login);

// Rota protegida: o authMiddleware roda antes do controller.
router.get('/me', authMiddleware, authController.me);

module.exports = router;
