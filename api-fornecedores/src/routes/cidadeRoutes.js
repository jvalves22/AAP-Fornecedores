const express = require('express');
const cidadeController = require('../controllers/cidadeController');

const router = express.Router();

router.get('/', cidadeController.listar);

module.exports = router;