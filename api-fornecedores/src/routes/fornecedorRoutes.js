const express = require('express');
const fornecedorController = require('../controllers/fornecedorController');

const router = express.Router();

router.get('/', fornecedorController.listar);

router.post('/', fornecedorController.criar);

router.get('/:id', fornecedorController.buscarPorId);

router.put('/:id', fornecedorController.atualizar);

router.patch('/:id/ativo', fornecedorController.alterarAtivo);

router.delete('/:id', fornecedorController.excluir);

module.exports = router;