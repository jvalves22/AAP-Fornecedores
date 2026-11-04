const express = require('express');
const usuarioController = require('../controllers/usuarioController');

const router = express.Router();

router.post('/', usuarioController.criar);
router.patch('/me/senha', usuarioController.alterarSenha);

module.exports = router;